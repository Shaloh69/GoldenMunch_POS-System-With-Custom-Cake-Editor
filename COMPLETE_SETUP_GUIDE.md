# 🚀 COMPLETE SETUP GUIDE - GoldenMunch Custom Cake System

## 📋 Prerequisites

- MySQL 8.0+ installed and running
- Node.js 18+ and npm installed
- Git installed
- Network access (same WiFi for all devices)

---

## STEP 1: DATABASE SETUP

### 1.1 Create Database

```bash
# Login to MySQL
mysql -u root -p

# Create database
CREATE DATABASE GoldenMunchPOS;
USE GoldenMunchPOS;
exit;
```

### 1.2 Run Migrations (IN ORDER!)

```bash
cd server/databaseSchema

# 1. Main schema (tables, users, menu, orders, etc.)
mysql -u root -p GoldenMunchPOS < GoldenMunchPOSV2.sql

# 2. Custom cake system (new tables for custom cakes)
mysql -u root -p GoldenMunchPOS < custom_cake_request_migration.sql

# 3. Create temporary test data (optional)
mysql -u root -p GoldenMunchPOS < create_temp_data.sql

# 4. Update credentials (sets admin/cashier passwords)
mysql -u root -p GoldenMunchPOS < update_credentials.sql
```

### 1.3 Verify Database

```bash
mysql -u root -p GoldenMunchPOS

# Check tables exist
SHOW TABLES;

# Should see these custom cake tables:
# - custom_cake_request
# - custom_cake_request_images
# - qr_code_sessions
# - custom_cake_notifications
# - v_pending_custom_cakes (view)
# - v_approved_custom_cakes (view)

# Check admin users
SELECT admin_id, username, email FROM admins;

# Check cashier users
SELECT cashier_id, name, email FROM cashiers;

exit;
```

**Default Credentials:**
- **Admin:** username: `admin`, password: `admin123`
- **Cashier:** username: `cashier1`, password: `cashier123`

---

## STEP 2: BACKEND SERVER SETUP

### 2.1 Install Dependencies

```bash
cd server
npm install
```

### 2.2 Configure Environment

**Find your server's network IP:**

```bash
# Linux/Mac:
ip addr show | grep "inet " | grep -v 127.0.0.1

# Windows:
ipconfig | findstr IPv4

# Example output: 192.168.1.100
```

**Create `.env` file:**

```bash
cp .env.example .env
nano .env  # or use any text editor
```

**Update `.env` with your values:**

```env
# Application
NODE_ENV=production
PORT=3001
HOST=0.0.0.0  # IMPORTANT: Listen on all network interfaces!

# Database (UPDATE WITH YOUR CREDENTIALS)
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=YOUR_MYSQL_PASSWORD  # ← Change this!
DB_NAME=GoldenMunchPOS

# JWT Secrets (GENERATE NEW ONES FOR PRODUCTION!)
# Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET=your_jwt_secret_key_change_this
ADMIN_JWT_SECRET=your_admin_jwt_secret_change_this
CASHIER_JWT_SECRET=your_cashier_jwt_secret_change_this

# JWT Expiration
ADMIN_JWT_EXPIRES_IN=8h
CASHIER_JWT_EXPIRES_IN=12h

# CORS (add your network IP)
CORS_ORIGIN=http://localhost:3000,http://192.168.1.100:3001

# Mobile Editor URL - USE YOUR NETWORK IP!
MOBILE_EDITOR_URL=http://192.168.1.100:3001  # ← Change to YOUR IP!
BACKEND_URL=http://192.168.1.100:3001        # ← Change to YOUR IP!

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# File Upload
MAX_FILE_SIZE=10485760

# Logging
LOG_LEVEL=info
```

### 2.3 Build and Test Backend

```bash
# Build TypeScript
npm run build

# Test connection
npm start

# Should see:
# ✓ Database connection established
# ✓ Server is running on http://0.0.0.0:3001
# ✓ API Base URL: http://0.0.0.0:3001/api
```

**Test from another device on network:**

