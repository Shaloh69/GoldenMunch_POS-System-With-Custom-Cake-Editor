# Session Expired Issue - Root Cause & Fix

## Problem Description

Users scan QR code from kiosk but immediately see "Session Expired" error in mobile editor.

## Root Cause Analysis

### The Issue

The QR session is created on one API server but validated against a **different** API server, causing the session to not be found.

### The Flow

```
1. Kiosk → Calls API Server A to generate QR session
2. API Server A → Creates session in database (expires in 2 hours)
3. QR Code Generated → Points to Mobile Editor URL (e.g., custom-cake-lcxl.onrender.com/?session=...)
4. User Scans QR → Opens Mobile Editor
5. Mobile Editor → Tries to validate session
6. ❌ PROBLEM: Mobile Editor calls API Server B (or localhost) instead of Server A
7. Result: Session not found → "Session Expired" error
```

### Technical Details

**Session Generation** (`server/src/controllers/customCake.controller.ts:141-220`):
```typescript
// Kiosk calls this endpoint to generate QR
POST /api/kiosk/custom-cake/generate-qr

// Creates session in database:
INSERT INTO qr_code_sessions
  (session_token, qr_code_data, editor_url, expires_at)
VALUES
  (?, ?, ?, DATE_ADD(NOW(), INTERVAL 2 HOUR))
```

**Session Validation** (`client/MobileEditor/app/page.tsx:145-174`):
```typescript
// Mobile editor calls this to validate:
const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
const response = await fetch(`${apiUrl}/custom-cake/session/${sessionToken}`);

// ❌ If NEXT_PUBLIC_API_URL is not set or points to wrong server → Session not found
```

## The Problem

### Scenario 1: Missing Environment Variable
- **Kiosk** → Generates QR on `https://api.production.com`
- **Mobile Editor** → `NEXT_PUBLIC_API_URL` not set
- **Result** → Mobile editor calls `http://localhost:5000/api` → Session not found

### Scenario 2: Wrong Environment Variable
- **Kiosk** → Generates QR on `https://api-production.onrender.com`
- **Mobile Editor** → `NEXT_PUBLIC_API_URL=https://api-staging.onrender.com`
- **Result** → Mobile editor calls staging server → Session not found

### Scenario 3: Timezone Issue (Less Common)
- **API Server** → Timezone: UTC
- **Database Server** → Timezone: PST
- **Result** → Session appears expired due to time difference

## The Fix

### 1. Configure Environment Variables Correctly

#### For Kiosk_Web (Next.js)
Create `.env.local`:
```env
NEXT_PUBLIC_API_URL=https://your-api-server.onrender.com/api
```

#### For MobileEditor (Next.js)
Create `.env.local`:
```env
# CRITICAL: Must match the API server that creates sessions
NEXT_PUBLIC_API_URL=https://your-api-server.onrender.com/api
```

#### For Backend Server (Node.js/Express)
Create `.env`:
```env
# Backend API server
PORT=5000
DATABASE_URL=mysql://user:pass@host:port/database

# Mobile Editor URL (for QR code generation)
MOBILE_EDITOR_URL=https://custom-cake-editor.onrender.com

# Backend URL (fallback for MOBILE_EDITOR_URL)
BACKEND_URL=https://your-api-server.onrender.com
```

### 2. Production Deployment Checklist

#### Render.com (or similar PaaS)

**Backend Service:**
```
Service Name: goldenmunch-api
Environment Variables:
  - NODE_ENV=production
  - DATABASE_URL=mysql://...
  - MOBILE_EDITOR_URL=https://custom-cake-lcxl.onrender.com
  - BACKEND_URL=https://goldenmunch-api.onrender.com
```

**Mobile Editor Service:**
```
Service Name: custom-cake-editor
Environment Variables:
  - NODE_ENV=production
  - NEXT_PUBLIC_API_URL=https://goldenmunch-api.onrender.com/api
```

**Kiosk Web Service:**
```
Service Name: goldenmunch-kiosk
Environment Variables:
  - NODE_ENV=production
  - NEXT_PUBLIC_API_URL=https://goldenmunch-api.onrender.com/api
```

### 3. Verification Steps

#### Step 1: Check Environment Variables

**On Mobile Editor:**
1. Open browser console (F12)
2. Scan QR code
3. Check console logs:
   ```
   🔍 Validating session token: session-...
   🌐 API URL: https://goldenmunch-api.onrender.com/api
   ⚙️  Environment: production
   ```

**If you see:**
```
⚠️  WARNING: NEXT_PUBLIC_API_URL not set! Using default: http://localhost:5000/api
```
→ **Environment variable is NOT configured!**

#### Step 2: Check Session Creation

1. Generate QR code from kiosk
2. Check backend logs:
   ```
   ✅ QR Session created: session-1234567890...
   💾 Session saved to database
   📱 Generated editor URL: https://custom-cake-lcxl.onrender.com/?session=...
   ```

#### Step 3: Check Session Validation

