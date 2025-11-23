import { Response } from 'express';
import { AuthRequest } from '../models/types';
import { query, transaction, callProcedure } from '../config/database';
import { successResponse } from '../utils/helpers';
import { AppError } from '../middleware/error.middleware';
import { getFirstRow, getInsertId } from '../utils/typeGuards';
import QRCode from 'qrcode';
import crypto from 'crypto';
import mysql from 'mysql2/promise';

// ============================================================================
// TYPES
// ============================================================================

interface CustomCakeRequest {
  request_id?: number;
  session_token: string;
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  num_layers: number;
  layer_1_flavor_id?: number;
  layer_2_flavor_id?: number;
  layer_3_flavor_id?: number;
  layer_4_flavor_id?: number;
  layer_5_flavor_id?: number;
  layer_1_size_id?: number;
  layer_2_size_id?: number;
  layer_3_size_id?: number;
  layer_4_size_id?: number;
  layer_5_size_id?: number;
  total_height_cm?: number;
  base_diameter_cm?: number;
  theme_id?: number;
  frosting_color?: string;
  frosting_type?: string;
  candles_count?: number;
  candle_type?: string;
  candle_numbers?: string;
  cake_text?: string;
  text_color?: string;
  text_font?: string;
  text_position?: string;
  decorations_3d?: any;
  special_instructions?: string;
  dietary_restrictions?: string;
  event_type?: string;
  event_date?: string;
  status?: string;
}

interface QRCodeSession {
  session_id?: number;
  session_token: string;
  qr_code_data: string;
  editor_url: string;
  kiosk_id?: string;
  ip_address?: string;
  user_agent?: string;
  status?: string;
  expires_at: Date;
}

// ============================================================================
// 1. GENERATE QR CODE SESSION (Kiosk)
// ============================================================================

/**
 * Generate a new QR code session for custom cake design
 * POST /api/kiosk/custom-cake/generate-qr
 */
export const generateQRSession = async (req: AuthRequest, res: Response) => {
  const { kiosk_id } = req.body;

  // Generate unique session token
  const sessionToken = `session-${Date.now()}-${crypto.randomBytes(8).toString('hex')}`;

  // QR session expires in 30 minutes
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

  // Frontend URL for mobile editor
  const editorUrl = `${process.env.FRONTEND_URL || 'http://localhost:3002'}/cake-editor?session=${sessionToken}`;

  // Generate QR code as data URL
  let qrCodeDataUrl: string;
  try {
    qrCodeDataUrl = await QRCode.toDataURL(editorUrl, {
      width: 400,
      margin: 2,
      color: {
        dark: '#D97706', // amber-600
        light: '#FFFFFF',
      },
    });
  } catch (error) {
    throw new AppError('Failed to generate QR code', 500);
  }

  // Save session to database
  await query(
    `INSERT INTO qr_code_sessions
     (session_token, qr_code_data, editor_url, kiosk_id, ip_address, user_agent, status, expires_at)
     VALUES (?, ?, ?, ?, ?, ?, 'active', ?)`,
    [
      sessionToken,
      qrCodeDataUrl,
      editorUrl,
      kiosk_id || null,
      req.ip,
      req.headers['user-agent'] || null,
      expiresAt,
    ]
  );

  res.json(
    successResponse('QR session created successfully', {
      sessionToken,
      qrCodeUrl: qrCodeDataUrl,
      editorUrl,
      expiresIn: 1800, // 30 minutes in seconds
      expiresAt: expiresAt.toISOString(),
    })
  );
};

// ============================================================================
// 2. VALIDATE SESSION (Mobile Editor)
// ============================================================================

/**
 * Validate QR session token and check if still active
 * GET /api/custom-cake/session/:token
 */
