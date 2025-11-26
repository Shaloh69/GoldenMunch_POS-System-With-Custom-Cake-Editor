# Authentication Troubleshooting Guide

## "Invalid Token" Error with "invalid signature"

If you're seeing this error in the logs:
```
Cashier JWT Verification Error: {
  error: 'invalid signature',
  url: '/cashier/orders...',
  method: 'GET',
  authHeader: 'Present'
}
```

### Root Cause
This error occurs when a JWT token was created with one secret key but is being verified with a different secret key. This commonly happens when:

1. The `.env` file was created, modified, or deleted
2. Environment variables changed between server restarts
3. Old tokens are still stored in the browser from a previous session

### Solution

Follow these steps in order:

#### Step 1: Ensure Server Has Proper Configuration

1. Verify that `/server/.env` exists with proper JWT secrets
   - A `.env` file has been created with secure random secrets
   - If you need to regenerate secrets, use: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

2. Restart the server to load the new `.env` file:
   ```bash
   cd server
   npm run dev
   ```

#### Step 2: Clear Browser Authentication Data

You have three options:

**Option A: Use the Clear Auth Utility Page**
1. Navigate to `http://localhost:3000/clear-auth.html` (or your cashier/admin app URL + `/clear-auth.html`)
2. Click "Clear Authentication"
3. You'll be redirected to the login page

**Option B: Use Browser Developer Tools**
1. Open your browser's Developer Tools (F12 or right-click → Inspect)
2. Go to the "Application" or "Storage" tab
3. Find "Local Storage" in the left sidebar
4. Click on your application's domain (e.g., `http://localhost:3000`)
5. Delete these keys:
   - `auth_token`
   - `auth_user`
6. Refresh the page

**Option C: Use Browser Console**
1. Open your browser's Developer Tools (F12)
2. Go to the "Console" tab
3. Run this command:
   ```javascript
   localStorage.removeItem('auth_token'); localStorage.removeItem('auth_user'); window.location.reload();
   ```

#### Step 3: Log In Again

1. Navigate to the login page
2. Enter your credentials
3. The new token will be created with the correct secret key

### Prevention

To avoid this issue in the future:

1. **Don't modify JWT secrets in production** - Once set, JWT secrets should remain constant
2. **Use environment-specific secrets** - Different secrets for development, staging, and production
3. **Document secret changes** - If you must change secrets, notify all users to log in again

### Technical Details

The authentication flow:
- **Login**: Token is signed with `CASHIER_JWT_SECRET` (or `ADMIN_JWT_SECRET` for admins)
- **Verification**: Token is verified with the same secret
- **Mismatch**: If secrets differ, JWT throws "invalid signature" error

The middleware now includes enhanced logging to help diagnose these issues:
- `server/src/middleware/auth.middleware.ts:111-116` - Logs detailed error information
- Includes URL, method, and whether auth header is present
