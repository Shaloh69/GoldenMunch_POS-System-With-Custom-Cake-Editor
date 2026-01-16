# Email Setup Guide for Render Deployment

## Problem: SMTP Connection Timeout

When deploying to Render, you may encounter email connection timeouts:
```
Error: Connection timeout
code: 'ETIMEDOUT',
command: 'CONN'
```

This happens because **Render blocks outbound SMTP connections on port 587** (STARTTLS) to prevent spam.

---

## Solution 1: Use Port 465 with SSL/TLS (Gmail) ✅ **RECOMMENDED**

### Configuration

Update your Render environment variables:

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=465
EMAIL_SECURE=true
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-gmail-app-password
EMAIL_FROM_NAME=GoldenMunch Bakery
ADMIN_EMAIL=your-email@gmail.com
```

### Steps to Set Up Gmail App Password:

1. **Enable 2-Factor Authentication** on your Google Account:
   - Go to https://myaccount.google.com/security
   - Enable 2-Step Verification

2. **Create App Password**:
   - Go to https://myaccount.google.com/apppasswords
   - Select "Mail" and "Other (Custom name)"
   - Name it "GoldenMunch POS"
   - Copy the 16-character password (e.g., `cudfhypoxgkcfraf`)

3. **Add to Render Environment Variables**:
   - Go to your Render dashboard
   - Select your backend service
   - Navigate to "Environment" tab
   - Add the environment variables above
   - Click "Save Changes"
   - Render will automatically redeploy

### Why Port 465?

- Port 465: SSL/TLS from the start (more reliable on cloud platforms)
- Port 587: STARTTLS (often blocked by cloud providers)
- Port 25: Legacy SMTP (blocked by most cloud providers)

---

## Solution 2: Alternative Email Services (If Gmail Doesn't Work)

If Gmail SMTP is still blocked or unreliable on Render, use a dedicated email service:

### Option A: SendGrid (Free tier: 100 emails/day)

**Advantages:**
- Designed for cloud platforms
- High deliverability
- Free tier available
- Built-in analytics

**Setup:**
1. Sign up at https://sendgrid.com
2. Create an API key
3. Update environment variables:
```env
EMAIL_SERVICE=sendgrid
SENDGRID_API_KEY=SG.your_api_key_here
EMAIL_FROM_NAME=GoldenMunch Bakery
EMAIL_FROM_ADDRESS=noreply@yourdomain.com
ADMIN_EMAIL=admin@yourdomain.com
```

4. Install SendGrid package:
```bash
npm install @sendgrid/mail
```

5. Update email service to use SendGrid (implementation needed)

### Option B: Mailgun (Free tier: 5,000 emails/month)

**Advantages:**
- Developer-friendly API
- Good documentation
- Free tier available

**Setup:**
1. Sign up at https://mailgun.com
2. Verify your domain (or use sandbox domain for testing)
3. Get your API key
4. Update environment variables:
```env
EMAIL_SERVICE=mailgun
MAILGUN_API_KEY=your_api_key_here
MAILGUN_DOMAIN=mg.yourdomain.com
EMAIL_FROM_NAME=GoldenMunch Bakery
```

### Option C: AWS SES (Very cheap, $0.10 per 1,000 emails)

**Advantages:**
- Very cheap for high volume
- Highly reliable
- Integrates with AWS ecosystem

**Setup:**
1. Sign up for AWS account
2. Enable SES service
3. Verify your domain and email addresses
4. Get SMTP credentials
5. Update environment variables:
```env
EMAIL_HOST=email-smtp.us-east-1.amazonaws.com
EMAIL_PORT=465
EMAIL_SECURE=true
EMAIL_USER=your_ses_smtp_username
EMAIL_PASSWORD=your_ses_smtp_password
```

---

## Testing Email Configuration

### 1. Test Locally First:

```bash
cd server
npm run dev
```

Check server logs for:
```
✅ Email service initialized successfully
```

### 2. Test on Render:

After deploying, check Render logs:
- Go to Render Dashboard → Your Service → Logs
- Look for: `✅ Email service initialized successfully`
- If you see: `⚠️ Email service not configured` - check environment variables

### 3. Send Test Email:

Use the email composer in the admin panel:
- Login to CashierAdmin
- Go to Email Management
- Click "Compose Email"
- Send a test email to yourself

### 4. Check Server Logs:

Successful send:
```
✅ Email sent successfully: <message-id>
```

Failed send:
```
❌ Failed to send email: [error details]
```

---

## Troubleshooting

### Error: "Connection timeout" (ETIMEDOUT)
- **Cause**: Port is blocked by Render
- **Solution**: Switch to port 465 with SSL

### Error: "Authentication failed"
- **Cause**: Wrong email/password or app password not created
- **Solution**: Create Gmail App Password (see steps above)

### Error: "Greeting never received"
- **Cause**: Wrong SMTP host or port
- **Solution**: Verify `EMAIL_HOST` and `EMAIL_PORT`

### Error: "Self signed certificate"
- **Cause**: SSL/TLS mismatch
- **Solution**: Set `EMAIL_SECURE=true` for port 465

### Emails not arriving (no error):
- Check spam folder
- Verify sender email is not blacklisted
- Check Gmail sending limits (500 emails/day for free Gmail)
- Use a dedicated email service (SendGrid, Mailgun) for production

---

## Production Best Practices

1. **Use Dedicated Email Service** (SendGrid/Mailgun/SES) for production
   - Better deliverability
   - No sending limits
   - Built-in tracking and analytics

2. **Verify Your Domain**
   - Set up SPF, DKIM, and DMARC records
   - Improves email deliverability
   - Prevents emails from going to spam

3. **Monitor Email Sending**
   - Track bounce rates
   - Monitor spam complaints
   - Keep email lists clean

4. **Rate Limiting**
   - Don't send too many emails at once
   - Batch email sending with delays
   - Use email queuing for bulk sends

5. **Error Handling**
   - Log all email failures
   - Retry failed sends
   - Alert admins of persistent failures

---

## Current Configuration

Your system is configured with:
- **Email Service**: Gmail SMTP
- **Port**: 465 (SSL/TLS)
- **From**: dumporshemjoshua@gmail.com
- **Admin Email**: dumporshemjoshua@gmail.com

Make sure to set these in your Render environment variables!
