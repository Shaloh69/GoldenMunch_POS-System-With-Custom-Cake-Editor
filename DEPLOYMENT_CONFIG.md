# GoldenMunch POS - Deployment Configuration

## Your Production URLs

- **API Server**: `https://goldenmunch-pos-system-server-fobd.onrender.com`
- **Mobile Editor**: `https://goldenmunch-pos-system-with-custom-cake-lcxl.onrender.com`

> **NOTE**: If you changed your server URL from `goldenmunch-server.onrender.com` to `goldenmunch-pos-system-server-fobd.onrender.com`, you MUST update the environment variables in both services and manually redeploy them!

---

## Required Environment Variables

### 1. API Server (Backend)
**Service**: `goldenmunch-pos-system-server-fobd`

Go to: https://dashboard.render.com → Select `goldenmunch-pos-system-server-fobd` → Environment

**Add/Update these variables:**

```env
NODE_ENV=production
PORT=5000

# Database (use your actual database URL)
DATABASE_URL=mysql://username:password@host:port/database

# Mobile Editor URL (for QR code generation)
MOBILE_EDITOR_URL=https://goldenmunch-pos-system-with-custom-cake-lcxl.onrender.com

# Backend API URL (for reference)
BACKEND_URL=https://goldenmunch-pos-system-server-fobd.onrender.com

# CORS - Allow mobile editor (NOTE: The code already allows all *.onrender.com domains)
CORS_ORIGIN=https://goldenmunch-pos-system-with-custom-cake-lcxl.onrender.com
```

**⚠️ IMPORTANT AFTER CHANGING THESE:**
- Click **"Save Changes"**
- Click **"Manual Deploy"** → **"Deploy latest commit"**
- This ensures the server restarts with the new environment variables

---

### 2. Mobile Editor (Next.js)
**Service**: `goldenmunch-pos-system-with-custom-cake-lcxl`

Go to: https://dashboard.render.com → Select service → Environment

**⚠️ CRITICAL - Add this variable:**

```env
# THIS IS THE FIX FOR "SESSION EXPIRED" AND CORS ISSUES
NEXT_PUBLIC_API_URL=https://goldenmunch-pos-system-server-fobd.onrender.com/api
```

**Important Notes:**
- Must include `/api` at the end
- Must be `NEXT_PUBLIC_` prefix (Next.js requirement for client-side access)
- After adding/changing, you **MUST click "Manual Deploy" → "Deploy latest commit"**
- **CRITICAL**: Next.js bakes environment variables into the build. Changing them without rebuilding won't work!
- The build takes ~5-10 minutes

---

## Step-by-Step Fix (Render.com)

### Fix "Session Expired" and CORS Issues:

#### Step 1: Configure Mobile Editor

1. Go to: https://dashboard.render.com
2. Find service: `goldenmunch-pos-system-with-custom-cake-lcxl`
3. Click on the service name
4. Go to **"Environment"** tab (left sidebar)
5. Look for `NEXT_PUBLIC_API_URL` variable:
   - If it exists and has wrong value, click **Edit**
   - If it doesn't exist, click **"Add Environment Variable"**
6. Enter:
   - **Key**: `NEXT_PUBLIC_API_URL`
   - **Value**: `https://goldenmunch-pos-system-server-fobd.onrender.com/api`
7. Click **"Save Changes"**
8. **CRITICAL**: Click **"Manual Deploy"** → **"Deploy latest commit"**
   - This rebuilds the app with the new environment variable baked in
   - **Simply saving the env var is NOT enough for Next.js!**
   - Build time: ~5-10 minutes
   - **Wait for the build to complete before testing!**

#### Step 2: Configure Backend Server

