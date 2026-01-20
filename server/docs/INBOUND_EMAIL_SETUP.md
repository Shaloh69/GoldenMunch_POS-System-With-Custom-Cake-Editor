# Inbound Email Setup Guide

This guide explains how to set up customer email reply functionality using Resend's inbound email webhooks. With this feature, customers can reply to admin messages via email, and those replies will automatically appear in the admin MessagingPanel.

## 📋 Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Step-by-Step Setup](#step-by-step-setup)
4. [Testing the Integration](#testing-the-integration)
5. [How It Works](#how-it-works)
6. [Troubleshooting](#troubleshooting)

---

## Overview

### What This Feature Does

- **Before**: Customer email replies went to your email inbox (outside the system)
- **After**: Customer email replies automatically appear in the admin MessagingPanel as new messages

### Architecture

```
Customer Email Client
         ↓ (replies to email)
    Resend Inbound Email Service
         ↓ (webhook POST)
    Your Server (/api/webhooks/resend/inbound)
         ↓ (fetches full email content)
    Email Parser (extracts reply text)
         ↓ (saves to database)
    MessagingPanel (real-time update via SSE)
```

---

## Prerequisites

Before starting, ensure you have:

1. **Resend Account** - Sign up at [resend.com](https://resend.com)
2. **Verified Domain** - Your sending domain must be verified in Resend
3. **API Key** - Already configured in your `.env` file
4. **Public Server URL** - Your server must be accessible from the internet (for webhooks)

---

## Step-by-Step Setup

### Step 1: Configure Inbound Email Address in Resend

1. Log in to [Resend Dashboard](https://resend.com/dashboard)

2. Navigate to **Domains** → Select your domain (e.g., `goldenmunch.dpdns.org`)

3. Click **"Inbound"** or **"Receiving"** tab

4. You'll see an automatically generated inbound email address:
   ```
   anything@yourdomain.resend.app
   ```

   OR you can configure a custom inbound email like:
   ```
   noreply@goldenmunch.dpdns.org
   ```

5. Copy this address - you'll use it in Step 3

### Step 2: Create Webhook Endpoint

1. Navigate to **Webhooks** in Resend Dashboard

2. Click **"Create Webhook"**

3. Configure the webhook:
   - **Endpoint URL**: `https://goldenmunchserver.onrender.com/api/webhooks/resend/inbound`
     - Replace `goldenmunchserver.onrender.com` with your actual domain
     - For local testing with ngrok: `https://abc123.ngrok.io/api/webhooks/resend/inbound`

   - **Events**: Select **`email.received`** only

   - **Status**: Active

4. Click **"Create Webhook"**

5. **Important**: Copy the **Signing Secret** (starts with `whsec_`)

### Step 3: Update Environment Variables

Add the webhook secret to your `.env` file:

```bash
# Resend Webhook Secret (for inbound email signature verification)
RESEND_WEBHOOK_SECRET=whsec_your_actual_secret_here

# Optional: Set admin email to receive notifications
ADMIN_EMAIL=admin@goldenmunch.com
```

Restart your server after updating `.env`:

```bash
npm run dev
```

### Step 4: Verify Webhook Health

Test that your webhook endpoint is accessible:

```bash
curl https://goldenmunchserver.onrender.com/api/webhooks/resend/health
```

Expected response:
```json
{
  "success": true,
  "message": "Webhook endpoint is healthy",
  "data": {
    "endpoint": "/api/webhooks/resend/inbound",
    "status": "ready",
    "timestamp": "2026-01-20T12:00:00.000Z"
  }
}
```

### Step 5: Configure Email Routing (Optional)

If you want replies to `noreply@goldenmunch.dpdns.org` to work:

1. In Resend Dashboard → **Domains** → Your Domain

2. Add **MX Records** to your DNS (provided by Resend):
   ```
   Priority 10: inbound-smtp.resend.com
   ```

3. Wait for DNS propagation (can take up to 48 hours, but usually ~15 minutes)

4. Verify in Resend Dashboard that the status shows "Verified"

---

## Testing the Integration

### Test 1: Health Check

```bash
curl https://goldenmunchserver.onrender.com/api/webhooks/resend/health
```

Should return `200 OK` with status "ready".

### Test 2: Send Test Email from Admin

1. Log in to Admin Panel
2. Open a Custom Cake Request
3. Go to the MessagingPanel
4. Send a message to the customer
5. Customer receives email with subject: `Custom Cake Request #123 - Message from GoldenMunch`

### Test 3: Customer Reply

1. As the customer, reply to the email from your email client
2. Write a test message
3. Send the reply
4. Check the admin MessagingPanel - the reply should appear within 2-5 seconds

### Test 4: Webhook Logs

Check your server logs for webhook activity:

```bash
# You should see logs like:
📨 Processing inbound email: 56761188-7520-42d8-8898-ff6fc54ce618
   From: [email protected]
   Subject: Re: Custom Cake Request #123 - Message from GoldenMunch
   Extracted Request ID: 123
✅ Customer reply saved successfully
```

---

## How It Works

### Email Subject Parsing

The system extracts the request ID from the email subject using these patterns:

- `#123` → Request ID: 123
- `Request #123` → Request ID: 123
- `Custom Cake Request #123` → Request ID: 123
- `Re: Custom Cake Request #123` → Request ID: 123

### Reply Text Extraction

The email parser removes quoted text (previous messages) using common patterns:

- `On Mon, Jan 1, 2024 at 10:00 AM, John wrote:` ← removes everything after
- `From: ... Sent: ... To: ... Subject:` ← Outlook-style headers
- `---` or `___` ← horizontal separators
- `>` or `>>` ← quote markers
- `Original Message` ← forwarded message indicators

Only the customer's new reply text is saved.

### Security

1. **Webhook Signature Verification**: Uses Svix headers to verify requests from Resend
   - `svix-id`: Webhook ID
   - `svix-timestamp`: Request timestamp
   - `svix-signature`: HMAC signature

2. **Sender Verification**: Ensures the reply email matches the customer's email in the database

3. **Request Validation**: Verifies the request ID exists before saving

---

## Troubleshooting

### Issue: Webhook not receiving events

**Possible Causes:**
- Server not accessible from internet
- Webhook URL incorrect
- Firewall blocking Resend IPs

**Solutions:**
```bash
# 1. Test endpoint accessibility
curl https://goldenmunchserver.onrender.com/api/webhooks/resend/health

# 2. Check Resend webhook logs in dashboard
# Navigate to: Webhooks → Your Webhook → Logs

# 3. Use ngrok for local testing
ngrok http 5000
# Then update webhook URL in Resend dashboard
```

### Issue: Replies not appearing in MessagingPanel

**Possible Causes:**
- Request ID not in email subject
- Customer email doesn't match database
- Webhook secret invalid

**Solutions:**
```bash
# Check server logs for errors
tail -f logs/server.log

# Verify request ID in subject
# Subject MUST contain: #123 or Request #123

# Verify customer email matches
# Check database: SELECT * FROM custom_cake_request WHERE request_id = 123;
```

### Issue: Invalid webhook signature

**Error**: `❌ Invalid webhook signature`

**Solutions:**
```bash
# 1. Verify RESEND_WEBHOOK_SECRET in .env matches Resend dashboard
# 2. Restart server after changing .env
# 3. In development, webhook secret can be optional (shows warning)
```

### Issue: Email body not extracted

**Possible Causes:**
- Resend API key invalid
- Email ID not found
- Network issues

**Solutions:**
```bash
# Check Resend API key
# Verify in .env: RESEND_API_KEY=re_xxxxxxxxxxxxx

# Check server logs for API errors
grep "fetch email content" logs/server.log
```

---

## Advanced Configuration

### Custom Reply Parsing

To customize how replies are parsed, edit:

`server/src/services/inboundEmail.service.ts`

```typescript
// Modify this method to change parsing logic
private extractReplyText(content: string): string {
  // Your custom parsing logic here
}
```

### Custom Request ID Extraction

```typescript
// Modify this method to support different subject formats
private extractRequestId(subject: string): number | null {
  // Add custom patterns here
  const patterns = [
    /#(\d+)/,
    /Order\s+#?(\d+)/i, // Example: Order 123
  ];
  // ...
}
```

### Enable Full Svix Verification (Production)

Install Svix library:

```bash
npm install @svix/svix
```

Update `inboundEmail.service.ts`:

```typescript
import { Webhook } from '@svix/svix';

verifyWebhookSignature(payload: string, headers: any): boolean {
  const wh = new Webhook(process.env.RESEND_WEBHOOK_SECRET!);

  try {
    wh.verify(payload, headers);
    return true;
  } catch (error) {
    return false;
  }
}
```

---

## Resources

- [Resend Inbound Email Docs](https://resend.com/docs/dashboard/receiving/introduction)
- [Resend Webhooks Guide](https://resend.com/blog/webhooks)
- [Get Email Content API](https://resend.com/docs/dashboard/receiving/get-email-content)
- [Svix Webhook Verification](https://docs.svix.com/receiving/verifying-payloads/how)

---

## Support

If you encounter issues:

1. Check server logs: `tail -f logs/server.log`
2. Check Resend webhook logs in dashboard
3. Test webhook health endpoint
4. Verify environment variables
5. Check DNS configuration (for custom domains)

For production deployment, ensure:
- ✅ HTTPS enabled
- ✅ Webhook secret configured
- ✅ Domain verified in Resend
- ✅ MX records configured
- ✅ Firewall allows Resend IPs
