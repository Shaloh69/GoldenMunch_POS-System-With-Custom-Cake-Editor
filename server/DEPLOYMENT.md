# Server Deployment Guide

## Docker Build Instructions

### Important: Build Context

This Dockerfile **must** be built from the `server` directory, not the project root.

### Correct Build Commands

**From the server directory:**
```bash
cd server
docker build -t goldenmunch-server .
docker run -p 5000:5000 --env-file .env goldenmunch-server
```

**From the project root (alternative):**
```bash
docker build -f server/Dockerfile -t goldenmunch-server ./server
docker run -p 5000:5000 --env-file server/.env goldenmunch-server
```

⚠️ **Note the `./server` at the end** - this sets the build context to the server directory.

## Render Deployment Configuration

When deploying to Render, configure your Web Service with:

### Build Settings
- **Root Directory**: `server` ← **CRITICAL!**
- **Build Command**: (leave empty, Docker will handle it)
- **Dockerfile Path**: `Dockerfile` (relative to root directory)

OR if using the Dockerfile path from root:
- **Root Directory**: `.`
- **Dockerfile Path**: `server/Dockerfile`
- **Docker Context**: `server` ← **CRITICAL!**

### Environment Variables

Set these in Render's Environment tab:

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

# JWT Secrets (generate with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
JWT_SECRET=<generate>
ADMIN_JWT_SECRET=<generate>
CASHIER_JWT_SECRET=<generate>

# CORS (update with actual Render URLs)
CORS_ORIGIN=https://admin-goldenmunch.onrender.com,https://editor-goldenmunch.onrender.com

# URLs
MOBILE_EDITOR_URL=https://editor-goldenmunch.onrender.com
BACKEND_URL=https://api-goldenmunch.onrender.com
FRONTEND_URL=https://admin-goldenmunch.onrender.com

# Other Settings
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
MAX_FILE_SIZE=10485760
LOG_LEVEL=info
```

## Troubleshooting

### Error: "npm ci requires package-lock.json"

**Cause**: Docker build context is set to wrong directory.

**Solution**:
- Make sure **Root Directory** in Render is set to `server`
- OR use `./server` as the build context when building manually

### Error: "Cannot find module"

**Cause**: Dependencies not installed or wrong Node version.

**Solution**:
- Ensure Dockerfile uses Node 20 (currently: `node:20-alpine`)
- Verify all dependencies are in package.json

## File Storage Note

⚠️ The server currently stores uploads in the local `uploads/` directory. On Render, files will be **lost on restart**.

**Production Solution**: Set up external file storage:
- AWS S3
- Cloudinary
- DigitalOcean Spaces

## Database Schema

Before first deployment, import the database schema to your Aiven MySQL instance:

```bash
mysql -h <your-aiven-mysql-host> \
      -P 27245 \
      -u avnadmin \
      -p \
      --ssl-mode=REQUIRED \
      defaultdb < databaseSchema/GoldenMunchPOSV3.sql
```

Or use Aiven's web console to import the SQL file.