1. Go to: https://dashboard.render.com
2. Find service: `goldenmunch-pos-system-server-fobd`
3. Click on the service name
4. Go to **"Environment"** tab
5. Add/Update these variables:
   - **Key**: `MOBILE_EDITOR_URL`
   - **Value**: `https://goldenmunch-pos-system-with-custom-cake-lcxl.onrender.com`
   - **Key**: `BACKEND_URL`
   - **Value**: `https://goldenmunch-pos-system-server-fobd.onrender.com`
6. Click **"Save Changes"**
7. **IMPORTANT**: Click **"Manual Deploy"** → **"Deploy latest commit"**
   - This ensures the server restarts with new environment variables
   - The CORS middleware will work correctly after restart

#### Step 3: Verify Both Services Are Running

Before testing, ensure both deployments completed successfully:

1. **Check Mobile Editor Build**:
   - Go to service → **Logs** tab
   - Look for: "Build successful" or "Deploy successful"
   - **Wait until status shows "Live"**

2. **Check Backend Server**:
   - Go to service → **Logs** tab
   - Look for: "Server running on port 5000"
   - Look for: `CORS enabled for origins:` log message
   - **Wait until status shows "Live"**

#### Step 4: Test End-to-End

1. Open kiosk (or web interface)
2. Go to Custom Cake section
3. Generate QR code
4. Scan with phone
5. **Check browser console** (F12 → Console tab):
   ```
   🌐 API URL: https://goldenmunch-pos-system-server-fobd.onrender.com/api ✓
   ✅ Session is valid!
   ```
6. Should NOT see:
   - ❌ "Session Expired"
   - ❌ CORS policy errors
   - ❌ "NEXT_PUBLIC_API_URL not set" warnings

---

## Verification Checklist

After deployment:

### Mobile Editor Verification:

