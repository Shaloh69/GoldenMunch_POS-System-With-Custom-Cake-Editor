# QR Code Session Troubleshooting Guide

## 🔍 Issue: "Session Expired Error" When Scanning QR Code

This guide helps diagnose and fix QR code session expiry issues in the custom cake workflow.

---

## ✅ Fixes Implemented

### 1. **MySQL Time-Based Expiry** (Main Fix)
**Problem**: JavaScript `Date` objects might not convert properly to MySQL `TIMESTAMP`, causing timezone mismatches.

**Solution**: Changed from JavaScript date calculation to MySQL's `DATE_ADD` function:
```sql
-- Before (problematic):
VALUES (..., ?)  -- JavaScript Date object

-- After (fixed):
VALUES (..., DATE_ADD(NOW(), INTERVAL 30 MINUTE))
```

This ensures:
- Expiry time is calculated using MySQL server time
- No timezone conversion issues
- Consistent time across all database operations

**File**: `server/src/controllers/customCake.controller.ts:177-189`

### 2. **Enhanced Logging**
Added detailed logging to help diagnose issues:
- Session creation logs
- Session validation logs with time remaining
- Server time vs expiry time comparison

**File**: `server/src/controllers/customCake.controller.ts:223-271`

### 3. **MySQL-Based Expiry Check**
Changed from JavaScript date comparison to MySQL comparison:
```sql
-- More reliable: Let MySQL do the comparison
SELECT (expires_at > NOW()) as is_valid
FROM qr_code_sessions
WHERE session_token = ?
```

**File**: `server/src/controllers/customCake.controller.ts:244-248`

---

## 🧪 Testing & Diagnosis

### Step 1: Generate a QR Code

**Kiosk Endpoint:**
```bash
curl -X POST http://localhost:5000/api/kiosk/custom-cake/generate-qr \
  -H "Content-Type: application/json" \
  -d '{"kiosk_id": "TEST_KIOSK"}'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "QR session created successfully",
  "data": {
    "sessionToken": "session-1733073600000-a1b2c3d4e5f6g7h8",
    "qrCodeUrl": "data:image/png;base64,...",
    "editorUrl": "http://localhost:3001/?session=session-1733073600000-a1b2c3d4e5f6g7h8",
    "expiresIn": 1800,
    "expiresAt": "2025-12-01T12:30:00.000Z"
  }
}
```

**Check Server Logs:**
```
✅ QR Session created: session-1733073600000... (expires in 30 min)
```

### Step 2: Validate the Session

**Copy the `sessionToken` from Step 1** and test validation:

```bash
curl http://localhost:5000/api/custom-cake/session/SESSION_TOKEN_HERE
```

**Expected Response (if valid):**
```json
{
  "success": true,
  "message": "Session is valid",
  "data": {
    "sessionToken": "session-1733073600000-a1b2c3d4e5f6g7h8",
    "expiresAt": "2025-12-01T12:30:00.000Z",
    "status": "active",
    "minutesRemaining": 29
  }
}
```

**Check Server Logs:**
```
📲 Validating session: session-1733073600000...
⏰ Session time check - Server: 2025-12-01T12:01:00.000Z, Expires: 2025-12-01T12:30:00.000Z, Remaining: 29 min
✅ Session valid: session-1733073600000... (29 min remaining)
```

### Step 3: Debug Session (New Diagnostic Endpoint)

**Get detailed session info:**
```bash
curl http://localhost:5000/api/custom-cake/session/SESSION_TOKEN_HERE/debug
```

**Response:**
```json
{
  "success": true,
  "message": "Session debug info",
  "data": {
    "session_token": "session-1733073600000-a1b2c3d4e5f6g7h8",
    "status": "active",
    "created_at": "2025-12-01T12:00:00.000Z",
    "expires_at": "2025-12-01T12:30:00.000Z",
    "server_time": "2025-12-01T12:05:00.000Z",
    "minutes_remaining": 25,
    "is_valid": 1,
    "diagnosis": {
      "found": true,
      "isValid": true,
      "minutesRemaining": 25,
      "status": "active",
      "hasBeenAccessed": true,
      "hasBeenUsed": false
    }
  }
}
```

**What to Check:**
- ✅ `is_valid: 1` → Session is still valid
- ✅ `minutes_remaining: 25` → Time left before expiry
- ✅ `status: "active"` → Not used or expired
- ❌ `is_valid: 0` → Session expired (check times)
- ❌ `status: "expired"` → Already marked expired
- ❌ `status: "used"` → Session already consumed