export const validateSession = async (req: AuthRequest, res: Response) => {
  const { token } = req.params;

  const sessions = await query<any[]>(
    `SELECT * FROM qr_code_sessions WHERE session_token = ?`,
    [token]
  );

  const session = getFirstRow(sessions);

  if (!session) {
    throw new AppError('Invalid or expired session', 404);
  }

  // Check if expired
  if (new Date(session.expires_at) < new Date()) {
    await query(
      `UPDATE qr_code_sessions SET status = 'expired' WHERE session_token = ?`,
      [token]
    );
    throw new AppError('Session has expired', 410);
  }

  // Check if already used
  if (session.status === 'used') {
    throw new AppError('Session already used', 410);
  }

  // Update accessed_at timestamp
  await query(
    `UPDATE qr_code_sessions SET accessed_at = NOW() WHERE session_token = ?`,
    [token]
  );

  res.json(
    successResponse('Session is valid', {
      sessionToken: session.session_token,
      expiresAt: session.expires_at,
      status: session.status,
    })
  );
};

// ============================================================================
// 3. GET DESIGN OPTIONS (Flavors, Sizes, Themes)
// ============================================================================

/**
 * Get all available options for cake customization
 * GET /api/custom-cake/options
 */
export const getDesignOptions = async (req: AuthRequest, res: Response) => {
  // Fetch flavors, sizes, and themes in parallel
  const [flavors, sizes, themes] = await Promise.all([
    query<any[]>(
      `SELECT flavor_id, flavor_name, description, image_url, base_price_per_tier, is_premium, is_available
       FROM cake_flavors
       WHERE is_available = TRUE
       ORDER BY is_premium ASC, flavor_name ASC`
    ),
    query<any[]>(
      `SELECT size_id, size_name, diameter_cm, servings, base_price_multiplier, is_available
       FROM cake_sizes
       WHERE is_available = TRUE
       ORDER BY diameter_cm ASC`
    ),
    query<any[]>(
      `SELECT theme_id, theme_name, description, theme_image_url, base_additional_cost, is_available
       FROM custom_cake_theme
       WHERE is_available = TRUE
       ORDER BY theme_name ASC`
    ),
  ]);

  res.json(
    successResponse('Design options retrieved', {
      flavors,
      sizes,
      themes,
      frostingTypes: ['buttercream', 'fondant', 'whipped_cream', 'ganache', 'cream_cheese'],
      candleTypes: ['number', 'regular', 'sparkler', 'none'],
      textFonts: ['script', 'bold', 'elegant', 'playful', 'modern'],
      textPositions: ['top', 'center', 'bottom'],
    })
  );
};

// ============================================================================
// 4. SAVE DRAFT (Auto-save during design)
// ============================================================================

/**
 * Save or update custom cake draft
 * POST /api/custom-cake/save-draft
 */
