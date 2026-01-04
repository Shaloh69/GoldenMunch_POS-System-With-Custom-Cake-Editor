# GoldenMunch POS - Deployment Configuration

## Your Production URLs

- **API Server**: `https://goldenmunch-server.onrender.com`
- **Mobile Editor**: `https://goldenmunch-pos-system-with-custom-cake-lcxl.onrender.com`

---

## Required Environment Variables

### 1. API Server (Backend)
**Service**: `goldenmunch-server`

Go to: https://dashboard.render.com → Select `goldenmunch-server` → Environment

**Add/Update these variables:**

```env
NODE_ENV=production
PORT=5000

# Database (use your actual database URL)
DATABASE_URL=mysql://username:password@host:port/database

# Mobile Editor URL (for QR code generation)
MOBILE_EDITOR_URL=https://goldenmunch-pos-system-with-custom-cake-lcxl.onrender.com

# Backend API URL (for reference)
BACKEND_URL=https://goldenmunch-server.onrender.com

# CORS (if needed)
CORS_ORIGIN=https://goldenmunch-pos-system-with-custom-cake-lcxl.onrender.com
```

---

### 2. Mobile Editor (Next.js)
**Service**: `goldenmunch-pos-system-with-custom-cake-lcxl`

Go to: https://dashboard.render.com → Select service → Environment

**⚠️ CRITICAL - Add this variable:**

```env
# THIS IS THE FIX FOR "SESSION EXPIRED" ISSUE
NEXT_PUBLIC_API_URL=https://goldenmunch-server.onrender.com/api
```

**Important Notes:**
- Must include `/api` at the end
- Must be `NEXT_PUBLIC_` prefix (Next.js requirement)
- After adding, **click "Manual Deploy" → "Deploy latest commit"**

---

## Step-by-Step Fix (Render.com)

### Fix "Session Expired" Issue:

#### Step 1: Configure Mobile Editor

1. Go to: https://dashboard.render.com
2. Find service: `goldenmunch-pos-system-with-custom-cake-lcxl`
3. Click on the service name
4. Go to **"Environment"** tab (left sidebar)
5. Click **"Add Environment Variable"**
6. Enter:
   - **Key**: `NEXT_PUBLIC_API_URL`
   - **Value**: `https://goldenmunch-server.onrender.com/api`
7. Click **"Save Changes"**
8. **IMPORTANT**: Click **"Manual Deploy"** → **"Deploy latest commit"**
   - This rebuilds the app with the new environment variable
   - Build time: ~5-10 minutes

#### Step 2: Configure Backend Server

1. Go to: https://dashboard.render.com
2. Find service: `goldenmunch-server`
3. Click on the service name
4. Go to **"Environment"** tab
5. Add/Update:
   - **Key**: `MOBILE_EDITOR_URL`
   - **Value**: `https://goldenmunch-pos-system-with-custom-cake-lcxl.onrender.com`
6. Click **"Save Changes"**
7. Service will auto-redeploy

#### Step 3: Test

1. Open kiosk (or web interface)
2. Go to Custom Cake section
3. Generate QR code
4. Scan with phone
5. **Check browser console** (if possible):
   ```
   🌐 API URL: https://goldenmunch-server.onrender.com/api ✓
   ✅ Session is valid!
   ```
6. Should NOT see "Session Expired"!

---

## Verification Checklist

After deployment:

### Mobile Editor Verification:

1. **Open**: https://goldenmunch-pos-system-with-custom-cake-lcxl.onrender.com
2. **Add to URL**: `/?session=test-session`
3. **Check "Session Expired" page**
4. **Click**: "▶ Debug Info (for staff)"
5. **Should show**:
   ```
   API URL: https://goldenmunch-server.onrender.com/api
   ```
6. **Should NOT show red warning** about "NOT CONFIGURED"

### Backend API Verification:

1. **Open**: https://goldenmunch-server.onrender.com/api/health (if exists)
2. **Or test session generation**:
   ```bash
   curl -X POST https://goldenmunch-server.onrender.com/api/kiosk/custom-cake/generate-qr \
     -H "Content-Type: application/json" \
     -d '{"kiosk_id": "TEST-001"}'
   ```

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

If you see CORS errors in browser console:

**Backend .env:**
```env
# Add mobile editor to allowed origins
CORS_ORIGIN=https://goldenmunch-pos-system-with-custom-cake-lcxl.onrender.com
```

**Or in server code** (`server/src/app.ts`):
```typescript
app.use(cors({
  origin: [
    'https://goldenmunch-pos-system-with-custom-cake-lcxl.onrender.com',
    'http://localhost:3001' // For development
  ],
  credentials: true
}));
```

---

## Quick Reference Card

### ✅ Correct Configuration:

```
QR Generated on: goldenmunch-server.onrender.com
     ↓
Session saved in: Database (shared)
     ↓
QR points to: goldenmunch-pos-system-with-custom-cake-lcxl.onrender.com
     ↓
Mobile editor validates on: goldenmunch-server.onrender.com/api
     ↓
Session found: ✓ SUCCESS
```

### ❌ Wrong Configuration (causes "Session Expired"):

```
QR Generated on: goldenmunch-server.onrender.com
     ↓
Session saved in: Database A
     ↓
Mobile editor validates on: localhost:5000 (WRONG!)
     ↓
Session not found: ✗ "SESSION EXPIRED"
```

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
   # Generate session
   curl -X POST https://goldenmunch-server.onrender.com/api/kiosk/custom-cake/generate-qr \
     -H "Content-Type: application/json" \
     -d '{"kiosk_id": "TEST-001"}'

   # Copy session token from response

   # Validate session
   curl https://goldenmunch-server.onrender.com/api/custom-cake/session/SESSION_TOKEN_HERE
   ```

---

## Summary

**The Fix (in 3 steps):**

1. **Add env var** to Mobile Editor: `NEXT_PUBLIC_API_URL=https://goldenmunch-server.onrender.com/api`
2. **Manually redeploy** Mobile Editor (important!)
3. **Test** by generating new QR code

**Result:** No more "Session Expired" errors! 🎉
