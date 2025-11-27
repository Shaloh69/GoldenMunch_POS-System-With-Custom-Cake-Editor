# Complete Render Deployment Guide

This guide covers deploying the entire GoldenMunch POS system to Render.

## Architecture Overview

The system consists of **3 services** to deploy on Render:

1. **Backend API** (`server/`) - Node.js + Express + MySQL
2. **Admin/Cashier Portal** (`client/cashieradmin/`) - Next.js
3. **Mobile Cake Editor** (`client/MobileEditor/`) - Next.js (static)

Plus **1 external database**:
- **Aiven MySQL** (already configured)

**Note**: The Kiosk (`client/Kiosk/`) is a local Electron app and does NOT get deployed to Render.

---

## Service 1: Backend API

### Render Configuration

**Service Type**: Web Service
**Name**: `goldenmunch-api` (or your choice)
**Root Directory**: `server` ← **CRITICAL!**
**Environment**: Docker
**Dockerfile Path**: `Dockerfile` (relative to root directory)
**Region**: Choose closest to you

### Build Settings

Render will automatically detect the Dockerfile. No build command needed.

### Environment Variables

```env
NODE_ENV=production
PORT=5000
HOST=0.0.0.0

# Database (Aiven MySQL)
DB_HOST=<your-aiven-mysql-host>
DB_PORT=27245
DB_USER=avnadmin
DB_PASSWORD=<your-aiven-password>
DB_NAME=defaultdb
DB_SSL=true

# JWT Secrets - GENERATE THESE!
# Run: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET=<paste-generated-secret-here>
ADMIN_JWT_SECRET=<paste-generated-secret-here>
CASHIER_JWT_SECRET=<paste-generated-secret-here>

# CORS - Update after deploying frontends
CORS_ORIGIN=https://goldenmunch-admin.onrender.com,https://goldenmunch-editor.onrender.com

# URLs - Update after deploying
MOBILE_EDITOR_URL=https://goldenmunch-editor.onrender.com
BACKEND_URL=https://goldenmunch-api.onrender.com
FRONTEND_URL=https://goldenmunch-admin.onrender.com

# Other Settings
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
MAX_FILE_SIZE=10485760
LOG_LEVEL=info
```

### Post-Deployment

1. **Import Database Schema**: Run the SQL import to set up tables (see Database Setup below)
2. **Verify Health Check**: Visit `https://your-api.onrender.com/api/health`
3. **Update CORS**: Add actual frontend URLs to `CORS_ORIGIN`

---

## Service 2: Admin/Cashier Portal

### Render Configuration

**Service Type**: Web Service
**Name**: `goldenmunch-admin`
**Root Directory**: `client/cashieradmin` ← **CRITICAL!**
**Environment**: Docker
**Dockerfile Path**: `Dockerfile`
**Region**: Same as API for lower latency

### Environment Variables

```env
# API URL - Use your actual API service URL
NEXT_PUBLIC_API_URL=https://goldenmunch-api.onrender.com/api

# App Settings
NEXT_PUBLIC_APP_NAME=GoldenMunch Admin
NEXT_PUBLIC_ENVIRONMENT=production
NEXT_PUBLIC_ENABLE_DEBUG=false
NEXT_PUBLIC_ENABLE_ANALYTICS=false

# Timeouts
NEXT_PUBLIC_API_TIMEOUT=60000

# Node Settings
NODE_ENV=production
```

### Post-Deployment

1. Test login at `https://your-admin.onrender.com/login`
2. Verify API connectivity
3. Update server's `CORS_ORIGIN` with this URL

---

## Service 3: Mobile Cake Editor

### Render Configuration

**Service Type**: Web Service
**Name**: `goldenmunch-editor`
**Root Directory**: `client/MobileEditor` ← **CRITICAL!**
**Environment**: Docker
**Dockerfile Path**: `Dockerfile`
**Region**: Same as API

### Environment Variables

```env
# API URL
NEXT_PUBLIC_API_URL=https://goldenmunch-api.onrender.com/api

# App Settings
NEXT_PUBLIC_APP_NAME=GoldenMunch Cake Editor
NEXT_PUBLIC_ENVIRONMENT=production
NEXT_PUBLIC_ENABLE_DEBUG=false

# Timeouts
NEXT_PUBLIC_API_TIMEOUT=60000

# Node Settings
NODE_ENV=production
```