export const saveDraft = async (req: AuthRequest, res: Response) => {
  const draftData: CustomCakeRequest = req.body;

  if (!draftData.session_token) {
    throw new AppError('Session token is required', 400);
  }

  // Validate session
  const sessions = await query<any[]>(
    `SELECT * FROM qr_code_sessions WHERE session_token = ? AND status = 'active'`,
    [draftData.session_token]
  );

  const session = getFirstRow(sessions);
  if (!session) {
    throw new AppError('Invalid or expired session', 404);
  }

  // Check if draft already exists
  const existingDrafts = await query<any[]>(
    `SELECT request_id FROM custom_cake_request WHERE session_token = ?`,
    [draftData.session_token]
  );

  const existingDraft = getFirstRow(existingDrafts);

  if (existingDraft) {
    // Update existing draft
    await query(
      `UPDATE custom_cake_request
       SET customer_name = ?, customer_phone = ?, customer_email = ?,
           num_layers = ?, layer_1_flavor_id = ?, layer_2_flavor_id = ?, layer_3_flavor_id = ?,
           layer_4_flavor_id = ?, layer_5_flavor_id = ?, layer_1_size_id = ?, layer_2_size_id = ?,
           layer_3_size_id = ?, layer_4_size_id = ?, layer_5_size_id = ?, total_height_cm = ?,
           base_diameter_cm = ?, theme_id = ?, frosting_color = ?, frosting_type = ?,
           candles_count = ?, candle_type = ?, candle_numbers = ?, cake_text = ?,
           text_color = ?, text_font = ?, text_position = ?, decorations_3d = ?,
           special_instructions = ?, dietary_restrictions = ?, event_type = ?, event_date = ?,
           updated_at = NOW()
       WHERE request_id = ?`,
      [
        draftData.customer_name || null,
        draftData.customer_phone || null,
        draftData.customer_email || null,
        draftData.num_layers || 1,
        draftData.layer_1_flavor_id || null,
        draftData.layer_2_flavor_id || null,
        draftData.layer_3_flavor_id || null,
        draftData.layer_4_flavor_id || null,
        draftData.layer_5_flavor_id || null,
        draftData.layer_1_size_id || null,
        draftData.layer_2_size_id || null,
        draftData.layer_3_size_id || null,
        draftData.layer_4_size_id || null,
        draftData.layer_5_size_id || null,
        draftData.total_height_cm || null,
        draftData.base_diameter_cm || null,
        draftData.theme_id || null,
        draftData.frosting_color || null,
        draftData.frosting_type || 'buttercream',
        draftData.candles_count || 0,
        draftData.candle_type || 'regular',
        draftData.candle_numbers || null,
        draftData.cake_text || null,
        draftData.text_color || null,
        draftData.text_font || 'script',
        draftData.text_position || 'top',
        draftData.decorations_3d ? JSON.stringify(draftData.decorations_3d) : null,
        draftData.special_instructions || null,
        draftData.dietary_restrictions || null,
        draftData.event_type || null,
        draftData.event_date || null,
        existingDraft.request_id,
      ]
    );

    res.json(
      successResponse('Draft updated', {
        request_id: existingDraft.request_id,
      })
    );
  } else {
    // Create new draft
    const result = await query(
      `INSERT INTO custom_cake_request
       (session_token, customer_name, customer_phone, customer_email, num_layers,
        layer_1_flavor_id, layer_2_flavor_id, layer_3_flavor_id, layer_4_flavor_id, layer_5_flavor_id,
        layer_1_size_id, layer_2_size_id, layer_3_size_id, layer_4_size_id, layer_5_size_id,
        total_height_cm, base_diameter_cm, theme_id, frosting_color, frosting_type,
        candles_count, candle_type, candle_numbers, cake_text, text_color, text_font, text_position,
        decorations_3d, special_instructions, dietary_restrictions, event_type, event_date, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft')`,
      [
        draftData.session_token,
        draftData.customer_name || null,
        draftData.customer_phone || null,
        draftData.customer_email || null,
        draftData.num_layers || 1,
        draftData.layer_1_flavor_id || null,
        draftData.layer_2_flavor_id || null,
        draftData.layer_3_flavor_id || null,
        draftData.layer_4_flavor_id || null,
        draftData.layer_5_flavor_id || null,
        draftData.layer_1_size_id || null,
        draftData.layer_2_size_id || null,
        draftData.layer_3_size_id || null,
        draftData.layer_4_size_id || null,
        draftData.layer_5_size_id || null,
        draftData.total_height_cm || null,
        draftData.base_diameter_cm || null,
        draftData.theme_id || null,
        draftData.frosting_color || null,
        draftData.frosting_type || 'buttercream',
        draftData.candles_count || 0,
        draftData.candle_type || 'regular',
        draftData.candle_numbers || null,
        draftData.cake_text || null,
        draftData.text_color || null,
        draftData.text_font || 'script',
        draftData.text_position || 'top',
        draftData.decorations_3d ? JSON.stringify(draftData.decorations_3d) : null,
        draftData.special_instructions || null,
        draftData.dietary_restrictions || null,
        draftData.event_type || null,
        draftData.event_date || null,
      ]
    );

    // Link request to QR session
    await query(
      `UPDATE qr_code_sessions SET request_id = ? WHERE session_token = ?`,
      [getInsertId(result), draftData.session_token]
    );

    res.status(201).json(
      successResponse('Draft saved', {
        request_id: getInsertId(result),
      })
    );
  }
};

