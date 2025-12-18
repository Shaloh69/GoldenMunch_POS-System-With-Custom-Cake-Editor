import { Response } from 'express';
import { AuthRequest } from '../models/types';
import { query, transaction, callProcedure } from '../config/database';
import { successResponse } from '../utils/helpers';
import { AppError } from '../middleware/error.middleware';
import { getFirstRow, getInsertId } from '../utils/typeGuards';
import QRCode from 'qrcode';
import crypto from 'crypto';
import mysql from 'mysql2/promise';
import { emailService } from '../services/email.service';
import { capacityService } from '../services/capacity.service';
import logger from '../utils/logger';

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

// Database row types for query results
interface QRSessionRow {
  session_id: number;
  session_token: string;
  qr_code_data: string;
  editor_url: string;
  kiosk_id?: string;
  ip_address?: string;
  user_agent?: string;
  status: string;
  expires_at: Date;
  created_at: Date;
  request_id?: number;
  is_valid?: number; // Computed column: (expires_at > NOW()) as is_valid
}

interface CustomCakeRequestRow {
  request_id: number;
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
  decorations_3d?: string;
  special_instructions?: string;
  dietary_restrictions?: string;
  event_type?: string;
  event_date?: string;
  status: string;
  estimated_price?: number;
  approved_price?: number;
  preparation_days?: number;
  scheduled_pickup_date?: string;
  scheduled_pickup_time?: string;
  admin_notes?: string;
  rejection_reason?: string;
  reviewed_by?: number;
  reviewed_at?: Date;
  submitted_at?: Date;
  created_at: Date;
  updated_at: Date;
  order_id?: number;
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

  // Mobile Editor URL - served from backend server (accessible via network)
  // In production, MOBILE_EDITOR_URL or BACKEND_URL must be set
  const baseUrl = process.env.MOBILE_EDITOR_URL || process.env.BACKEND_URL;

  logger.info('🔧 Environment check:', {
    NODE_ENV: process.env.NODE_ENV,
    MOBILE_EDITOR_URL: process.env.MOBILE_EDITOR_URL,
    BACKEND_URL: process.env.BACKEND_URL,
    baseUrl: baseUrl,
  });

  if (!baseUrl) {
    if (process.env.NODE_ENV === 'production') {
      logger.error('❌ CRITICAL: MOBILE_EDITOR_URL or BACKEND_URL not set in production!');
      throw new AppError('MOBILE_EDITOR_URL or BACKEND_URL environment variable is required in production', 500);
    }
    // Development fallback
    logger.warn('⚠️  MOBILE_EDITOR_URL not set, using localhost fallback');
  }

  const editorUrl = `${baseUrl || 'http://localhost:3001'}/?session=${sessionToken}`;
  logger.info('📱 Generated editor URL:', editorUrl);

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

  // Save session to database using MySQL DATE_ADD for timezone reliability
  // This ensures the expiry time is calculated by MySQL server, avoiding timezone issues
  // Session expires in 2 hours (increased from 30 minutes to give users more time)
  await query(
    `INSERT INTO qr_code_sessions
     (session_token, qr_code_data, editor_url, kiosk_id, ip_address, user_agent, status, expires_at)
     VALUES (?, ?, ?, ?, ?, ?, 'active', DATE_ADD(NOW(), INTERVAL 2 HOUR))`,
    [
      sessionToken,
      qrCodeDataUrl,
      editorUrl,
      kiosk_id || null,
      req.ip,
      req.headers['user-agent'] || null,
    ]
  );

  // Get the actual expires_at value from database for response
  const [sessions] = await query<any[]>(
    `SELECT session_id, expires_at, created_at FROM qr_code_sessions WHERE session_token = ?`,
    [sessionToken]
  );

  const actualExpiresAt = sessions[0]?.expires_at || new Date(Date.now() + 2 * 60 * 60 * 1000);

  logger.info(`✅ QR Session created: ${sessionToken.substring(0, 20)}... (expires in 2 hours)`);
  logger.info(`💾 Session saved to database:`, {
    session_id: sessions[0]?.session_id,
    created_at: sessions[0]?.created_at,
    expires_at: sessions[0]?.expires_at,
    editorUrl: editorUrl,
  });