```bash
# From your phone or another computer:
# Open browser and visit: http://YOUR_SERVER_IP:3001
# Should see API info or landing page
```

---

## STEP 3: MOBILE EDITOR SETUP

### 3.1 Install Dependencies

```bash
cd client/MobileEditor
npm install
```

### 3.2 Configure Environment

**Create `.env.local` file:**

```bash
cp .env.example .env.local
nano .env.local
```

**Update with your server IP:**

```env
# USE YOUR NETWORK IP (same as backend)!
NEXT_PUBLIC_API_URL=http://192.168.1.100:3001/api
```

### 3.3 Build Static Files

```bash
# Build for production
npm run build

# This creates static files in: out/
# The backend will serve these files automatically
```

**Verify build:**

```bash
ls -la out/
# Should see: index.html, _next/, etc.
```

---

## STEP 4: ADMIN DASHBOARD SETUP (Optional)

### 4.1 Install and Run

```bash
cd client/cashieradmin
npm install

# Development mode
npm run dev

# Access at: http://localhost:3000
```

### 4.2 Login

- Navigate to: `http://localhost:3000/admin/login`
- Username: `admin`
- Password: `admin123`

---

## STEP 5: KIOSK SETUP (Optional)

The Kiosk is an Electron desktop app that runs on the kiosk computer.

```bash
cd client/Kiosk
npm install

# Development mode
npm run dev

# Build for production
npm run build
```

---

## STEP 6: NETWORK & FIREWALL CONFIGURATION

### 6.1 Open Port 3001

**Linux (UFW):**
```bash
sudo ufw allow 3001/tcp
sudo ufw reload
sudo ufw status
```

**Linux (iptables):**
```bash
sudo iptables -A INPUT -p tcp --dport 3001 -j ACCEPT
sudo iptables-save
```

**Windows:**
1. Open Windows Defender Firewall
2. Advanced Settings → Inbound Rules
3. New Rule → Port → TCP → 3001
4. Allow the connection
5. Apply to all profiles

### 6.2 Verify Network Access

**From server computer:**
```bash
# Check server is listening
netstat -tuln | grep 3001
# or
ss -tuln | grep 3001
```

**From phone (connected to same WiFi):**
1. Open browser
2. Visit: `http://YOUR_SERVER_IP:3001`
3. Should see landing page or API info

**Test ping (optional):**
```bash
# From phone or another device:
ping YOUR_SERVER_IP
```

---

## STEP 7: END-TO-END TESTING

### 7.1 Start All Services

**Terminal 1 - Backend:**
```bash
cd server
npm start
```

**Terminal 2 - Admin Dashboard (optional):**
```bash
cd client/cashieradmin
npm run dev
```

**Terminal 3 - Kiosk (optional):**
```bash
cd client/Kiosk
npm run dev
```

### 7.2 Test Workflow

#### Test 1: Generate QR Code

**Option A: Via Kiosk**
1. Open Kiosk app
2. Click "Custom Cake"
3. QR code should appear
4. Check URL in logs - should be: `http://YOUR_IP:3001/?session=...`

**Option B: Via API (for testing)**
```bash
# Call QR generation endpoint
curl -X POST http://localhost:3001/api/kiosk/custom-cake/generate-qr \
  -H "Content-Type: application/json" \
  -d '{"kiosk_id": "KIOSK-001"}'

# Response includes qrCodeUrl (base64) and editorUrl
```

#### Test 2: Access from Phone

1. **Scan QR code** with phone camera
2. **Should open mobile editor** in browser
3. **Verify:**
   - Page loads successfully
   - Shows "Custom Cake Designer" heading
   - Shows "Step 1 of 8: Customer Info"
   - 3D preview area visible (may be blank initially)

#### Test 3: Design Cake

1. **Step 1 - Customer Info:**
   - Fill in: Name, Email, Phone
   - Event Type: Birthday
   - Click "Next Step"

2. **Step 2 - Layers:**
   - Select number of layers (1-5)
   - Click "Next Step"

3. **Step 3 - Flavors:**
   - Select flavor for each layer
   - Click "Next Step"

