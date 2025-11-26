# Custom Cake System - Deployment Guide

## 🎯 Architecture Overview

### The Problem (Fixed)
- ❌ **Old:** Mobile editor was in Kiosk Electron app → Phones couldn't access localhost
- ❌ **Old:** QR codes pointed to `http://localhost:3002` → Not accessible from network

### The Solution (Implemented)
- ✅ **New:** Mobile editor is a **separate Next.js app** built as static files
- ✅ **New:** Static files **served by Express backend** (port 3001)
- ✅ **New:** QR codes point to `http://SERVER_IP:3001/?session=TOKEN`
- ✅ **New:** Phones can access backend via network → Editor works!

## 📦 Components

### 1. Kiosk (Electron App - `client/Kiosk`)
- Runs on kiosk computer (desktop app)
- **Cannot be accessed from phones**
- Generates QR codes for custom cakes
- Calls: `POST /api/kiosk/custom-cake/generate-qr`

### 2. Mobile Editor (Next.js App - `client/MobileEditor`)
- **New standalone application**
- Built as static HTML/CSS/JS files
- Served from backend server
- **Accessible from mobile devices**

### 3. Backend Server (Express API - `server`)
- Runs on port 3001
- **Serves mobile editor static files**
- Provides all custom cake APIs
- **Accessible via network IP**

### 4. Admin Dashboard (`client/cashieradmin`)
- Review and approve custom cake requests
- Set pricing and scheduling
- View all pending/approved orders

## 🚀 Deployment Steps

### Step 1: Build Mobile Editor

```bash
cd client/MobileEditor

# Install dependencies (if not done)
npm install

# Build static files
npm run build
```

This creates static files in `client/MobileEditor/out/`

### Step 2: Configure Backend

1. **Find your server's network IP:**

   **Linux/Mac:**
   ```bash
   ip addr show | grep "inet "
   # or
   ifconfig | grep "inet "
   ```

   **Windows:**
   ```bash
   ipconfig
   ```

   Look for something like `192.168.1.100` (your local network IP)

2. **Update `server/.env`:**

   ```env
   # Use your actual server IP
   MOBILE_EDITOR_URL=http://192.168.1.100:3001
   BACKEND_URL=http://192.168.1.100:3001

   # Ensure port matches
   PORT=3001
   HOST=0.0.0.0
   ```

   **Important:** Use `HOST=0.0.0.0` to listen on all network interfaces!

### Step 3: Update Mobile Editor Environment

1. **Update `client/MobileEditor/.env.local`:**

   ```env
   # Use your actual server IP
   NEXT_PUBLIC_API_URL=http://192.168.1.100:3001/api
   ```

2. **Rebuild mobile editor** (since env vars are embedded):

   ```bash
   cd client/MobileEditor
   npm run build
   ```

### Step 4: Build and Start Backend

```bash
cd server

# Build TypeScript
npm run build

# Start production server
npm start
```

Backend will:
- Start on port 3001
- Serve mobile editor from `client/MobileEditor/out/`
- Be accessible at `http://192.168.1.100:3001`

### Step 5: Test End-to-End

1. **From kiosk, generate QR code:**
   - Open Kiosk app
   - Click "Custom Cake"
   - QR code appears

2. **Verify QR code URL:**
   - Should be: `http://192.168.1.100:3001/?session=...`
   - NOT: `http://localhost:3002/...`

3. **Scan with phone:**
   - Use phone camera to scan QR
   - Should open mobile cake editor
   - Verify session validates correctly

4. **Design a test cake:**
   - Fill in customer info
   - Select layers, flavors, sizes
   - Add decorations and text
   - Submit for review

5. **Check admin dashboard:**
   - Open admin dashboard
   - Navigate to Custom Cakes
   - Verify request appears in pending list

## 🔧 Configuration Files

### Backend (`server/.env`)

```env
# Server Configuration
NODE_ENV=production
PORT=3001
HOST=0.0.0.0  # IMPORTANT: Listen on all interfaces

# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=GoldenMunchPOS

# JWT Secrets
JWT_SECRET=your_jwt_secret
ADMIN_JWT_SECRET=your_admin_jwt_secret
CASHIER_JWT_SECRET=your_cashier_jwt_secret

# Mobile Editor URL (for QR code generation)
# USE YOUR ACTUAL SERVER IP!
MOBILE_EDITOR_URL=http://192.168.1.100:3001
BACKEND_URL=http://192.168.1.100:3001

# CORS (add your server IP)
CORS_ORIGIN=http://localhost:3000,http://192.168.1.100:3001
```

### Mobile Editor (`client/MobileEditor/.env.local`)

```env
# USE YOUR ACTUAL SERVER IP!
NEXT_PUBLIC_API_URL=http://192.168.1.100:3001/api
```

## 🌐 Network Requirements

### Firewall Configuration

**Allow incoming connections on port 3001:**

**Linux (UFW):**
```bash
sudo ufw allow 3001/tcp
```

**Linux (iptables):**
```bash
sudo iptables -A INPUT -p tcp --dport 3001 -j ACCEPT
```

**Windows:**
1. Open Windows Firewall
2. Create inbound rule for port 3001
3. Allow TCP connections

### WiFi Network

**Ensure all devices are on the same network:**
- Kiosk computer
- Backend server (may be same as kiosk)
- Mobile phones scanning QR codes

## 📱 Mobile Testing Checklist