1. **Open**: https://goldenmunch-pos-system-with-custom-cake-lcxl.onrender.com
2. **Add to URL**: `/?session=test-session`
3. **Check "Session Expired" page** (expected since session doesn't exist)
4. **Click**: "▶ Debug Info (for staff)"
5. **Should show**:
   ```
   API URL: https://goldenmunch-pos-system-server-fobd.onrender.com/api
   ```
6. **Should NOT show red warning** about "NOT CONFIGURED"
7. **Open browser console (F12)** → should NOT see:
   - ❌ `⚠️ WARNING: NEXT_PUBLIC_API_URL not set!`
   - ❌ CORS errors

### Backend API Verification:

1. **Test API Root**:
   - Open: `https://goldenmunch-pos-system-server-fobd.onrender.com/api/`
   - Should show JSON with API info and status

2. **Test CORS Headers** (from command line):
   ```bash
   curl -I -X OPTIONS \
     -H "Origin: https://goldenmunch-pos-system-with-custom-cake-lcxl.onrender.com" \
     -H "Access-Control-Request-Method: GET" \
     https://goldenmunch-pos-system-server-fobd.onrender.com/api/custom-cake/options
   ```
   - Look for: `Access-Control-Allow-Origin: https://goldenmunch-pos-system-with-custom-cake-lcxl.onrender.com`

3. **Test Session Generation**:
   ```bash
   curl -X POST https://goldenmunch-pos-system-server-fobd.onrender.com/api/kiosk/custom-cake/generate-qr \
     -H "Content-Type: application/json" \
     -d '{"kiosk_id": "TEST-001"}'
   ```
   - Should return session token and QR code data

### End-to-End Test:

1. Generate QR code from kiosk
2. Scan QR code with phone
3. Mobile editor loads ✓
4. NO "Session Expired" error ✓
5. Can proceed through design steps ✓
6. Can submit order ✓

---

## Database Configuration

### Required Tables:

Make sure your database has the `qr_code_sessions` table:

```sql
-- Check if table exists
SHOW TABLES LIKE 'qr_code_sessions';

-- If missing, create it:
CREATE TABLE qr_code_sessions (
    session_id INT AUTO_INCREMENT PRIMARY KEY,
    session_token VARCHAR(100) NOT NULL UNIQUE,
    qr_code_data TEXT NOT NULL,
    editor_url VARCHAR(500) NOT NULL,
    kiosk_id VARCHAR(50) NULL,
    ip_address VARCHAR(50) NULL,
    user_agent TEXT NULL,
    status ENUM('active', 'used', 'expired') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    used_at TIMESTAMP NULL,
    INDEX idx_session_token (session_token),
    INDEX idx_session_status (status),
    INDEX idx_session_expiry (expires_at)
) ENGINE=InnoDB;
```

---

## Troubleshooting

### Issue: Still getting "Session Expired"

**Check 1: Environment variable is set**
```bash
# In Render dashboard → Environment tab
# Look for: NEXT_PUBLIC_API_URL
# Should be: https://goldenmunch-server.onrender.com/api
```

**Check 2: Rebuild was triggered**
```bash
# After setting env var, you MUST manually deploy
# Render doesn't auto-rebuild for env var changes in Next.js
```

**Check 3: Browser console logs**
```javascript
// Should see:
🌐 API URL: https://goldenmunch-server.onrender.com/api
// NOT:
⚠️  WARNING: NEXT_PUBLIC_API_URL not set!
```

### Issue: "Session not found"

**Possible causes:**
1. QR session created on different server
2. Database not shared between environments
3. Session actually expired (2 hours)

**Debug:**
```sql
-- Check recent sessions in database
SELECT
    session_token,
    status,
    created_at,
    expires_at,
    TIMESTAMPDIFF(MINUTE, NOW(), expires_at) as minutes_remaining
FROM qr_code_sessions
ORDER BY created_at DESC
LIMIT 10;
```

### Issue: CORS errors

**Error in browser console:**
```
Access to fetch at 'https://goldenmunch-pos-system-server-fobd.onrender.com/api/...'
from origin 'https://goldenmunch-pos-system-with-custom-cake-lcxl.onrender.com'
has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present
```

**Root Causes:**
1. ❌ Server not redeployed after URL change
2. ❌ Environment variables not set
3. ❌ Old build still cached

**Fix:**

1. **Set Backend Environment Variable** (Render dashboard):
   ```env
   CORS_ORIGIN=https://goldenmunch-pos-system-with-custom-cake-lcxl.onrender.com
   ```

2. **Manually Redeploy Backend**:
   - Go to: `goldenmunch-pos-system-server-fobd` service
   - Click: **"Manual Deploy"** → **"Deploy latest commit"**
   - **Wait for deployment to complete**

3. **Verify CORS is working**:
   ```bash
   # Test OPTIONS preflight request
   curl -I -X OPTIONS \
     -H "Origin: https://goldenmunch-pos-system-with-custom-cake-lcxl.onrender.com" \
     -H "Access-Control-Request-Method: GET" \
     https://goldenmunch-pos-system-server-fobd.onrender.com/api/custom-cake/options
   ```
   - Should see: `Access-Control-Allow-Origin: https://goldenmunch-pos-system-with-custom-cake-lcxl.onrender.com`

4. **Clear browser cache** and test again

**Note**: The server code (`server/src/app.ts:80-83`) already allows all `*.onrender.com` domains automatically, but the server must be redeployed for this to take effect.

---

## Quick Reference Card

### ✅ Correct Configuration:

```
QR Generated on: goldenmunch-pos-system-server-fobd.onrender.com
     ↓
Session saved in: Database (shared)
     ↓
QR points to: goldenmunch-pos-system-with-custom-cake-lcxl.onrender.com
     ↓
Mobile editor validates on: goldenmunch-pos-system-server-fobd.onrender.com/api
     ↓
CORS: Server allows *.onrender.com origins
     ↓
Session found: ✓ SUCCESS
```

### ❌ Wrong Configuration (causes "Session Expired" or CORS errors):

```
QR Generated on: goldenmunch-pos-system-server-fobd.onrender.com
     ↓
Session saved in: Database A
     ↓
Mobile editor validates on: localhost:5000 (WRONG!)
     OR
Mobile editor validates on: goldenmunch-server.onrender.com/api (OLD URL - WRONG!)
     ↓
CORS blocked OR Session not found
     ↓
Result: ✗ "SESSION EXPIRED" or CORS ERROR
```

### 🔧 Common Mistakes:

1. ❌ Changed server URL but didn't update `NEXT_PUBLIC_API_URL` in mobile editor
2. ❌ Updated env vars but didn't manually redeploy
3. ❌ Mobile editor still pointing to old `goldenmunch-server.onrender.com` instead of `goldenmunch-pos-system-server-fobd.onrender.com`
4. ❌ Forgot to include `/api` at the end of the URL

---

## Support

If issues persist after configuration:

1. **Check Render logs:**
   - Backend: `goldenmunch-server` → Logs tab
   - Mobile Editor: `goldenmunch-pos-system-with-custom-cake-lcxl` → Logs tab

2. **Check database connection:**
   ```sql
   -- From backend logs, verify DATABASE_URL is correct
   -- Check connection: SELECT 1;
   ```

3. **Check build logs:**
   - Mobile Editor should show: "Compiled successfully"
   - Look for: `NEXT_PUBLIC_API_URL` in build output

4. **Manual test:**
   ```bash
   # Test CORS preflight
   curl -I -X OPTIONS \
     -H "Origin: https://goldenmunch-pos-system-with-custom-cake-lcxl.onrender.com" \
     -H "Access-Control-Request-Method: GET" \
     https://goldenmunch-pos-system-server-fobd.onrender.com/api/custom-cake/options

   # Generate session
   curl -X POST https://goldenmunch-pos-system-server-fobd.onrender.com/api/kiosk/custom-cake/generate-qr \
     -H "Content-Type: application/json" \
     -d '{"kiosk_id": "TEST-001"}'

   # Copy session token from response

   # Validate session
   curl https://goldenmunch-pos-system-server-fobd.onrender.com/api/custom-cake/session/SESSION_TOKEN_HERE
   ```

---

## Summary

**The Fix (in 4 steps):**

1. **Update Mobile Editor env var**: `NEXT_PUBLIC_API_URL=https://goldenmunch-pos-system-server-fobd.onrender.com/api`
2. **Manually redeploy Mobile Editor** (critical - Next.js bakes env vars into build!)
3. **Update Backend env vars**: `BACKEND_URL` and `MOBILE_EDITOR_URL`
4. **Manually redeploy Backend** (ensures CORS middleware restarts)

**Wait for both deployments to complete**, then test!

**Result:** No more "Session Expired" or CORS errors! 🎉

---

## Quick Action Checklist

Use this checklist to ensure everything is configured correctly:

- [ ] Mobile Editor: Set `NEXT_PUBLIC_API_URL=https://goldenmunch-pos-system-server-fobd.onrender.com/api`
- [ ] Mobile Editor: Click "Manual Deploy" → "Deploy latest commit"
- [ ] Mobile Editor: Wait for "Live" status
- [ ] Backend: Set `BACKEND_URL=https://goldenmunch-pos-system-server-fobd.onrender.com`
- [ ] Backend: Set `MOBILE_EDITOR_URL=https://goldenmunch-pos-system-with-custom-cake-lcxl.onrender.com`
- [ ] Backend: Set `CORS_ORIGIN=https://goldenmunch-pos-system-with-custom-cake-lcxl.onrender.com`
- [ ] Backend: Click "Manual Deploy" → "Deploy latest commit"
- [ ] Backend: Wait for "Live" status
- [ ] Test: Open mobile editor → Check debug info → Verify API URL is correct
- [ ] Test: Generate QR code → Scan → Should load without errors
- [ ] Test: Check browser console → No CORS errors, no "not configured" warnings