4. **Step 4 - Sizes:**
   - Select size for each layer
   - Click "Next Step"

5. **Step 5 - Frosting:**
   - Select frosting type
   - Pick frosting color
   - Choose candles
   - Click "Next Step"

6. **Step 6 - Decorations:**
   - Select theme
   - Add 3D decorations (flowers, stars, etc.)
   - 3D preview should update
   - Click "Next Step"

7. **Step 7 - Text:**
   - Add custom text
   - Choose color and font
   - Click "Next Step"

8. **Step 8 - Review:**
   - Verify all details
   - Check estimated price
   - Click "Submit for Review"

**Watch backend logs:**
```bash
# Should see:
[INFO] Session validated
[INFO] Draft saved (every 3 seconds)
[INFO] Images uploaded
[INFO] Request submitted - Status: pending_review
```

#### Test 4: Admin Review

1. **Open admin dashboard:** `http://localhost:3000/admin/custom-cakes`
2. **Login** with admin credentials
3. **Should see** the new request in "Pending" list
4. **Click** on request to view details
5. **Review** all cake specifications and 3D renders
6. **Approve** with:
   - Custom price (e.g., ₱1,500)
   - Preparation time (e.g., 3 days)
   - Pickup date and time
7. **Submit approval**

**Verify in database:**
```sql
SELECT request_id, customer_name, status, estimated_price, approved_price
FROM custom_cake_request
ORDER BY created_at DESC LIMIT 5;

-- Status should be 'approved'
```

---

## STEP 8: TROUBLESHOOTING

### Issue: "This site can't be reached" on phone

**Cause:** Phone can't access server IP

**Fix:**
1. Verify phone and server on same WiFi
2. Check firewall allows port 3001
3. Test: ping server IP from phone
4. Verify MOBILE_EDITOR_URL in server/.env is correct
5. Try accessing `http://SERVER_IP:3001` directly

### Issue: "Session Expired" immediately

**Cause:** Database migration not run or session validation failing

**Fix:**
```bash
# Re-run custom cake migration
mysql -u root -p GoldenMunchPOS < server/databaseSchema/custom_cake_request_migration.sql

# Check table exists
mysql -u root -p GoldenMunchPOS -e "SHOW TABLES LIKE '%qr_code%';"

# Check backend logs for errors
```

### Issue: QR code points to localhost

**Cause:** Environment variables not set

**Fix:**
```bash
# Check server/.env
grep MOBILE_EDITOR_URL server/.env

# Should show: MOBILE_EDITOR_URL=http://YOUR_IP:3001
# NOT: http://localhost

# Restart backend after changing .env
```

### Issue: 3D preview not showing

**Cause:** WebGL not supported or Three.js not loaded

**Fix:**
1. Check browser console for errors
2. Try different browser (Chrome recommended)
3. Verify build was successful:
   ```bash
   cd client/MobileEditor
   npm run build
   ls -la out/_next/static/chunks/
   # Should see many .js files including Three.js
   ```

### Issue: Auto-save not working

**Cause:** API URL incorrect or CORS issue

**Fix:**
```bash
# Check mobile editor .env.local
cat client/MobileEditor/.env.local

# Should match backend IP
# Rebuild after changing:
npm run build

# Check CORS in server/.env
grep CORS_ORIGIN server/.env

# Restart backend
```

### Issue: Build errors

**Cause:** Missing dependencies or TypeScript errors

**Fix:**
```bash
cd client/MobileEditor

# Clean and reinstall
rm -rf node_modules .next out
npm install

# Check for TypeScript errors
npx tsc --noEmit

# Try build again
npm run build
```

---

## STEP 9: PRODUCTION DEPLOYMENT

### 9.1 Security Checklist