### Post-Deployment

1. Test QR code generation from admin panel
2. Scan QR code and verify editor loads
3. Test 3D cake customization features

---

## Database Setup

### Import Schema to Aiven

**Option 1: Using MySQL CLI**

```bash
mysql -h <your-aiven-mysql-host> \
      -P 27245 \
      -u avnadmin \
      -p \
      --ssl-mode=REQUIRED \
      defaultdb < server/databaseSchema/GoldenMunchPOSV3.sql
```

Password: `<your-aiven-password>`

**Option 2: Using Aiven Console**

1. Go to https://console.aiven.io
2. Navigate to your MySQL service
3. Use "Import Data" feature
4. Upload `server/databaseSchema/GoldenMunchPOSV3.sql`

### Verify Tables

```bash
mysql -h <host> -P 27245 -u avnadmin -p --ssl-mode=REQUIRED defaultdb -e "SHOW TABLES;"
```

You should see tables like:
- users
- menu_items
- orders
- categories
- etc.

---

## Complete Deployment Checklist

### Pre-Deployment

- [ ] Generate 3 JWT secrets
- [ ] Review all environment variables
- [ ] Ensure Aiven MySQL is accessible
- [ ] Import database schema to Aiven

### Deployment Order

1. [ ] Deploy Backend API first
   - [ ] Verify health check endpoint works
   - [ ] Test database connection

2. [ ] Deploy Admin Portal
   - [ ] Update `NEXT_PUBLIC_API_URL` with actual API URL
   - [ ] Test login functionality

3. [ ] Deploy Mobile Editor
   - [ ] Update `NEXT_PUBLIC_API_URL`
   - [ ] Test QR code flow

4. [ ] Update Server CORS
   - [ ] Add admin portal URL to `CORS_ORIGIN`
   - [ ] Add mobile editor URL to `CORS_ORIGIN`
   - [ ] Redeploy server

### Post-Deployment

- [ ] Test complete order flow:
  - [ ] Create order from admin
  - [ ] Process payment
  - [ ] Generate custom cake QR
  - [ ] Scan QR and design cake
  - [ ] Verify order appears in admin

- [ ] Configure Kiosk (local app):
  - [ ] Update `.env.local` with production API URL
  - [ ] Test kiosk → API connectivity

- [ ] Set up monitoring:
  - [ ] Enable Render health checks
  - [ ] Set up error tracking (optional)

---

## Important Notes

### 🚨 Critical Settings

1. **Root Directory**: Each service MUST have the correct root directory set or Docker won't find package files
2. **CORS**: Update server CORS after deploying frontends, or requests will be blocked
3. **SSL Database**: `DB_SSL=true` is required for Aiven connection

### 💾 File Storage Limitation

The server currently stores uploads locally in `uploads/` directory. **On Render, these files are lost on restart.**

**Production Solution**: Implement external file storage:
- AWS S3 (recommended)
- Cloudinary (good for images)
- DigitalOcean Spaces

### 🔒 Security Recommendations

1. Generate strong JWT secrets (64+ characters)
2. Never commit real credentials to git
3. Use Render's environment variables (encrypted at rest)
4. Enable HTTPS (automatic on Render)
5. Regularly rotate database passwords

### 💰 Render Pricing

- **Free Tier**: Services spin down after 15 minutes of inactivity (cold starts)
- **Paid Tier**: Recommended for production (always-on instances)
- **Database**: Aiven has separate pricing (already set up)

### 🐛 Troubleshooting

**"npm ci requires package-lock.json"**
- Check that Root Directory is set correctly
- Verify Dockerfile is in the right location

**"CORS policy blocked"**
- Update server's `CORS_ORIGIN` with frontend URLs
- Redeploy server after adding URLs

**"Database connection failed"**
- Verify `DB_SSL=true` is set
- Check Aiven credentials are correct
- Ensure port 27245 is used (not 3306)

**"Module not found" errors**
- Check that all dependencies are in package.json
- Verify Docker build completed successfully

---

## Support

For deployment issues:
1. Check Render deployment logs
2. Review this guide's troubleshooting section
3. Verify environment variables are set correctly
4. Test each service independently

## Next Steps After Deployment

1. **Set up custom domain** (optional)
2. **Configure file storage** (required for production)
3. **Set up monitoring/logging** (recommended)
4. **Enable automatic deployments** from git
5. **Configure backups** for MySQL database