### Step 4: List Recent Sessions

**View last 10 sessions:**
```bash
curl http://localhost:5000/api/custom-cake/sessions/recent?limit=10
```

**Response:**
```json
{
  "success": true,
  "message": "Recent sessions",
  "data": {
    "total": 10,
    "sessions": [
      {
        "session_id": 5,
        "session_token_preview": "session-1733073600000-a1b2c3",
        "status": "active",
        "created_at": "2025-12-01T12:00:00.000Z",
        "expires_at": "2025-12-01T12:30:00.000Z",
        "minutes_remaining": 25,
        "is_valid": 1,
        "kiosk_id": "TEST_KIOSK"
      }
    ]
  }
}
```

---

## 🐛 Common Issues & Solutions

### Issue 1: "Session Expired" Immediately After Creation

**Symptoms:**
- QR code generated successfully
- Mobile editor shows "Session Expired" right away
- Debug endpoint shows `is_valid: 0` and negative `minutes_remaining`

**Possible Causes:**
1. **MySQL timezone mismatch**
2. **Server clock incorrect**
3. **Database time different from server time**

**Diagnosis:**
```bash
# Check if the fix is applied
curl http://localhost:5000/api/custom-cake/sessions/recent

# Look for:
# - created_at should be recent
# - expires_at should be 30 minutes after created_at
# - minutes_remaining should be positive
```

**Solution:**
1. Verify the fix is deployed (check server code)
2. Check MySQL timezone:
   ```sql
   SELECT NOW(), UTC_TIMESTAMP(), @@system_time_zone, @@global.time_zone;
   ```
3. Restart server to apply changes

### Issue 2: QR Code URL Incorrect

**Symptoms:**
- QR code scans but goes to wrong URL
- Mobile editor doesn't receive session token
- 404 or "Invalid session" error

**Diagnosis:**
```bash
# Check the generated editorUrl
curl -X POST http://localhost:5000/api/kiosk/custom-cake/generate-qr \
  -H "Content-Type: application/json" \
  -d '{"kiosk_id": "TEST"}'

# Verify editorUrl format:
# Correct: http://YOUR_IP:3001/?session=SESSION_TOKEN
# Wrong: http://localhost:3001/?session=SESSION_TOKEN (won't work from phone)
```

**Solution:**
Set `MOBILE_EDITOR_URL` in `.env`:
```env
# For local network testing (replace with your IP)
MOBILE_EDITOR_URL=http://192.168.1.100:3001

# Or use BACKEND_URL
BACKEND_URL=http://192.168.1.100:5000
```

### Issue 3: Mobile Editor Can't Reach API

**Symptoms:**
- QR code scans correctly
- Mobile editor loads but shows connection error
- API requests fail from phone

**Diagnosis:**
1. **Check mobile editor API URL**:
   - File: `client/MobileEditor/.env.local`
   - Should be: `NEXT_PUBLIC_API_URL=http://YOUR_IP:5000/api`
   - NOT: `http://localhost:5000/api`

2. **Test API reachability from phone**:
   - Open browser on phone
   - Visit: `http://YOUR_IP:5000/api`
   - Should see API info page

**Solution:**
```env
# client/MobileEditor/.env.local
NEXT_PUBLIC_API_URL=http://192.168.1.100:5000/api
```

Rebuild mobile editor:
```bash
cd client/MobileEditor
npm run build
```

### Issue 4: Session Status "used" But Not Completed

**Symptoms:**
- Can't reuse QR code
- Session shows `status: "used"`
- Customer didn't complete design

**Diagnosis:**
```bash
# Check session status
curl http://localhost:5000/api/custom-cake/session/SESSION_TOKEN/debug
```

**Solution:**
Sessions are single-use by design. Generate a new QR code:
```bash
curl -X POST http://localhost:5000/api/kiosk/custom-cake/generate-qr \
  -H "Content-Type: application/json" \
  -d '{"kiosk_id": "KIOSK_001"}'
```

---

## 📊 Monitoring Session Health

### Check Server Logs

When session is created:
```
✅ QR Session created: session-1733073600000... (expires in 30 min)
```

When session is validated:
```
📲 Validating session: session-1733073600000...
⏰ Session time check - Server: 2025-12-01T12:05:00.000Z, Expires: 2025-12-01T12:30:00.000Z, Remaining: 25 min
✅ Session valid: session-1733073600000... (29 min remaining)
```

When session expires:
```
❌ Session expired: session-1733073600000... (was valid for -5 min)
```

### Database Queries

