# Xendit Webhook Setup Guide

This guide explains how to set up the Xendit webhook for automatic payment verification in the GoldenMunch POS system.

## 🎯 What This Does

The webhook allows Xendit to automatically notify our server when a QR code payment is completed. This means:
- ✅ Payments are verified instantly
- ✅ No manual checking required
- ✅ Orders are automatically marked as "paid"

## 📋 Prerequisites

Before running the setup script, make sure you have:

1. **Xendit API Key** (Live or Test)
   - Live key format: `xnd_production_...`
   - Test key format: `xnd_development_...`

2. **API key configured in `.env.production`**
   ```bash
   XENDIT_SECRET_KEY=xnd_production_YOUR_KEY_HERE
   ```

3. **Server deployed and accessible**
   - Webhook URL: `https://goldenmunch-server.onrender.com/api/webhooks/xendit/qr-payment`

## 🚀 Quick Start

### Step 1: Navigate to Server Directory
```bash
cd server
```

### Step 2: Run Setup Script
```bash
node scripts/setup-xendit-webhook.js
```

### Step 3: Follow On-Screen Instructions
The script will:
- ✓ Check for existing webhooks
- ✓ Create or update the webhook
- ✓ Test the webhook endpoint
- ✓ Display confirmation

## 📊 Expected Output

### Success
```
🚀 Xendit Webhook Setup Script
================================

Environment: PRODUCTION
Webhook URL: https://goldenmunch-server.onrender.com/api/webhooks/xendit/qr-payment

📋 Step 1: Checking existing webhooks...
✓ Found 0 existing webhook(s)

📝 Step 2: Creating new webhook...
✓ Webhook created successfully!
   ID: wb_abc123xyz
   URL: https://goldenmunch-server.onrender.com/api/webhooks/xendit/qr-payment

🧪 Step 3: Testing webhook endpoint...
✓ Webhook endpoint is responding correctly!

✅ Webhook setup complete!

📌 Next Steps:
   1. Webhook is now registered with Xendit
   2. Test by creating a QR code payment in your app
   3. Complete payment using GCash/PayMaya test accounts
   4. Check if payment status updates automatically
```

## 🔧 Troubleshooting

### Error: "XENDIT_SECRET_KEY not found"
**Solution:** Add your Xendit API key to `server/.env.production`:
```bash
XENDIT_SECRET_KEY=xnd_production_77PunIZV2LWeHBnPoY5fxM8Gv7st7LAjWVU3dcbsAJG5YkfU7TJ7G3L004rVegH
```

### Error: "401 Unauthorized"
**Solution:** Your API key is incorrect. Double-check the key in `.env.production`.

### Error: "Webhook endpoint test failed"
**Solution:** This is usually fine if the webhook was created successfully. It just means the endpoint couldn't be reached at the moment. The webhook will still work when Xendit sends real payment notifications.

### Error: "Webhook already exists"
**Solution:** The script will detect this and ask if you want to update it. Choose 'y' to update or 'n' to keep the existing webhook.

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
