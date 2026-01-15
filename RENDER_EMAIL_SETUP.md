# 📧 Email Setup Guide for Render Deployment

Complete guide to configure email notifications for your GoldenMunch POS system on Render.

---

## 📋 Table of Contents
1. [Email Providers](#email-providers)
2. [Gmail Setup (Recommended for Testing)](#gmail-setup)
3. [Professional Email Providers](#professional-email-providers)
4. [Render Environment Variables](#render-environment-variables)
5. [Testing Email Configuration](#testing-email-configuration)
6. [Troubleshooting](#troubleshooting)

---

## 🎯 Email Providers

### Recommended Options:

| Provider | Best For | Free Tier | Setup Difficulty |
|----------|----------|-----------|------------------|
| **Gmail** | Testing, small deployments | 500 emails/day | Easy ⭐ |
| **SendGrid** | Production, scalability | 100 emails/day | Easy ⭐ |
| **Mailgun** | Production, reliability | 100 emails/day (trial) | Medium ⭐⭐ |
| **AWS SES** | Enterprise, high volume | Pay as you go | Hard ⭐⭐⭐ |
| **Resend** | Modern, developer-friendly | 100 emails/day | Easy ⭐ |

---

## 📧 Gmail Setup (Recommended for Testing)

### Step 1: Enable 2-Factor Authentication

1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Enable **2-Step Verification**
3. Complete the verification process

### Step 2: Generate App Password

1. Go to [App Passwords](https://myaccount.google.com/apppasswords)
2. Select **Mail** as the app
3. Select **Other (Custom name)** as the device
4. Enter: `GoldenMunch POS`
5. Click **Generate**
6. **Copy the 16-character password** (you won't see it again!)

### Step 3: Configure Render Environment Variables

In your Render dashboard:

```bash
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your.email@gmail.com
EMAIL_PASSWORD=xxxx xxxx xxxx xxxx  # Your 16-character app password
EMAIL_FROM_NAME=GoldenMunch POS
ADMIN_EMAIL=admin@goldenmunch.com
BUSINESS_PHONE=+63 XXX XXX XXXX
BUSINESS_ADDRESS=123 Main Street, City, Philippines
```

---

## 🚀 Professional Email Providers

### Option 1: SendGrid (Recommended for Production)

**Why SendGrid?**
- ✅ 100 free emails/day
- ✅ Excellent deliverability
- ✅ Easy API integration
- ✅ Analytics and tracking

**Setup Steps:**

1. **Sign up:** [SendGrid.com](https://sendgrid.com/)
2. **Verify your sender identity:**
   - Go to Settings → Sender Authentication
   - Verify single sender OR domain
3. **Create API Key:**
   - Go to Settings → API Keys
   - Click "Create API Key"
   - Name: `GoldenMunch-Production`
   - Select "Full Access"
   - Copy the API key

4. **Configure Render:**
   ```bash
   EMAIL_HOST=smtp.sendgrid.net
   EMAIL_PORT=587
   EMAIL_SECURE=false
   EMAIL_USER=apikey
   EMAIL_PASSWORD=SG.xxxxxxxxxxxxxxxxxxxxx  # Your SendGrid API key
   EMAIL_FROM_NAME=GoldenMunch Bakery
   ADMIN_EMAIL=admin@yourdomain.com
   ```

---

### Option 2: Mailgun

**Setup Steps:**

1. Sign up: [Mailgun.com](https://www.mailgun.com/)
2. Add and verify your domain (or use sandbox for testing)
3. Get SMTP credentials from: Settings → Domains → [Your Domain] → SMTP Credentials

**Configure Render:**
```bash
EMAIL_HOST=smtp.mailgun.org
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=postmaster@yourdomain.com
EMAIL_PASSWORD=your_mailgun_smtp_password
EMAIL_FROM_NAME=GoldenMunch Bakery
```

---

### Option 3: Resend (Modern, Simple)

**Setup Steps:**

1. Sign up: [Resend.com](https://resend.com/)
2. Verify your domain
3. Get API key from: API Keys → Create API Key

**Note:** Resend uses API, not SMTP. You'll need to modify the email service slightly:

```bash
# For now, use SMTP relay if available, or use SendGrid/Gmail instead
```

---

## ⚙️ Render Environment Variables

### How to Add Environment Variables on Render:

1. **Navigate to your service:**
   - Go to [Render Dashboard](https://dashboard.render.com/)
   - Select your **GoldenMunch-Server** service

2. **Add Environment Variables:**
   - Click **Environment** in the left sidebar
   - Click **Add Environment Variable**
   - Add each variable below

### Required Variables:

```bash
# ========================================
# EMAIL CONFIGURATION
# ========================================

# SMTP Server Settings
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false

# Authentication
EMAIL_USER=your.email@gmail.com
EMAIL_PASSWORD=your_app_password_here

# Sender Information
EMAIL_FROM_NAME=GoldenMunch Bakery

# Notifications
ADMIN_EMAIL=admin@goldenmunch.com

# Business Information (shown in emails)
BUSINESS_PHONE=+63 XXX XXX XXXX
BUSINESS_ADDRESS=123 Baker Street, Manila, Philippines

# Backend URL (for email links)
BACKEND_URL=https://your-backend.onrender.com
```

### Optional: Use Render Secret Files

For sensitive data like `EMAIL_PASSWORD`, you can use **Secret Files**:

1. Go to **Environment** → **Secret Files**
2. Add file: `.env.email`
3. Content:
   ```
   EMAIL_PASSWORD=your_app_password_here
   ```
4. The server will automatically load this

---

## 🧪 Testing Email Configuration

### Method 1: Using Admin Panel

1. **Deploy your server** with email environment variables
2. **Submit a custom cake request** from the kiosk
3. **Check logs** in Render:
   - Go to **Logs** tab
   - Look for: `✅ Email service initialized successfully`
   - Look for: `✅ Email sent successfully`

### Method 2: Using Server Logs

Watch for these log messages:

**Successful Configuration:**
```
✅ Email service initialized successfully
```

**Email Sent:**
```
✅ Email sent successfully: <message-id>
```

**Configuration Issues:**
```
⚠️ Email service not configured. Set EMAIL_USER and EMAIL_PASSWORD in .env
```

### Method 3: Test Endpoint (Add to your server)

You can add a test endpoint to manually trigger a test email:

**Add to** `server/src/routes/test.routes.ts`:
```typescript
import { Router } from 'express';
import { emailService } from '../services/email.service';

const router = Router();

router.get('/test-email', async (req, res) => {
  try {
    const testResult = await emailService.testConnection();
    if (testResult) {
      res.json({ success: true, message: 'Email configuration is working!' });
    } else {
      res.status(500).json({ success: false, message: 'Email configuration failed' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
```

---

## 🔍 Troubleshooting

### Issue 1: "Email service not configured"

**Cause:** Missing `EMAIL_USER` or `EMAIL_PASSWORD`

**Solution:**
1. Check Render environment variables are set
2. Restart the service after adding variables
3. Check logs for initialization message

---

### Issue 2: "Invalid login credentials"

**Causes:**
- Gmail: Not using app password
- Gmail: 2FA not enabled
- Wrong username/password

**Solutions:**

**For Gmail:**
1. Enable 2-Factor Authentication
2. Generate new App Password (16 characters)
3. Use FULL email address as `EMAIL_USER`
4. Use app password (with or without spaces) as `EMAIL_PASSWORD`

**For SendGrid:**
1. Use `apikey` as `EMAIL_USER`
2. Use your API key as `EMAIL_PASSWORD`

---

### Issue 3: "Connection timeout"

**Cause:** Wrong port or security settings

**Solutions:**
1. Try different port combinations:
   ```bash
   # Option 1: TLS (recommended)
   EMAIL_PORT=587
   EMAIL_SECURE=false

   # Option 2: SSL
   EMAIL_PORT=465
   EMAIL_SECURE=true

   # Option 3: Plain (not recommended)
   EMAIL_PORT=25
   EMAIL_SECURE=false
   ```

---

### Issue 4: Emails going to spam

**Solutions:**

1. **Verify sender identity** (for SendGrid/Mailgun)
2. **Set up SPF records** for your domain
3. **Set up DKIM** authentication
4. **Use a professional email domain** (not Gmail for production)
5. **Avoid spam trigger words** in subject lines

---

### Issue 5: Rate limiting

**Gmail Limits:**
- 500 emails per day
- 100-150 emails per hour

**Solutions:**
1. Upgrade to professional email service (SendGrid, Mailgun)
2. Implement email queuing
3. Batch notifications

---

## 📊 Email Features in Your System

Your system sends these automated emails:

### 1. **Custom Cake Request Submitted**
- **To:** Admin
- **Trigger:** Customer submits custom cake request
- **Template:** New request notification with details

### 2. **Request Approved**
- **To:** Customer
- **Trigger:** Admin approves request
- **Template:** Approval with pricing and pickup details

### 3. **Request Rejected**
- **To:** Customer
- **Trigger:** Admin rejects request
- **Template:** Rejection with reason

### 4. **Ready for Pickup**
- **To:** Customer
- **Trigger:** Admin marks cake as ready
- **Template:** Pickup notification with verification code

### 5. **Pickup Reminder**
- **To:** Customer
- **Trigger:** Automated (day before pickup)
- **Template:** Reminder with pickup details

### 6. **Admin-Customer Messages**
- **To:** Customer or Admin
- **Trigger:** Message sent via admin panel
- **Template:** Message thread notification

---

## ✅ Quick Start Checklist

- [ ] Choose email provider (Gmail for testing, SendGrid for production)
- [ ] Create account and get credentials
- [ ] Add environment variables to Render
- [ ] Deploy/restart your service
- [ ] Check logs for initialization message
- [ ] Test by submitting a custom cake request
- [ ] Verify email delivery (check spam folder)
- [ ] Set up domain authentication for production

---

## 🔐 Security Best Practices

1. **Never commit credentials** to git
2. **Use app passwords** for Gmail (not your real password)
3. **Rotate credentials** regularly
4. **Use Secret Files** in Render for sensitive data
5. **Monitor email logs** for suspicious activity
6. **Set up 2FA** on your email provider account
7. **Use dedicated email** for the app (not personal)

---

## 📞 Support Resources

### Gmail Issues:
- [App Passwords Help](https://support.google.com/accounts/answer/185833)
- [2FA Setup](https://support.google.com/accounts/answer/185839)

### SendGrid:
- [Documentation](https://docs.sendgrid.com/)
- [SMTP Integration](https://docs.sendgrid.com/for-developers/sending-email/integrating-with-the-smtp-api)

### Mailgun:
- [Documentation](https://documentation.mailgun.com/)
- [SMTP Guide](https://documentation.mailgun.com/en/latest/user_manual.html#sending-via-smtp)

### Render:
- [Environment Variables](https://render.com/docs/configure-environment-variables)
- [Secret Files](https://render.com/docs/secret-files)

---

## 🎉 Success!

Once configured, you should see:
- ✅ Email logs showing successful sends
- ✅ Customers receiving notifications
- ✅ Admin receiving new request alerts
- ✅ No errors in Render logs

**Email system is now fully operational!** 🚀

---

**Last Updated:** January 2026
**For Questions:** Check server logs or contact support
