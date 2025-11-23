# Quick Fix: "Invalid Token" Authentication Error

## Problem
You're seeing this error:
```
Cashier JWT Verification Error: { error: 'invalid signature' }
```

## Root Cause
Your server doesn't have a `.env` file with proper JWT secrets, or the secrets changed between creating and verifying tokens.

## ✅ Solution (5 minutes)

### Step 1: Create .env File with Setup Script

**Option A: Interactive Setup (Recommended)**
```bash
cd server
node src/scripts/setup-env.js
```

Follow the prompts to configure your environment. The script will:
- Generate secure JWT secrets automatically
- Ask for your database configuration
- Create a properly formatted `.env` file

**Option B: Manual Setup**
1. Copy the example file:
   ```bash
   cd server
   cp .env.example .env
   ```

2. Generate secure secrets:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   # Run this 3 times to get 3 different secrets
   ```

3. Edit `.env` and replace these values:
   ```
   JWT_SECRET=<paste first secret here>
   ADMIN_JWT_SECRET=<paste second secret here>
   CASHIER_JWT_SECRET=<paste third secret here>
   ```

4. Update database credentials in `.env`:
   ```
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=your_user
   DB_PASSWORD=your_password
   DB_NAME=GoldenMunchPOS
   ```

### Step 2: Restart Server

Stop your current server (Ctrl+C) and restart it:
```bash
cd server
npm run dev
```

You should see:
```
============================================================
JWT CONFIGURATION DIAGNOSTIC
============================================================
Environment Variables:
  JWT_SECRET:          ✓ Set (hash: xxxxxxxx)
  ADMIN_JWT_SECRET:    ✓ Set (hash: xxxxxxxx)
  CASHIER_JWT_SECRET:  ✓ Set (hash: xxxxxxxx)

Status:
  Using default:       ✓ NO
  All secrets match:   ✗ NO

Recommendation:
  INFO: Using fallback secrets. Consider setting ADMIN_JWT_SECRET and CASHIER_JWT_SECRET explicitly.
============================================================
```

If you see `Using default: ⚠ YES`, the `.env` file wasn't loaded properly.

### Step 3: Clear Browser Tokens

**Method 1: Use the Utility Page**
1. Navigate to: `http://localhost:3000/clear-auth.html`
2. Click "Clear Authentication"
3. You'll be redirected to login

**Method 2: Browser Console**
1. Press `F12` → Console tab
2. Run:
   ```javascript
   localStorage.clear(); location.reload();
   ```

### Step 4: Log In Again

1. Navigate to your login page
2. Enter your credentials
3. New token will be created with the correct secrets ✓

You should now see successful login messages in the server console:
```
✓ Admin login successful: username (Secret hash: xxxxxxxx)
```

or

```
✓ Cashier login successful: CODE123 (Secret hash: xxxxxxxx)
```

## 🔍 Troubleshooting

### Check JWT Configuration
Visit this endpoint to see your JWT configuration:
```
http://localhost:5000/api/auth/diagnostic
```

Response should show:
```json
{
  "success": true,
  "data": {
    "hasJwtSecret": true,
    "hasAdminJwtSecret": true,
    "hasCashierJwtSecret": true,
    "usingDefaultSecret": false,
    "allSecretsMatch": false,
    "recommendation": "OK: JWT configuration looks good."
  }
}
```

### Still Getting Errors?

1. **Verify .env file exists:**
   ```bash
   cd server
   ls -la .env
   ```
   If it doesn't exist, run the setup script again.

2. **Check server logs:**
   When you start the server, look for the JWT diagnostic output.
   If it says "Using default: ⚠ YES", your .env file isn't being loaded.

3. **Verify .env format:**
   Make sure there are no spaces around the `=` sign:
   ```
   JWT_SECRET=abc123def456    ✓ Correct
   JWT_SECRET = abc123def456   ✗ Wrong (spaces)
   ```

4. **Clear ALL browser data:**
   ```javascript
   localStorage.clear();
   sessionStorage.clear();
   location.reload();
   ```

## 📚 Additional Resources

- [AUTHENTICATION_TROUBLESHOOTING.md](./AUTHENTICATION_TROUBLESHOOTING.md) - Detailed troubleshooting guide
- [server/.env.example](./server/.env.example) - Environment variable template
- Clear auth utility: `http://localhost:3000/clear-auth.html`

## ✨ What Was Fixed

1. **Enhanced Token Validation** - Added `.trim()` and empty token checks
2. **Better Error Logging** - JWT errors now show detailed diagnostic info
3. **Startup Diagnostic** - Server checks JWT config on startup
4. **Login Improvements** - Better validation and error handling
5. **Diagnostic Endpoint** - `/api/auth/diagnostic` to check configuration
6. **Setup Script** - Interactive tool to create `.env` file
7. **Clear Auth Utility** - Web page to easily clear stale tokens

## 🔐 Security Notes

- ⚠️ **NEVER** commit `.env` to version control (already in .gitignore)
- Keep JWT secrets secure and private
- Use different secrets for development and production
- Regenerate secrets if they're ever compromised
