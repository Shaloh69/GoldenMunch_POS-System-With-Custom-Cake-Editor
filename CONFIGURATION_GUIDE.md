# GoldenMunch POS - Configuration Guide

## 🚨 Critical Issues Found

After running diagnostics, I found **2 critical configuration issues** that are preventing your system from working:

---

## ❌ Issue 1: Email Domain Not Verified in Resend

**Error:** `Failed to send message. Please try again.`

**Root Cause:** Your domain `goldenmunch.dpdns.org` is NOT verified in Resend.

### How to Fix:

#### Step 1: Add Domain in Resend Dashboard

1. Go to https://resend.com/domains
2. Click "Add Domain"
3. Enter: `goldenmunch.dpdns.org`
4. Click "Add"

#### Step 2: Add DNS Records

Resend will provide you with DNS records to add. You need to add these to your DNS provider:

**Required DNS Records:**
```
Type: TXT
Name: @ (or root domain)
Value: [Resend will provide this - looks like: resend-verify=abc123...]

Type: MX
Name: @ (or root domain)
Value: feedback-smtp.us-east-1.amazonses.com
Priority: 10

Type: TXT
Name: _dmarc
Value: v=DMARC1; p=none;

Type: TXT
Name: [Resend will provide - typically: resend._domainkey]
Value: [Long DKIM key]
```

#### Step 3: Verify Domain

1. After adding DNS records, click "Verify" in Resend dashboard
2. DNS propagation can take 24-48 hours (usually faster)
3. Check verification status

#### Step 4: Alternative - Use Resend's Domain (Quick Fix)

If you can't wait for DNS verification, use Resend's built-in domain:

**Edit:** `server/.env.production`
```bash
# Change from:
EMAIL_FROM_ADDRESS=noreply@goldenmunch.dpdns.org

# To (temporary):
EMAIL_FROM_ADDRESS=onboarding@resend.dev
```

**Note:** This will work immediately but emails will show "via resend.dev". For production, use your verified domain.

---

## ❌ Issue 2: Supabase Not Configured

**Error:** 3D cake images not displaying in admin panel

**Root Cause:** Supabase credentials are still placeholder values.

### How to Fix:

#### Step 1: Create Supabase Project (if you haven't)

1. Go to https://supabase.com
2. Create a new project
3. Choose a region (closest to Philippines: Singapore)
4. Set a database password (save it!)
5. Wait 2-3 minutes for project to be ready

#### Step 2: Get Your Credentials

1. Go to: https://supabase.com/dashboard/project/YOUR_PROJECT/settings/api
2. Copy:
   - **Project URL** (looks like: `https://abc123xyz.supabase.co`)
   - **service_role key** (the SECRET one, NOT anon key)

#### Step 3: Update Configuration

**Edit:** `server/.env.production`
```bash
# Replace these placeholder values:
SUPABASE_URL=https://abc123xyz.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBh...
```

#### Step 4: Create Storage Bucket

Run this command to create the `custom-cakes` bucket:

```bash
cd server
node -e "require('./dist/scripts/setupSupabaseStorage.js').setupStorage()"
```

Or manually in Supabase dashboard:
1. Go to: Storage → Buckets
2. Click "New Bucket"
3. Name: `custom-cakes`
4. Public: ✅ YES
5. File size limit: 15MB
6. Allowed MIME types: `image/jpeg,image/jpg,image/png,image/webp`

---

## 🧪 Testing Your Configuration

After fixing the above issues, test with:

```bash
cd server
node test-email-and-supabase.js
```

**Expected Output:**
```
✅ Email Service: WORKING
✅ Supabase Storage: WORKING
```

---

## 🔄 Full Deployment Steps

After configuration is complete:

```bash
# 1. Pull latest code
git pull origin claude/update-deployment-urls-MgjOC

# 2. Install dependencies
cd server && npm install

# 3. Build
npm run build

# 4. Test configuration
node test-email-and-supabase.js

# 5. Restart server
pm2 restart goldenmunch-server

# 6. Check logs
pm2 logs goldenmunch-server --lines 50
```

---

## 📝 Quick Checklist

Before your system works correctly, verify:

- [ ] Resend domain `goldenmunch.dpdns.org` is verified (or using `onboarding@resend.dev`)
- [ ] Supabase project created
- [ ] Supabase URL and service_role key added to `.env.production`
- [ ] `custom-cakes` bucket created in Supabase Storage
- [ ] Bucket is set to PUBLIC
- [ ] Test script runs successfully
- [ ] Server restarted with new configuration

---

## 🐛 Troubleshooting

### Email still not sending?

Check server logs:
```bash
pm2 logs goldenmunch-server | grep "email"
```

Look for:
- `✅ Email sent successfully` (good!)
- `❌ Resend API error: Domain not verified` (domain issue)
- `❌ Invalid API key` (wrong RESEND_API_KEY)

### Images still not showing?

Check server logs:
```bash
pm2 logs goldenmunch-server | grep "Supabase"
```

Look for:
- `✅ Uploaded to Supabase` (good!)
- `❌ Supabase upload error: Invalid API key` (wrong credentials)
- `❌ Bucket 'custom-cakes' not found` (bucket not created)

### Webhook not receiving events?

1. Check webhook URL is correct: `https://goldenmunch.dpdns.org/api/webhooks/resend/inbound`
2. Check webhook is listening for: `email.received`
3. Send a test email and check Resend webhook logs
4. Verify webhook is "Enabled" (green status)

---

## 📚 Additional Resources

- Resend Domain Verification: https://resend.com/docs/dashboard/domains/introduction
- Supabase Storage Guide: https://supabase.com/docs/guides/storage
- Supabase API Keys: https://supabase.com/docs/guides/api/api-keys

---

## ✅ Expected Behavior After Fix

### Messaging System:
1. Admin sends message to customer
2. Email sent via Resend
3. Customer receives email
4. Customer clicks "Reply"
5. Reply webhook triggers
6. Message appears in admin panel

### Custom Cake Images:
1. Customer designs cake in MobileEditor
2. Screenshots captured (4 angles)
3. Images uploaded to Supabase
4. Admin sees 3D preview in Custom Cake Request Details

---

**Need Help?** If you still have issues after following this guide, check the server logs and provide the error messages.