// ============================================================================
// 5. UPLOAD 3D PREVIEW IMAGES
// ============================================================================

/**
 * Upload 3D render images for custom cake
 * POST /api/custom-cake/upload-images
 */
export const uploadImages = async (req: AuthRequest, res: Response) => {
  const { request_id, images } = req.body;

  if (!request_id) {
    throw new AppError('Request ID is required', 400);
  }

  if (!images || !Array.isArray(images) || images.length === 0) {
    throw new AppError('At least one image is required', 400);
  }

  // Validate request exists
  const requests = await query<any[]>(
    `SELECT request_id FROM custom_cake_request WHERE request_id = ?`,
    [request_id]
  );

  if (requests.length === 0) {
    throw new AppError('Custom cake request not found', 404);
  }

  // Insert images
  const imageInsertPromises = images.map((img: any) =>
    query(
      `INSERT INTO custom_cake_request_images
       (request_id, image_url, image_type, view_angle, file_size, mime_type, width, height)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        request_id,
        img.url,
        img.type || '3d_render',
        img.view_angle || 'front',
        img.file_size || null,
        img.mime_type || 'image/png',
        img.width || null,
        img.height || null,
      ]
    )
  );

  await Promise.all(imageInsertPromises);

  res.json(successResponse('Images uploaded successfully', { count: images.length }));
};

// ============================================================================
// 6. SUBMIT FOR REVIEW
// ============================================================================

/**
 * Submit custom cake request for admin review
 * POST /api/custom-cake/submit
 */
export const submitForReview = async (req: AuthRequest, res: Response) => {
  const { request_id } = req.body;

  if (!request_id) {
    throw new AppError('Request ID is required', 400);
  }

  await transaction(async (conn: mysql.PoolConnection) => {
    // Get request details
    const [requests] = await conn.query<any[]>(
      `SELECT * FROM custom_cake_request WHERE request_id = ?`,
      [request_id]
    );

    const request = getFirstRow(requests);

    if (!request) {
      throw new AppError('Request not found', 404);
    }

    if (request.status !== 'draft') {
      throw new AppError('Only draft requests can be submitted', 400);
    }

    // Validate required fields
    if (!request.customer_name || !request.customer_email || !request.num_layers) {
      throw new AppError('Customer name, email, and number of layers are required', 400);
    }

    // Update status to pending_review
    // Trigger will automatically calculate estimated_price and set submitted_at
    await conn.query(
      `UPDATE custom_cake_request
       SET status = 'pending_review'
       WHERE request_id = ?`,
      [request_id]
    );

    // Create notification for admin
    await conn.query(
      `INSERT INTO custom_cake_notifications
       (request_id, notification_type, recipient_email, subject, message, status)
       VALUES (?, 'submitted', ?, ?, ?, 'pending')`,
      [
        request_id,
        process.env.ADMIN_EMAIL || 'admin@goldenmunch.com',
        'New Custom Cake Request',
        `A new custom cake request from ${request.customer_name} is awaiting your review.`,
      ]
    );
  });

  res.json(successResponse('Request submitted for review'));
};

// ============================================================================
// 7. ADMIN - GET PENDING REQUESTS
// ============================================================================

/**
 * Get all pending custom cake requests for admin review
 * GET /api/admin/custom-cakes/pending
 */
export const getPendingRequests = async (req: AuthRequest, res: Response) => {
  const requests = await query<any[]>(
    `SELECT * FROM v_pending_custom_cakes ORDER BY submitted_at ASC`
  );

  res.json(successResponse('Pending requests retrieved', requests));
};

// ============================================================================
// 8. ADMIN - GET REQUEST DETAILS
// ============================================================================

/**
 * Get detailed information about a custom cake request
 * GET /api/admin/custom-cakes/:requestId
 */
export const getRequestDetails = async (req: AuthRequest, res: Response) => {
  const { requestId } = req.params;

  // Use stored procedure to get complete details
  const results = await callProcedure<any[]>('sp_get_custom_cake_details', [requestId]);

  if (!results || results.length === 0) {
    throw new AppError('Request not found', 404);
  }

  // Results contain 3 result sets: [0] main details, [1] layer details, [2] images
  const mainDetails = getFirstRow(results[0]);
  const layers = results[1] || [];
  const images = results[2] || [];

  res.json(
    successResponse('Request details retrieved', {
      request: mainDetails,
      layers,
      images,
    })
  );
};

// ============================================================================
// 9. ADMIN - APPROVE REQUEST
// ============================================================================

/**
 * Approve custom cake request with pricing and schedule
 * POST /api/admin/custom-cakes/:requestId/approve
 */
export const approveRequest = async (req: AuthRequest, res: Response) => {
  const { requestId } = req.params;
  const {
    approved_price,
    preparation_days,
    scheduled_pickup_date,
    scheduled_pickup_time,
    admin_notes,
  } = req.body;
  const admin_id = req.user?.id;

  if (!approved_price || !preparation_days || !scheduled_pickup_date) {
    throw new AppError('Approved price, preparation days, and pickup date are required', 400);
  }

  await transaction(async (conn: mysql.PoolConnection) => {
    // Update request
    await conn.query(
      `UPDATE custom_cake_request
       SET status = 'approved',
           approved_price = ?,
           preparation_days = ?,
           scheduled_pickup_date = ?,
           scheduled_pickup_time = ?,
           admin_notes = ?,
           reviewed_by = ?,
           reviewed_at = NOW()
       WHERE request_id = ?`,
      [
        approved_price,
        preparation_days,
        scheduled_pickup_date,
        scheduled_pickup_time || null,
        admin_notes || null,
        admin_id,
        requestId,
      ]
    );

    // Get customer email for notification
    const [requests] = await conn.query<any[]>(
      `SELECT customer_email, customer_name FROM custom_cake_request WHERE request_id = ?`,
      [requestId]
    );

    const request = getFirstRow(requests);

    if (request?.customer_email) {
      // Create notification
      await conn.query(
        `INSERT INTO custom_cake_notifications
         (request_id, notification_type, recipient_email, subject, message, status)
         VALUES (?, 'approved', ?, ?, ?, 'pending')`,
        [
          requestId,
          request.customer_email,
          'Your Custom Cake Request is Approved!',
          `Great news! Your custom cake request has been approved. Price: ₱${approved_price}. Pickup: ${scheduled_pickup_date}.`,
        ]
      );
    }
  });

  res.json(successResponse('Request approved successfully'));
};

// ============================================================================
// 10. ADMIN - REJECT REQUEST
// ============================================================================

/**
 * Reject custom cake request with reason
 * POST /api/admin/custom-cakes/:requestId/reject
 */
export const rejectRequest = async (req: AuthRequest, res: Response) => {
  const { requestId } = req.params;
  const { rejection_reason, admin_notes } = req.body;
  const admin_id = req.user?.id;

  if (!rejection_reason) {
    throw new AppError('Rejection reason is required', 400);
  }

  await transaction(async (conn: mysql.PoolConnection) => {
    // Update request
    await conn.query(
      `UPDATE custom_cake_request
       SET status = 'rejected',
           rejection_reason = ?,
           admin_notes = ?,
           reviewed_by = ?,
           reviewed_at = NOW()
       WHERE request_id = ?`,
      [rejection_reason, admin_notes || null, admin_id, requestId]
    );

    // Get customer email
    const [requests] = await conn.query<any[]>(
      `SELECT customer_email, customer_name FROM custom_cake_request WHERE request_id = ?`,
      [requestId]
    );

    const request = getFirstRow(requests);

    if (request?.customer_email) {
      // Create notification
      await conn.query(
        `INSERT INTO custom_cake_notifications
         (request_id, notification_type, recipient_email, subject, message, status)
         VALUES (?, 'rejected', ?, ?, ?, 'pending')`,
        [
          requestId,
          request.customer_email,
          'Custom Cake Request Update',
          `Unfortunately, we cannot fulfill your custom cake request. Reason: ${rejection_reason}`,
        ]
      );
    }
  });

  res.json(successResponse('Request rejected'));
};

// ============================================================================
// 11. CUSTOMER - CHECK STATUS
// ============================================================================

/**
 * Check status of custom cake request (for customer)
 * GET /api/custom-cake/status/:requestId
 */
export const checkStatus = async (req: AuthRequest, res: Response) => {
  const { requestId } = req.params;

  const requests = await query<any[]>(
    `SELECT request_id, status, submitted_at, reviewed_at, estimated_price,
            approved_price, scheduled_pickup_date, scheduled_pickup_time,
            rejection_reason, preparation_days
     FROM custom_cake_request
     WHERE request_id = ?`,
    [requestId]
  );

  const request = getFirstRow(requests);

  if (!request) {
    throw new AppError('Request not found', 404);
  }

  res.json(successResponse('Status retrieved', request));
};

// ============================================================================
// 12. CASHIER - GET APPROVED ORDERS
// ============================================================================

/**
 * Get approved custom cake orders ready for payment
 * GET /api/cashier/custom-cakes/approved
 */
export const getApprovedOrders = async (req: AuthRequest, res: Response) => {
  const orders = await query<any[]>(
    `SELECT * FROM v_approved_custom_cakes
     WHERE order_id IS NULL
     ORDER BY scheduled_pickup_date ASC`
  );

  res.json(successResponse('Approved orders retrieved', orders));
};

// ============================================================================
// 13. CASHIER - PROCESS PAYMENT
// ============================================================================

/**
 * Process payment for approved custom cake and create order
 * POST /api/cashier/custom-cakes/:requestId/process-payment
 */
export const processPayment = async (req: AuthRequest, res: Response) => {
  const { requestId } = req.params;
  const { payment_method, amount_paid } = req.body;
  const cashier_id = req.user?.id;

  if (!payment_method || !amount_paid) {
    throw new AppError('Payment method and amount are required', 400);
  }

  const orderId = await transaction(async (conn: mysql.PoolConnection) => {
    // Get request details
    const [requests] = await conn.query<any[]>(
      `SELECT * FROM custom_cake_request WHERE request_id = ? AND status = 'approved'`,
      [requestId]
    );

    const request = getFirstRow(requests);

    if (!request) {
      throw new AppError('Approved request not found', 404);
    }

    if (request.order_id) {
      throw new AppError('Payment already processed for this request', 400);
    }

    // Verify amount
    if (parseFloat(amount_paid) < parseFloat(request.approved_price)) {
      throw new AppError('Insufficient payment amount', 400);
    }

    // Create customer order
    const [orderResult] = await conn.query<any>(
      `INSERT INTO customer_order
       (customer_name, customer_email, customer_phone, order_type, status,
        total_amount, payment_method, payment_status, notes, cashier_id)
       VALUES (?, ?, ?, 'custom_cake', 'pending', ?, ?, 'completed', ?, ?)`,
      [
        request.customer_name,
        request.customer_email,
        request.customer_phone,
        request.approved_price,
        payment_method,
        `Custom Cake - Pickup: ${request.scheduled_pickup_date}`,
        cashier_id,
      ]
    );

    const newOrderId = orderResult.insertId;

    // Link order to request
    await conn.query(
      `UPDATE custom_cake_request
       SET order_id = ?, status = 'completed'
       WHERE request_id = ?`,
      [newOrderId, requestId]
    );

    // Create notification
    if (request.customer_email) {
      await conn.query(
        `INSERT INTO custom_cake_notifications
         (request_id, notification_type, recipient_email, subject, message, status)
         VALUES (?, 'completed', ?, ?, ?, 'pending')`,
        [
          requestId,
          request.customer_email,
          'Payment Confirmed - Custom Cake Order',
          `Your payment has been processed. Order #${newOrderId}. Pickup: ${request.scheduled_pickup_date}.`,
        ]
      );
    }

    return newOrderId;
  });

  res.json(successResponse('Payment processed successfully', { order_id: orderId }));
};