- [ ] Change all default passwords (admin, cashier, database)
- [ ] Generate new JWT secrets (use crypto.randomBytes)
- [ ] Enable HTTPS (use nginx reverse proxy + Let's Encrypt)
- [ ] Set NODE_ENV=production
- [ ] Review CORS settings (don't use *)
- [ ] Enable database backups
- [ ] Set up logging and monitoring

### 9.2 Performance Optimization

- [ ] Build all apps in production mode
- [ ] Enable gzip compression (already enabled in Express)
- [ ] Configure CDN for static assets (optional)
- [ ] Database indexing (already done in migrations)
- [ ] Set up Redis for session caching (optional)

### 9.3 Monitoring

**Database:**
```sql
-- Monitor custom cake requests
SELECT
  DATE(created_at) as date,
  status,
  COUNT(*) as count,
  SUM(approved_price) as total_value
FROM custom_cake_request
WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY DATE(created_at), status
ORDER BY date DESC;
```

**Backend Logs:**
```bash
# Real-time logs
tail -f server/logs/*.log

# or with PM2 (production)
pm2 logs goldenmunch-backend
```

---

## ✅ VERIFICATION CHECKLIST

### Database
- [ ] MySQL running and accessible
- [ ] GoldenMunchPOS database created
- [ ] All migrations run successfully
- [ ] Custom cake tables exist (4 tables + 2 views)
- [ ] Admin and cashier users exist
- [ ] Can login with test credentials

### Backend
- [ ] Dependencies installed (`node_modules/` exists)
- [ ] `.env` file configured with network IP
- [ ] TypeScript compiled (`dist/` folder exists)
- [ ] Server starts without errors
- [ ] Can access `http://SERVER_IP:3001` from network
- [ ] API health check works: `http://SERVER_IP:3001/api/health`

### Mobile Editor
- [ ] Dependencies installed
- [ ] `.env.local` configured with server IP
- [ ] Build successful (`out/` folder exists with files)
- [ ] Can access `http://SERVER_IP:3001/` from phone
- [ ] Shows landing page when no session
- [ ] Shows editor when valid session provided

### Network
- [ ] Server and phone on same WiFi
- [ ] Firewall allows port 3001
- [ ] Can ping server from phone
- [ ] Can access backend from phone browser

### End-to-End
- [ ] Kiosk can generate QR code
- [ ] QR code URL uses network IP (not localhost)
- [ ] Phone can scan and access editor
- [ ] Session validates successfully
- [ ] All 8 steps work correctly
- [ ] 3D preview renders
- [ ] Auto-save works (check logs)
- [ ] Can submit request
- [ ] Request appears in admin dashboard
- [ ] Admin can approve/reject
- [ ] Email notifications work (if configured)

---

## 📞 QUICK REFERENCE

### Default Ports
- **Backend API:** 3001
- **Admin Dashboard:** 3000
- **Kiosk:** 3002 (Electron - local only)
- **Mobile Editor:** Served from backend (3001)

### Important URLs
- **Backend API:** `http://SERVER_IP:3001/api`
- **Mobile Editor:** `http://SERVER_IP:3001/`
- **Admin Dashboard:** `http://localhost:3000/admin`
- **Health Check:** `http://SERVER_IP:3001/api/health`

### Key Files
- **Backend Config:** `server/.env`
- **Mobile Config:** `client/MobileEditor/.env.local`
- **DB Migrations:** `server/databaseSchema/*.sql`
- **Deployment Guide:** `CUSTOM_CAKE_DEPLOYMENT.md`
- **Architecture:** `ARCHITECTURE_FIX.md`

### Common Commands
```bash
# Start backend
cd server && npm start

# Build mobile editor
cd client/MobileEditor && npm run build

# Check database
mysql -u root -p GoldenMunchPOS

# View logs
tail -f server/logs/*.log

# Test API
curl http://localhost:3001/api/health
```

---

## 🎉 SUCCESS!

If all checklist items are complete, your Custom Cake System is ready for production use!

**Test the complete workflow:**
1. Generate QR at kiosk → 2. Scan with phone → 3. Design cake → 4. Submit → 5. Admin reviews → 6. Customer picks up!

For detailed deployment instructions, see: `CUSTOM_CAKE_DEPLOYMENT.md`
For architecture details, see: `ARCHITECTURE_FIX.md`