  res.json(
    successResponse('QR session created successfully', {
      sessionToken,
      qrCodeUrl: qrCodeDataUrl,
      editorUrl,
      expiresIn: 7200, // 2 hours in seconds
      expiresAt: actualExpiresAt,
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

  logger.info(`📲 Validating session: ${token.substring(0, 20)}...`);
  logger.info(`📍 Request origin: ${req.headers.origin || 'No origin'}, IP: ${req.ip}`);

  const sessions = await query<any[]>(
    `SELECT *, NOW() as server_time FROM qr_code_sessions WHERE session_token = ?`,
    [token]
  );

  const session = getFirstRow<QRSessionRow>(sessions);

  if (!session) {
    logger.warn(`❌ Session not found in database: ${token.substring(0, 20)}...`);
    logger.warn(`🔍 Checking recent sessions in database...`);

    // Show last 5 sessions for debugging
    const recentSessions = await query<any[]>(
      `SELECT session_token, status, created_at, expires_at
       FROM qr_code_sessions
       ORDER BY created_at DESC
       LIMIT 5`
    );
    logger.info(`📊 Last 5 sessions in DB:`, recentSessions);

    throw new AppError('Invalid or expired session', 404);
  }

  const serverTime = new Date((session as any).server_time);
  const expiresAt = new Date(session.expires_at);
  const timeUntilExpiry = expiresAt.getTime() - serverTime.getTime();
  const minutesRemaining = Math.floor(timeUntilExpiry / 60000);

  logger.info(`⏰ Session time check - Server: ${serverTime.toISOString()}, Expires: ${expiresAt.toISOString()}, Remaining: ${minutesRemaining} min`);

  // Check if expired using the time difference calculated from the same query
  // This is more reliable than a separate NOW() query which might have timezone issues
  if (timeUntilExpiry <= 0) {
    logger.warn(`❌ Session expired: ${token.substring(0, 20)}... (expired ${Math.abs(minutesRemaining)} min ago)`);
    await query(
      `UPDATE qr_code_sessions SET status = 'expired' WHERE session_token = ?`,
      [token]
    );
    throw new AppError('Session has expired', 410);
  }

  // Check if already used
  if (session.status === 'used') {
    logger.warn(`❌ Session already used: ${token.substring(0, 20)}...`);
    throw new AppError('Session already used', 410);
  }

  logger.info(`✅ Session valid: ${token.substring(0, 20)}... (${minutesRemaining} min remaining)`);

  res.json(
    successResponse('Session is valid', {
      sessionToken: session.session_token,
      expiresAt: session.expires_at,
      status: session.status,
      minutesRemaining: Math.max(0, minutesRemaining),
    })
  );
};

// ============================================================================
// 2a. DEBUG - Get Session Info (for troubleshooting)
// ============================================================================

/**
 * Get diagnostic information about a session
 * GET /api/custom-cake/session/:token/debug
 */
export const debugSession = async (req: AuthRequest, res: Response) => {
  const { token } = req.params;

  const [sessions] = await query<any[]>(
    `SELECT
      session_token,
      status,
      created_at,
      expires_at,
      NOW() as server_time,
      TIMESTAMPDIFF(MINUTE, NOW(), expires_at) as minutes_remaining,
      (expires_at > NOW()) as is_valid,
      kiosk_id,
      ip_address,
      request_id
     FROM qr_code_sessions
     WHERE session_token = ?`,
    [token]
  );

  if (sessions.length === 0) {
    throw new AppError('Session not found', 404);
  }

  const session = sessions[0];

  res.json(
    successResponse('Session debug info', {
      ...session,
      diagnosis: {
        found: true,
        isValid: !!session.is_valid,
        minutesRemaining: session.minutes_remaining || 0,
        status: session.status,
        hasRequest: !!session.request_id,
      },
    })
  );
};

/**
 * List recent sessions (for debugging)
 * GET /api/custom-cake/sessions/recent
 */
export const listRecentSessions = async (req: AuthRequest, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 10;

  const [sessions] = await query<any[]>(
    `SELECT
      session_id,
      LEFT(session_token, 30) as session_token_preview,
      status,
      created_at,
      expires_at,
      TIMESTAMPDIFF(MINUTE, NOW(), expires_at) as minutes_remaining,
      (expires_at > NOW()) as is_valid,
      kiosk_id
     FROM qr_code_sessions
     ORDER BY created_at DESC
     LIMIT ?`,
    [limit]
  );

  res.json(
    successResponse('Recent sessions', {
      total: sessions.length,
      sessions,
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
      `SELECT flavor_id, flavor_name, description, image_url, base_price_per_tier, flavor_category, is_available
       FROM cake_flavors
       WHERE is_available = TRUE
       ORDER BY flavor_category ASC, flavor_name ASC`
    ),
    query<any[]>(
      `SELECT size_id, size_name, diameter_cm, servings, base_price_multiplier, is_available
       FROM cake_sizes
       WHERE is_available = TRUE
       ORDER BY diameter_cm ASC`
    ),
    query<any[]>(
      `SELECT theme_id, theme_name, description, sample_image_url as theme_image_url, base_additional_cost, is_available
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

  const session = getFirstRow<QRSessionRow>(sessions);
  if (!session) {
    throw new AppError('Invalid or expired session', 404);
  }

  // Check if draft already exists
  const existingDrafts = await query<any[]>(
    `SELECT request_id FROM custom_cake_request WHERE session_token = ?`,
    [draftData.session_token]
  );

  const existingDraft = getFirstRow<CustomCakeRequestRow>(existingDrafts);

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
       (request_id, image_url, image_type, view_angle)
       VALUES (?, ?, ?, ?)`,
      [
        request_id,
        img.url,
        img.type || '3d_render',
        img.view_angle || 'front',
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

    const request = getFirstRow<CustomCakeRequestRow>(requests);

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
       (request_id, notification_type, recipient_email, subject, message_body, status)
       VALUES (?, 'submission_received', ?, ?, ?, 'pending')`,
      [
        request_id,
        process.env.ADMIN_EMAIL || 'admin@goldenmunch.com',
        'New Custom Cake Request',
        `A new custom cake request from ${request.customer_name} is awaiting your review.`,
      ]
    );
  });

  // Send admin notification email (async, don't wait for it)
  emailService.notifyAdminNewRequest(request_id).catch((error) => {
    console.error('Failed to send admin notification email:', error);
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

/**
 * Get ALL custom cake requests (all statuses) for admin management
 * GET /api/admin/custom-cakes
 */
export const getAllRequests = async (req: AuthRequest, res: Response) => {
  const requests = await query<any[]>(
    `SELECT * FROM custom_cake_request
     WHERE status != 'draft'
     ORDER BY
       CASE status
         WHEN 'pending_review' THEN 1
         WHEN 'approved' THEN 2
         WHEN 'rejected' THEN 3
         WHEN 'completed' THEN 4
         WHEN 'cancelled' THEN 5
         ELSE 6
       END,
       submitted_at DESC`
  );

  res.json(successResponse('All custom cake requests retrieved', requests));
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

  /**
   * Results contain 3 result sets from sp_get_custom_cake_details:
   * [0] main request details (with joined flavor/size names)
   * [1] request images (from custom_cake_request_images table)
   * [2] notifications (from custom_cake_notifications table)
   */
  const mainDetails = getFirstRow(results[0]);
  const images = results[1] || [];
  const notifications = results[2] || [];

  // Build layers array from the flattened data in mainDetails
  const layers = [];
  for (let i = 1; i <= (mainDetails.num_layers || 0); i++) {
    layers.push({
      layer_number: i,
      flavor_name: mainDetails[`layer_${i}_flavor`],
      size_name: mainDetails[`layer_${i}_size`],
    });
  }

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

  // Check capacity availability
  const availability = await capacityService.checkDateAvailability(scheduled_pickup_date);
  if (!availability.available) {
    throw new AppError(
      `Selected pickup date is fully booked (${availability.currentOrders}/${availability.maxOrders} orders). Please choose another date.`,
      400
    );
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

    const request = getFirstRow<CustomCakeRequestRow>(requests);

    if (request?.customer_email) {
      // Create notification
      await conn.query(
        `INSERT INTO custom_cake_notifications
         (request_id, notification_type, recipient_email, subject, message_body, status)
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

  // Reserve capacity slot for the pickup date
  await capacityService.reserveSlot(scheduled_pickup_date);

  // Process pending notifications (send approval email)
  emailService.processPendingNotifications().catch((error) => {
    console.error('Failed to send approval notification:', error);
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

    const request = getFirstRow<CustomCakeRequestRow>(requests);

    if (request?.customer_email) {
      // Create notification
      await conn.query(
        `INSERT INTO custom_cake_notifications
         (request_id, notification_type, recipient_email, subject, message_body, status)
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

  // Process pending notifications (send rejection email)
  emailService.processPendingNotifications().catch((error) => {
    console.error('Failed to send rejection notification:', error);
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

  const request = getFirstRow<CustomCakeRequestRow>(requests);

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

    const request = getFirstRow<CustomCakeRequestRow>(requests);

    if (!request) {
      throw new AppError('Approved request not found', 404);
    }

    if (request.order_id) {
      throw new AppError('Payment already processed for this request', 400);
    }

    // Verify amount
    if (Number(amount_paid) < Number(request.approved_price)) {
      throw new AppError('Insufficient payment amount', 400);
    }

    // Find or create customer record
    let customerId = null;
    if (request.customer_phone) {
      // Check if customer exists
      const [existingCustomer] = await conn.query<any>(
        `SELECT customer_id FROM customer WHERE phone = ?`,
        [request.customer_phone]
      );

      if (existingCustomer.length > 0) {
        customerId = existingCustomer[0].customer_id;
      } else {
        // Create new customer
        const [customerResult] = await conn.query<any>(
          `INSERT INTO customer (name, phone, email) VALUES (?, ?, ?)`,
          [request.customer_name || 'Walk-in Customer', request.customer_phone, request.customer_email]
        );
        customerId = customerResult.insertId;
      }
    }

    // Create customer order with correct column names
    const [orderResult] = await conn.query<any>(
      `INSERT INTO customer_order
       (customer_id, order_type, order_status, order_source,
        total_amount, final_amount, payment_method, payment_status,
        special_instructions, cashier_id, scheduled_pickup_datetime)
       VALUES (?, 'custom_cake', 'pending', 'cashier', ?, ?, ?, 'paid', ?, ?, ?)`,
      [
        customerId,
        request.approved_price,
        request.approved_price, // final_amount = total_amount
        payment_method,
        `Custom Cake - Pickup: ${request.scheduled_pickup_date}`,
        cashier_id,
        request.scheduled_pickup_date || null,
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
         (request_id, notification_type, recipient_email, subject, message_body, status)
         VALUES (?, 'ready_for_pickup', ?, ?, ?, 'pending')`,
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

  // Process pending notifications (send payment confirmation email)
  emailService.processPendingNotifications().catch((error) => {
    console.error('Failed to send payment confirmation notification:', error);
  });

  res.json(successResponse('Payment processed successfully', { order_id: orderId }));
};

// ============================================================================
// 14. POLL SESSION FOR KIOSK (Check if customization is complete)
// ============================================================================

/**
 * Poll QR session to check if user has completed customization
 * GET /api/kiosk/custom-cake/session/:token/poll
 *
 * This endpoint bridges the NEW database-backed API with the Kiosk's polling workflow.
 * Returns completion status and customization data when available.
 */
export const pollSessionForKiosk = async (req: AuthRequest, res: Response) => {
  const { token } = req.params;

  // Validate session exists and is not expired
  const sessions = await query<any[]>(
    `SELECT *, (expires_at > NOW()) as is_valid FROM qr_code_sessions WHERE session_token = ?`,
    [token]
  );

  const session = getFirstRow<QRSessionRow>(sessions);

  if (!session) {
    throw new AppError('Session not found', 404);
  }

  if (!session.is_valid) {
    throw new AppError('Session has expired', 410);
  }

  // Check if there's a custom cake request for this session
  const requests = await query<any[]>(
    `SELECT * FROM custom_cake_request WHERE session_token = ? ORDER BY created_at DESC LIMIT 1`,
    [token]
  );

  const request = getFirstRow<CustomCakeRequestRow>(requests);

  // If no request yet, status is pending
  if (!request) {
    res.json(
      successResponse('Session status', {
        status: 'pending',
        customizationData: null,
      })
    );
    return;
  }

  // Check request status
  if (request.status === 'draft') {
    // Still being customized
    res.json(
      successResponse('Session status', {
        status: 'in_progress',
        customizationData: null,
      })
    );
  } else if (request.status === 'pending_review') {
    // User submitted - treat as completed for Kiosk purposes
    // Extract customization data
    const customizationData = {
      customer_name: request.customer_name,
      customer_email: request.customer_email,
      customer_phone: request.customer_phone,
      num_layers: request.num_layers,
      layer_1_flavor_id: request.layer_1_flavor_id,
      layer_2_flavor_id: request.layer_2_flavor_id,
      layer_3_flavor_id: request.layer_3_flavor_id,
      layer_4_flavor_id: request.layer_4_flavor_id,
      layer_5_flavor_id: request.layer_5_flavor_id,
      layer_1_size_id: request.layer_1_size_id,
      layer_2_size_id: request.layer_2_size_id,
      layer_3_size_id: request.layer_3_size_id,
      layer_4_size_id: request.layer_4_size_id,
      layer_5_size_id: request.layer_5_size_id,
      theme_id: request.theme_id,
      frosting_color: request.frosting_color,
      frosting_type: request.frosting_type,
      candles_count: request.candles_count,
      candle_type: request.candle_type,
      cake_text: request.cake_text,
      special_instructions: request.special_instructions,
      dietary_restrictions: request.dietary_restrictions,
      event_type: request.event_type,
      event_date: request.event_date,
      estimated_price: request.estimated_price,
    };

    res.json(
      successResponse('Session status', {
        status: 'completed',
        customizationData,
      })
    );
  } else {
    // Other statuses (approved, rejected, completed)
    res.json(
      successResponse('Session status', {
        status: request.status,
        customizationData: null,
      })
    );
  }
};
