# ⚡ Email Quick Start - Render Deployment

## 🎯 Fastest Setup (5 minutes)

### Option 1: Gmail (Testing/Small Scale)

1. **Enable 2FA on Gmail:**
   - Go to: https://myaccount.google.com/security
   - Enable 2-Step Verification

2. **Create App Password:**
   - Go to: https://myaccount.google.com/apppasswords
   - App: Mail → Device: Other (GoldenMunch POS)
   - Copy the 16-character password

3. **Add to Render:**
   ```bash
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_SECURE=false
   EMAIL_USER=youremail@gmail.com
   EMAIL_PASSWORD=xxxx xxxx xxxx xxxx
   EMAIL_FROM_NAME=GoldenMunch Bakery
   ADMIN_EMAIL=admin@goldenmunch.com
   BUSINESS_PHONE=+63 XXX XXX XXXX
   BACKEND_URL=https://your-backend.onrender.com
   ```

4. **Deploy & Test!**

---

### Option 2: SendGrid (Production)

1. **Sign up:** https://sendgrid.com
2. **Verify email** & create API key
3. **Add to Render:**
   ```bash
   EMAIL_HOST=smtp.sendgrid.net
   EMAIL_PORT=587
   EMAIL_SECURE=false
   EMAIL_USER=apikey
   EMAIL_PASSWORD=SG.your_sendgrid_api_key
   EMAIL_FROM_NAME=GoldenMunch Bakery
   ADMIN_EMAIL=admin@goldenmunch.com
   BUSINESS_PHONE=+63 XXX XXX XXXX
   BACKEND_URL=https://your-backend.onrender.com
   ```

---

## 📋 Required Environment Variables

Copy-paste this into Render → Environment:

```
EMAIL_HOST
EMAIL_PORT
EMAIL_SECURE
EMAIL_USER
EMAIL_PASSWORD
EMAIL_FROM_NAME
ADMIN_EMAIL
BUSINESS_PHONE
BUSINESS_ADDRESS
BACKEND_URL
```

---

## ✅ Verification

After deployment, check logs for:

```
✅ Email service initialized successfully
```

Test by submitting a custom cake request!

---

## 🆘 Common Issues

**"Invalid credentials"**
→ Use App Password, not Gmail password

**"Service not configured"**
→ Check all environment variables are set

**"Connection timeout"**
→ Verify EMAIL_PORT and EMAIL_SECURE settings

---

**Full Guide:** See `RENDER_EMAIL_SETUP.md`
