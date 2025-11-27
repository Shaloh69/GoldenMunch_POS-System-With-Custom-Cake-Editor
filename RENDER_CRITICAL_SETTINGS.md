# RENDER DEPLOYMENT - CRITICAL SETTINGS

## Server (Backend API)

### ⚠️ MOST IMPORTANT SETTING

```
Root Directory: server
```

**WHY THIS IS CRITICAL:**
- Without this, Render builds from project root (/)
- Dockerfile tries to COPY package*.json from root
- Root doesn't have server's package.json
- Build fails with "npm ci requires package-lock.json"

### Complete Configuration

```yaml
Service Type: Web Service
Name: goldenmunch-api
Region: US East (or closest to you)
Branch: main (or your current branch)

# 🚨 THIS IS THE CRITICAL SETTING 🚨
Root Directory: server

Environment: Docker
Dockerfile Path: Dockerfile (relative to root directory)

Build Command: (leave empty - Docker handles it)
Start Command: (leave empty - Docker CMD handles it)

Instance Type: Starter ($7/month) or Free
```

### Environment Variables

Click "Advanced" → "Add Environment Variable" and add:

```env
NODE_ENV=production
PORT=5000
HOST=0.0.0.0

# Database (your Aiven MySQL)
DB_HOST=<your-aiven-mysql-host>
DB_PORT=27245
DB_USER=avnadmin
DB_PASSWORD=<your-aiven-password>
DB_NAME=defaultdb
DB_SSL=true

# JWT Secrets - GENERATE THESE FIRST!
# Run: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET=<paste-generated-64-char-string>
ADMIN_JWT_SECRET=<paste-generated-64-char-string>
CASHIER_JWT_SECRET=<paste-generated-64-char-string>

# CORS (update after deploying frontends)
CORS_ORIGIN=https://your-admin-url.onrender.com,https://your-editor-url.onrender.com

# URLs (update with actual Render URLs)
MOBILE_EDITOR_URL=https://your-editor-url.onrender.com
BACKEND_URL=https://your-api-url.onrender.com
FRONTEND_URL=https://your-admin-url.onrender.com

# Other settings
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
MAX_FILE_SIZE=10485760
LOG_LEVEL=info
```

## Admin/Cashier Portal

```yaml
Service Type: Web Service
Name: goldenmunch-admin
Branch: main

# 🚨 CRITICAL 🚨
Root Directory: client/cashieradmin

Environment: Docker
Dockerfile Path: Dockerfile
```

**Environment Variables:**
```env
NEXT_PUBLIC_API_URL=https://your-api-url.onrender.com/api
NEXT_PUBLIC_ENVIRONMENT=production
NEXT_PUBLIC_ENABLE_DEBUG=false
NEXT_PUBLIC_API_TIMEOUT=60000
NODE_ENV=production
```

## Mobile Cake Editor

```yaml
Service Type: Web Service
Name: goldenmunch-editor
Branch: main

# 🚨 CRITICAL 🚨
Root Directory: client/MobileEditor

Environment: Docker
Dockerfile Path: Dockerfile
```

**Environment Variables:**
```env
NEXT_PUBLIC_API_URL=https://your-api-url.onrender.com/api
NEXT_PUBLIC_ENVIRONMENT=production
NODE_ENV=production
```

---

## Common Mistakes to Avoid

❌ **WRONG:** Root Directory = `.` or empty
✅ **CORRECT:** Root Directory = `server`

❌ **WRONG:** Dockerfile Path = `server/Dockerfile`
✅ **CORRECT:** Dockerfile Path = `Dockerfile` (when Root Directory = server)

❌ **WRONG:** Setting environment variables after deployment
✅ **CORRECT:** Set environment variables BEFORE first deploy

---

## Deployment Order

1. ✅ Deploy **Server** first
2. ✅ Deploy **Admin** (use server's URL in NEXT_PUBLIC_API_URL)
3. ✅ Deploy **Editor** (use server's URL in NEXT_PUBLIC_API_URL)
4. ✅ Update server's **CORS_ORIGIN** with admin & editor URLs
5. ✅ Redeploy server with updated CORS

---

## If Build Still Fails

1. Check **Root Directory** is set to `server` (not empty, not `.`)
2. Check **Branch** matches your git branch name
3. Check **Dockerfile Path** is just `Dockerfile` (not `server/Dockerfile`)
4. Verify the logs show: "Copying from /opt/render/project/src/server"
5. If it shows copying from "/opt/render/project/src" (no /server), Root Directory is wrong
