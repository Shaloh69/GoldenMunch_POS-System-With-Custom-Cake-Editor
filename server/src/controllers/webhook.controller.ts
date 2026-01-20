import { Request, Response } from 'express';
import { inboundEmailService } from '../services/inboundEmail.service';
import logger from '../utils/logger';
import { successResponse, errorResponse } from '../utils/helpers';

/**
 * Handle Resend inbound email webhook
 * @route POST /api/webhooks/resend/inbound
 */
export const handleResendInboundWebhook = async (req: Request, res: Response) => {
  try {
    logger.info('📨 Received Resend inbound webhook request', {
      ip: req.ip,
      headers: req.headers,
    });

    // Get raw body for signature verification
    const rawBody = JSON.stringify(req.body);

    // Extract Svix headers for signature verification
    const svixHeaders = {
      'svix-id': req.headers['svix-id'] as string,
      'svix-timestamp': req.headers['svix-timestamp'] as string,
      'svix-signature': req.headers['svix-signature'] as string,
    };

    logger.info('Verifying webhook signature...');

    // Verify webhook signature
    const isValid = inboundEmailService.verifyWebhookSignature(rawBody, svixHeaders);
    if (!isValid) {
      logger.warn('❌ Invalid webhook signature. Rejecting request.', {
        svix_id: svixHeaders['svix-id'],
        ip: req.ip,
      });
      return res.status(401).json(errorResponse('Invalid webhook signature'));
    }

    const event = req.body;

    // Check if this is an email.received event
    if (event.type !== 'email.received') {
      logger.info(`⚠️  Ignoring webhook event type: ${event.type}`, {
        event_type: event.type,
        email_id: event.data?.email_id,
      });
      return res.json(successResponse('Event type ignored', { type: event.type }));
    }

    logger.info('✅ Webhook signature verified. Processing email.received event.', {
      email_id: event.data?.email_id,
      from: event.data?.from,
      subject: event.data?.subject,
    });

    // Process the inbound email asynchronously
    // We respond immediately to avoid timeouts, then process in background
    inboundEmailService.processInboundEmail(event).catch((error) => {
      // Add more context to background processing errors for easier debugging
      logger.error('❌ Error processing inbound email in background:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        email_id: event.data?.email_id,
        subject: event.data?.subject,
        error_details: error,
      });
    });

    // Respond quickly to Resend (they expect a 200 response within a few seconds)
    res.status(200).json(successResponse('Webhook received and processing', {
      email_id: event.data?.email_id,
      from: event.data?.from,
      subject: event.data?.subject,
    }));
  } catch (error) {
    logger.error('❌ Unhandled error in webhook handler', {
      message: error instanceof Error ? error.message : 'Unknown error',
      error_details: error,
    });

    // Still respond with 200 to prevent Resend from retrying
    // Log the error but acknowledge receipt
    res.status(200).json(successResponse('Webhook received with errors', {
      error: error instanceof Error ? error.message : 'Unknown error',
    }));
  }
};

/**
 * Health check endpoint for webhook configuration
 * @route GET /api/webhooks/resend/health
 */
export const webhookHealthCheck = async (_req: Request, res: Response) => {
  res.json(successResponse('Webhook endpoint is healthy', {
    endpoint: '/api/webhooks/resend/inbound',
    status: 'ready',
    timestamp: new Date().toISOString(),
  }));
};