**Check active sessions:**
```sql
SELECT
  session_id,
  LEFT(session_token, 30) as token_preview,
  status,
  created_at,
  expires_at,
  TIMESTAMPDIFF(MINUTE, NOW(), expires_at) as minutes_remaining,
  (expires_at > NOW()) as is_valid
FROM qr_code_sessions
WHERE status = 'active'
ORDER BY created_at DESC
LIMIT 10;
```

**Clean up expired sessions:**
```sql
UPDATE qr_code_sessions
SET status = 'expired'
WHERE expires_at < NOW()
AND status = 'active';
```

---

## 🔧 Configuration Checklist

### Server (.env)
```env
# Required for QR code to work from mobile devices
MOBILE_EDITOR_URL=http://YOUR_SERVER_IP:3001
BACKEND_URL=http://YOUR_SERVER_IP:5000

# Or in development
MOBILE_EDITOR_URL=http://localhost:3001
BACKEND_URL=http://localhost:5000
```

### Mobile Editor (.env.local)
```env
# Must match server IP/domain
NEXT_PUBLIC_API_URL=http://YOUR_SERVER_IP:5000/api

# Or in development
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### Network Configuration
- ✅ Server port 5000 accessible from network
- ✅ Mobile editor port 3001 accessible from network
- ✅ Firewall allows incoming connections
- ✅ Phone and server on same network (for local testing)

---

## 🚀 Testing End-to-End

### Complete Workflow Test

1. **Start Services**:
   ```bash
   # Terminal 1: Start server
   cd server
   npm run dev

   # Terminal 2: Start mobile editor
   cd client/MobileEditor
   npm run dev
   ```

2. **Generate QR Code**:
   ```bash
   curl -X POST http://localhost:5000/api/kiosk/custom-cake/generate-qr \
     -H "Content-Type: application/json" \
     -d '{"kiosk_id": "TEST_KIOSK"}'
   ```

3. **Scan QR Code**:
   - Use phone camera or QR scanner app
   - Should open mobile editor with session parameter
   - URL format: `http://YOUR_IP:3001/?session=SESSION_TOKEN`

4. **Verify Session in Mobile Editor**:
   - Mobile editor should load without errors
   - No "Session Expired" message
   - Design options should load

5. **Monitor Server Logs**:
   ```
   ✅ QR Session created: session-...
   📲 Validating session: session-...
   ✅ Session valid: session-... (29 min remaining)
   ```

### Debug Mode (Skip Session Validation)

For testing mobile editor without QR code:
```
http://localhost:3001/?debug=true
```

This bypasses session validation (development only).

---

## 📞 Still Having Issues?

If sessions are still expiring immediately after applying these fixes:

1. **Verify Fix Applied**:
   - Check `server/src/controllers/customCake.controller.ts`
   - Line 177-189 should use `DATE_ADD(NOW(), INTERVAL 30 MINUTE)`
   - NOT `VALUES (..., ?)`with JavaScript Date

2. **Restart Server**:
   ```bash
   # Stop server (Ctrl+C)
   # Start again
   npm run dev
   ```

3. **Check Database**:
   ```sql
   -- Should show recent time
   SELECT NOW();

   -- Check a session
   SELECT
     created_at,
     expires_at,
     TIMESTAMPDIFF(MINUTE, NOW(), expires_at) as mins_left
   FROM qr_code_sessions
   ORDER BY created_at DESC
   LIMIT 1;
   ```

4. **Use Debug Endpoint**:
   ```bash
   # Replace SESSION_TOKEN with actual token
   curl http://localhost:5000/api/custom-cake/session/SESSION_TOKEN/debug
   ```

5. **Check Server Logs**:
   - Look for the session validation logs
   - Check if `minutes_remaining` is positive
   - Verify server time vs expires time

---

## 📝 Summary of Changes

| Component | Change | Location |
|-----------|--------|----------|
| QR Generation | Use MySQL `DATE_ADD` instead of JS Date | `customCake.controller.ts:177-189` |
| Session Validation | MySQL-based expiry check | `customCake.controller.ts:244-248` |
| Logging | Enhanced session logging | `customCake.controller.ts:223-271` |
| Debug Endpoint | GET `/api/custom-cake/session/:token/debug` | `customCake.controller.ts:291-331` |
| List Sessions | GET `/api/custom-cake/sessions/recent` | `customCake.controller.ts:337-362` |
| Routes | Added debug endpoints | `routes/index.ts:399-400` |

---

**Last Updated**: December 2, 2025
**Version**: 1.1.0
