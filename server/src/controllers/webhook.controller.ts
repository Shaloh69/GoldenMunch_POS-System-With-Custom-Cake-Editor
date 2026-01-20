import { Request, Response } from 'express';
import { inboundEmailService } from '../services/inboundEmail.service';
import { successResponse, errorResponse } from '../utils/helpers';

/**
 * Handle Resend inbound email webhook
 * @route POST /api/webhooks/resend/inbound
 */
export const handleResendInboundWebhook = async (req: Request, res: Response) => {
  try {
    console.log('📨 Received Resend inbound email webhook');

    // Get raw body for signature verification
    const rawBody = JSON.stringify(req.body);

    // Extract Svix headers for signature verification
    const svixHeaders = {
      'svix-id': req.headers['svix-id'] as string,
      'svix-timestamp': req.headers['svix-timestamp'] as string,
      'svix-signature': req.headers['svix-signature'] as string,
    };

    // Verify webhook signature
    const isValid = inboundEmailService.verifyWebhookSignature(rawBody, svixHeaders);
    if (!isValid) {
      console.error('❌ Invalid webhook signature');
      return res.status(401).json(errorResponse('Invalid webhook signature'));
    }

    const event = req.body;

    // Check if this is an email.received event
    if (event.type !== 'email.received') {
      console.log(`⚠️  Ignoring webhook event type: ${event.type}`);
      return res.json(successResponse('Event type ignored', { type: event.type }));
    }

    // Process the inbound email asynchronously
    // We respond immediately to avoid timeouts, then process in background
    inboundEmailService.processInboundEmail(event).catch((error) => {
      console.error('❌ Error processing inbound email in background:', error);
    });

    // Respond quickly to Resend (they expect a 200 response within a few seconds)
    res.status(200).json(successResponse('Webhook received and processing', {
      email_id: event.data?.email_id,
      from: event.data?.from,
      subject: event.data?.subject,
    }));
  } catch (error) {
    console.error('❌ Error in webhook handler:', error);

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