1. Scan QR code
2. Check mobile editor logs:
   ```
   📡 Session validation response status: 200
   ✅ Session validation data: {...}
   ✅ Session is valid!
   ```

**If you see:**
```
❌ Session validation HTTP error: 404
```
→ **Session not found on the API server**

#### Step 4: Use Debug Info

On "Session Expired" screen, click "▶ Debug Info (for staff)":

```
Session Token: session-1704067200000-a1b2c3d4e5f6...
API URL: http://localhost:5000/api (DEFAULT - NOT CONFIGURED!)
Current URL: https://custom-cake-lcxl.onrender.com/?session=...
Timestamp: 1/1/2024, 3:00:00 PM
Timezone: America/New_York

⚠️ CONFIGURATION ISSUE:
NEXT_PUBLIC_API_URL environment variable is not set!
Session validation may fail if API server is on a different host.
```

If you see the red warning → Fix the environment variable!

## Solution Summary

### Quick Fix (for immediate testing)

1. **Deploy Backend API** to Render/Vercel/etc.
2. **Get the API URL** (e.g., `https://goldenmunch-api.onrender.com`)
3. **Set Mobile Editor env var:**
   ```env
   NEXT_PUBLIC_API_URL=https://goldenmunch-api.onrender.com/api
   ```
4. **Redeploy Mobile Editor**
5. **Test:** Generate new QR code and scan

### Permanent Fix

1. **Document all service URLs** in a config file
2. **Use environment variables** for all API URLs
3. **Never hardcode URLs** in the code
4. **Add health check endpoints:**
   ```typescript
   // GET /api/health
   {
     "status": "ok",
     "timestamp": "2024-01-01T15:00:00Z",
     "timezone": "UTC",
     "database": "connected"
   }
   ```
5. **Add validation on startup:**
   ```typescript
   if (!process.env.NEXT_PUBLIC_API_URL && process.env.NODE_ENV === 'production') {
     throw new Error('NEXT_PUBLIC_API_URL must be set in production!');
   }
   ```

## Timezone Fix (if applicable)

### Set MySQL Timezone

```sql
-- Check current timezone
SELECT NOW(), @@session.time_zone, @@global.time_zone;

-- Set global timezone to UTC (recommended)
SET GLOBAL time_zone = '+00:00';
```

### Set Node.js Timezone

```bash
# In .env
TZ=UTC
```

### Ensure Consistency

All services should use the same timezone (UTC recommended):
- Database server: UTC
- API server: UTC
- Mobile editor: UTC (for consistency in logs)

## Monitoring & Debugging

### Add Session Tracking

```typescript
// Backend: Log session lifecycle
logger.info(`Session created: ${token}, expires: ${expiresAt}`);
logger.info(`Session validated: ${token}, remaining: ${minutesRemaining}min`);
logger.warn(`Session expired: ${token}`);
```

### Add Dashboard Metrics

```typescript
// Track session stats
- Total sessions created (today/week/month)
- Active sessions count
- Expired sessions count
- Average session duration
- Session validation errors
```

## Files Modified

- ✅ `client/MobileEditor/app/page.tsx` - Added environment variable warnings and better debug info
- ✅ `SESSION_EXPIRED_FIX.md` - This documentation

## Testing Checklist

- [ ] Backend API deployed with correct DATABASE_URL
- [ ] Backend has MOBILE_EDITOR_URL configured
- [ ] Mobile Editor deployed with NEXT_PUBLIC_API_URL set
- [ ] Kiosk Web has NEXT_PUBLIC_API_URL set
- [ ] All services use same timezone (UTC)
- [ ] Generate QR code → Session created in database ✓
- [ ] Scan QR code → Mobile editor loads ✓
- [ ] Session validates successfully ✓
- [ ] Can complete cake design ✓
- [ ] No "Session Expired" error ✓

## Support

If session still expires after configuration:

1. **Check server logs:**
   ```bash
   # Backend API logs
   tail -f logs/app.log | grep -i session

   # Or Render logs
   render logs --service goldenmunch-api --follow
   ```

2. **Check database:**
   ```sql
   -- View recent sessions
   SELECT session_token, status, created_at, expires_at,
          TIMESTAMPDIFF(MINUTE, NOW(), expires_at) as minutes_remaining
   FROM qr_code_sessions
   ORDER BY created_at DESC
   LIMIT 10;
   ```

3. **Test API directly:**
   ```bash
   # Generate session
   curl -X POST https://goldenmunch-api.onrender.com/api/kiosk/custom-cake/generate-qr \
     -H "Content-Type: application/json" \
     -d '{"kiosk_id": "TEST-001"}'

   # Validate session
   curl https://goldenmunch-api.onrender.com/api/custom-cake/session/SESSION_TOKEN_HERE
   ```

## Conclusion

The "Session Expired" issue is **NOT a session timeout problem** but a **configuration/deployment issue** where:
- Sessions are created on one server
- But validated against a different server
- Resulting in "session not found" → shown as "expired"

**Fix:** Ensure `NEXT_PUBLIC_API_URL` environment variable is correctly configured in the Mobile Editor deployment.