- [ ] Phone can ping server IP
- [ ] Phone can access `http://SERVER_IP:3001` (should see landing page)
- [ ] QR code URL contains session token
- [ ] Mobile editor loads on phone
- [ ] 3D preview renders correctly
- [ ] Can navigate all 8 steps
- [ ] Auto-save works (check backend logs)
- [ ] Final submission succeeds
- [ ] Request appears in admin dashboard

## 🐛 Common Issues

### Issue: "This site can't be reached"

**Cause:** Firewall blocking port 3001 or wrong IP address

**Fix:**
1. Verify server IP: `ip addr` or `ipconfig`
2. Check firewall: `sudo ufw status`
3. Test from another computer first
4. Try accessing `http://SERVER_IP:3001` directly

### Issue: "Session Expired" immediately

**Cause:** Database not migrated or session validation failing

**Fix:**
1. Run custom cake migration:
   ```bash
   cd server
   mysql -u root -p GoldenMunchPOS < databaseSchema/custom_cake_request_migration.sql
   ```
2. Check backend logs for errors
3. Verify `qr_code_sessions` table exists

### Issue: QR code still points to localhost

**Cause:** Environment variables not set or backend not rebuilt

**Fix:**
1. Check `server/.env` has correct `MOBILE_EDITOR_URL`
2. Restart backend: `npm start`
3. Generate new QR code (old ones have cached URL)

### Issue: 3D preview blank/white

**Cause:** WebGL not supported or Three.js failed to load

**Fix:**
1. Check phone browser (use Chrome for Android or Safari for iOS)
2. Check browser console for errors
3. Verify `client/MobileEditor/out/_next/` has Three.js bundles
4. Try different phone or clear browser cache

### Issue: Auto-save failing

**Cause:** API URL incorrect or CORS blocking requests

**Fix:**
1. Check mobile editor `.env.local` has correct API URL
2. Rebuild mobile editor after changing env
3. Check backend CORS allows mobile editor origin
4. Verify network connectivity

## 📊 Monitoring

### Backend Logs

```bash
cd server
npm start

# Watch for:
# - "QR session created" - Kiosk generated QR
# - "Session validated" - Phone accessed editor
# - "Draft saved" - Auto-save working
# - "Request submitted" - Final submission
```

### Database Queries

```sql
-- Check recent QR sessions
SELECT * FROM qr_code_sessions ORDER BY created_at DESC LIMIT 10;

-- Check custom cake requests
SELECT request_id, customer_name, status, created_at
FROM custom_cake_request
ORDER BY created_at DESC LIMIT 10;

-- Check pending reviews
SELECT * FROM v_pending_custom_cakes;
```

## 🔄 Update Workflow

When making changes to mobile editor:

```bash
# 1. Make changes to code
cd client/MobileEditor

# 2. Rebuild
npm run build

# 3. Restart backend (it serves the new files)
cd ../../server
npm start
```

**No need to restart Kiosk** - it just generates QR codes!

## 📝 Production Checklist

- [ ] Database migrated (custom_cake_request_migration.sql)
- [ ] Mobile editor built (`npm run build` in client/MobileEditor)
- [ ] Backend `.env` configured with server IP
- [ ] Mobile editor `.env.local` configured with server IP
- [ ] Firewall allows port 3001
- [ ] Backend server starts without errors
- [ ] Can access `http://SERVER_IP:3001` from phone
- [ ] QR code generation works from kiosk
- [ ] QR code points to correct URL (not localhost)
- [ ] Phone can scan and access editor
- [ ] Session validation works
- [ ] Auto-save works
- [ ] Submission works
- [ ] Admin can see pending requests
- [ ] Admin can approve/reject

## 🎉 Success Indicators

When everything is working:

1. **Kiosk:**
   - Generates QR code with `http://SERVER_IP:3001/?session=...`
   - No errors in console

2. **Phone:**
   - Scans QR code
   - Opens cake editor smoothly
   - 3D preview renders
   - Can navigate all steps
   - Sees "Saving..." indicator periodically

3. **Backend:**
   - Logs show session validation
   - Logs show draft saves
   - Logs show final submission

4. **Admin:**
   - Sees new request in pending list
   - Can view full design details
   - Can approve with pricing
   - Customer receives confirmation email

## 📞 Support

If you encounter issues:

1. Check this guide's "Common Issues" section
2. Review backend logs for error messages
3. Check browser console on mobile device
4. Verify all environment variables are set correctly
5. Ensure database is migrated and backend is running

---

**Architecture Diagram:**

```
┌─────────────────┐         ┌──────────────────┐
│  Kiosk (Electron)│         │  Phone (Browser) │
│  localhost:3002  │         │                  │
└────────┬────────┘         └────────┬─────────┘
         │                           │
         │ Generate QR               │ Scan QR
         │                           │
         ▼                           ▼
    ┌────────────────────────────────────┐
    │   Backend Server (Express)         │
    │   http://SERVER_IP:3001            │
    │                                    │
    │   - API Endpoints (/api/*)        │
    │   - Static Files (Mobile Editor)  │
    │   - QR Generation                 │
    └───────────┬────────────────────────┘
                │
                ▼
        ┌───────────────┐
        │   Database    │
        │   (MySQL)     │
        └───────────────┘
```

**Key Point:** Backend server is accessible from both kiosk (localhost) and phones (network IP)!
