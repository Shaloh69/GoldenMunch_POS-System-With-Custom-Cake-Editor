# Xendit Webhook Setup Guide

This guide explains how to set up the Xendit webhook for automatic payment verification in the GoldenMunch POS system.

## 📌 Quick Summary

**Recommended Method:** Manual configuration via Xendit Dashboard (see steps below)

**Why Manual?** The programmatic API method encounters Cloudflare restrictions in certain environments. Manual dashboard setup is more reliable and is Xendit's standard approach for webhook configuration.

**Who Can Do This:** Anyone with access to the Xendit Dashboard. If you only have API keys, ask the account owner to configure the webhook following the steps below.

## 🎯 What This Does

The webhook allows Xendit to automatically notify our server when a QR code payment is completed. This means:
- ✅ Payments are verified instantly
- ✅ No manual checking required
- ✅ Orders are automatically marked as "paid"

## 📋 Prerequisites

1. **Xendit Account Access** - You need access to the Xendit Dashboard
2. **Server deployed and accessible** - Webhook URL: `https://goldenmunch-server.onrender.com/api/webhooks/xendit/qr-payment`

**Webhook URL (copy this):**
```
https://goldenmunch-server.onrender.com/api/webhooks/xendit/qr-payment
```

## 🚀 Webhook Setup (Manual - Recommended)

Since webhook configuration is typically done through the Xendit Dashboard, follow these steps:

### Step 1: Log in to Xendit Dashboard
Go to [https://dashboard.xendit.co/](https://dashboard.xendit.co/) and log in

### Step 2: Select Environment
Make sure you're in the correct environment:
- **Test Mode** - For testing with test credentials
- **Live Mode** - For production use

Toggle between modes using the switch at the top of the dashboard

### Step 3: Navigate to Webhook Settings
1. Click on **Settings** in the left sidebar
2. Select **Webhooks** or **Callbacks**
3. Find the section for **QR Code** webhooks

### Step 4: Set Webhook URL
Configure the webhook URL for QR Code payments:

```
https://goldenmunch-server.onrender.com/api/webhooks/xendit/qr-payment
```

**Important:** You need to set this webhook URL in **BOTH** Test and Live modes separately.

### Step 5: Select Events
Make sure the following events are enabled:
- ✅ QR Code Payment Received
- ✅ QR Code Payment Completed
- ✅ Payment Succeeded

### Step 6: Save and Test
1. Click **Save** or **Update**
2. Use the "Test" button if available to send a test webhook
3. Verify that your server receives the test webhook

## 🖥️ Alternative: Programmatic Setup (Advanced)

**Note:** The programmatic setup script (`setup-xendit-webhook.js`) is provided for reference but may encounter network/firewall restrictions in certain environments.

If you have full dashboard access, **manual setup is recommended** (see above).

### Using the Script (if your environment supports it):

```bash
cd server
node scripts/setup-xendit-webhook.js
```

**Requirements:**
- XENDIT_SECRET_KEY in server/.env.production
- Unrestricted network access to api.xendit.co
- No Cloudflare or firewall restrictions

### Known Issues:
- **Cloudflare Error 1003**: The script may encounter "Direct IP access not allowed" errors in sandboxed or restricted network environments
- **Solution**: Use manual dashboard setup instead

## 📊 Verification

### After Manual Setup:

Once you've configured the webhook in the dashboard, you should see:
- ✅ Webhook URL saved successfully
- ✅ Status shows as "Active"
- ✅ Test webhook sends successfully (if tested)

### Testing the Integration:

1. Create a test QR code payment in your POS app
2. Use Xendit test credentials to complete the payment
3. Check your server logs for incoming webhook
4. Verify order status updates to "paid" automatically

## 🔧 Troubleshooting

### Dashboard Access Issues
**Problem:** You don't have access to the Xendit Dashboard
**Solution:** Contact the account owner to either:
1. Grant you dashboard access, OR
2. Have them configure the webhook using the manual steps above

### Webhook Not Receiving Payments
**Problem:** Orders not updating after payment
**Solution:**
1. Check that webhook URL is correctly configured in dashboard
2. Verify server is deployed and accessible
3. Check server logs for incoming webhook requests
4. Ensure you configured webhook in the correct environment (Test vs Live)

### Script Errors (Programmatic Setup)

#### Error: "XENDIT_SECRET_KEY not found"
**Solution:** Add your Xendit API key to `server/.env.production`

#### Error: "403 Forbidden" or "Cloudflare Error 1003"
**Solution:** Use manual dashboard setup instead. The script cannot bypass Cloudflare protection in restricted environments.

#### Error: "401 Unauthorized"
**Solution:** Your API key is incorrect. Double-check the key in `.env.production`

#### Error: "404 Not Found"
**Solution:** The endpoint may not be available for your account type. Use manual dashboard setup instead.

## 🧪 Testing the Webhook

### Option 1: Using Xendit Dashboard (if you have access)
1. Go to https://dashboard.xendit.co/
2. Navigate to Settings → Webhooks
3. Find your webhook
4. Click "Test" button

### Option 2: Using Test Payments
1. Create a test QR code payment in your cashier app
2. Use Xendit test credentials to complete payment
3. Check if order status changes to "paid" automatically

### Option 3: Manual Test with cURL
```bash
curl -X POST https://goldenmunch-server.onrender.com/api/webhooks/xendit/qr-payment \
  -H "Content-Type: application/json" \
  -d '{
    "event": "qr_code.payment",
    "data": {
      "id": "test-qr-code",
      "reference_id": "ORDER-123",
      "status": "COMPLETED",
      "amount": 500
    }
  }'
```

## 📚 Additional Resources

- [Xendit Webhook Documentation](https://developers.xendit.co/api-reference/#callbacks)
- [Xendit QR Code API](https://developers.xendit.co/api-reference/#qr-codes)
- [Xendit Test Credentials](https://developers.xendit.co/api-reference/#test-scenarios)

## 🔐 Security Notes

- ✅ The webhook endpoint validates all incoming requests
- ✅ Only accepts POST requests from Xendit
- ✅ Verifies payment data before updating order status
- ✅ Logs all webhook events for debugging

## 🆘 Need Help?

If you encounter any issues:
1. Check the server logs for error messages
2. Verify your API key is correct
3. Ensure the server is deployed and accessible
4. Contact Xendit support if webhook registration fails

## 📝 Notes

- **Environment Detection:** The script automatically detects if you're using production or test keys
- **Idempotent:** Safe to run multiple times (won't create duplicate webhooks)
- **Non-Destructive:** Won't delete or modify other webhooks you may have configured
