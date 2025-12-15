# Kiosk Web Deployment Guide

## 🔴 Critical Issues Fixed

### Previous Problems
1. **Out of Memory (OOM)** - Running dev server in 512MB instance
2. **Slow Startup** - On-demand compilation causing timeout
3. **NODE_ENV Warning** - Non-standard environment configuration
4. **HeroUI SSR Errors** - Stack overflow during production build

### Solutions Implemented
1. **Multi-stage optimized build** - Separate deps, build, and runtime stages
2. **Standalone output mode** - Minimal production bundle
3. **Memory limits configured** - Build: 2GB, Runtime: 512MB-1GB
4. **Health check timing** - Extended to 40s start period

---

## 📋 Deployment Options

### **Option 1: Production Build (Recommended)**

**Dockerfile:** `Dockerfile.production`

**Memory:** 1GB instance minimum (512MB may work but tight)

**Render Configuration:**
```yaml
services:
  - type: web
    name: goldenmunch-kiosk-web
    env: docker
    dockerfilePath: ./client/Kiosk_Web/Dockerfile.production
    dockerContext: ./client/Kiosk_Web
    plan: starter  # 1GB RAM
    envVars:
      - key: NODE_ENV
        value: production
      - key: NEXT_PUBLIC_API_URL
        value: https://your-api-url.com/api
      - key: PORT
        value: 3002
```

**Benefits:**
- ✅ Optimized bundle (~30MB vs 800MB+)
- ✅ Fast startup (3-5 seconds)
- ✅ Low memory usage (~300-500MB)
- ✅ Production-grade performance

---

### **Option 2: Development Server (Current - NOT RECOMMENDED)**

**Dockerfile:** `Dockerfile.dev`

**Memory:** 2GB instance minimum

**Issues:**
- ❌ High memory usage (800MB-1.2GB)
- ❌ Slow startup (30-60 seconds)
- ❌ On-demand compilation
- ❌ Non-optimized code

**Only use if:**
- Production build fails with errors
- Need hot reload in production (debugging)
- Temporary workaround while fixing build issues

---

### **Option 3: Static Export (Most Efficient)**

**Best for:** Read-only kiosk UIs without API routes

**Modify `next.config.mjs`:**
```javascript
const nextConfig = {
  output: 'export',  // Change from 'standalone'
  images: {
    unoptimized: true,
  },
  // ... rest unchanged
};
```

**Dockerfile:** Use Nginx to serve static files
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --legacy-peer-deps --ignore-scripts
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/out /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**Benefits:**
- ✅ **Smallest footprint** (~50MB RAM)
- ✅ **Instant startup** (no compilation)
- ✅ **CDN-ready** static files
- ✅ **Cheapest hosting** (static hosting free on many platforms)

---

## 🚀 Deployment Steps

### **Step 1: Choose Deployment Method**

**For Render (Cloud Deployment):**
```bash
# Use Dockerfile.production
cp client/Kiosk_Web/Dockerfile.production client/Kiosk_Web/Dockerfile

# Push to Git
git add .
git commit -m "Switch to production Dockerfile"
git push
```

**For Docker Compose (Local/VPS):**
```yaml
# In docker-compose.yml
services:
  kiosk-web:
    build:
      context: ./client/Kiosk_Web
      dockerfile: Dockerfile.production
    ports:
      - "3002:3002"
    environment:
      NODE_ENV: production
      NEXT_PUBLIC_API_URL: http://server:3001/api
    mem_limit: 1g
    restart: unless-stopped
```

---

### **Step 2: Configure Environment Variables**

**Required Variables:**
```bash
NODE_ENV=production
PORT=3002
NEXT_PUBLIC_API_URL=https://api.goldenmunch.com/api
NEXT_TELEMETRY_DISABLED=1
```

**Optional Variables:**
```bash
# Memory tuning
NODE_OPTIONS=--max-old-space-size=768

# Logging
LOG_LEVEL=info
```

---

### **Step 3: Test Build Locally**

**Test production build:**
```bash
cd client/Kiosk_Web

# Build Docker image
docker build -f Dockerfile.production -t kiosk-web:test .

# Run container
docker run -p 3002:3002 \
  -e NODE_ENV=production \
  -e NEXT_PUBLIC_API_URL=http://localhost:3001/api \
  kiosk-web:test

# Test in browser
curl http://localhost:3002
```

**Expected output:**
```
< HTTP/1.1 200 OK
< Content-Type: text/html
```

---

### **Step 4: Monitor Deployment**

**Render Logs:**
```bash
# View build logs
render logs --service goldenmunch-kiosk-web --build

# View runtime logs
render logs --service goldenmunch-kiosk-web --tail
```

**Docker Logs:**
```bash
docker logs -f <container-id>
```

**Health Check:**
```bash
curl http://localhost:3002
```

---

## 🐛 Troubleshooting

### **Issue: "Out of memory" during build**

**Solution:**
```bash
# Increase build memory
docker build --memory=4g -f Dockerfile.production .
```

**Or in Render:** Upgrade to Standard plan (4GB build memory)

---

### **Issue: "Module not found" errors**

**Cause:** Missing dependencies in standalone output

**Solution:**
```bash
# Ensure all runtime deps in package.json dependencies (not devDependencies)
npm install --save <missing-package>
```

---

### **Issue: "ECONNREFUSED" or API errors**

**Cause:** Incorrect API URL

**Solution:**
```bash
# Check environment variable
echo $NEXT_PUBLIC_API_URL

# Should be: https://your-api-domain.com/api
# NOT: http://localhost:3001/api (unless same machine)
```

---

### **Issue: "Health check failed"**

**Cause:** App not ready before health check

**Solution in Dockerfile.production:49:**
```dockerfile
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3002', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"
```

Increase `--start-period` to 60s or 90s for slower instances.

---

## 📊 Memory Usage Comparison

| Mode | Build Memory | Runtime Memory | Startup Time |
|------|--------------|----------------|--------------|
| **Dev Server** | N/A | 800-1200MB | 30-60s |
| **Production Standalone** | 2GB | 300-500MB | 3-5s |
| **Static Export** | 1GB | 50-100MB | <1s |

---

## 🔧 Configuration Files Reference

### **Dockerfile.production** (Recommended)
- Multi-stage build
- Standalone output
- Memory optimized
- Health checks

### **Dockerfile** (Original)
- Production build
- Missing memory optimizations
- May hit OOM on build

### **Dockerfile.dev** (Temporary Workaround)
- Development server
- High memory usage
- Use only for debugging

---

## 📝 Best Practices

1. **Always use production builds** for deployment
2. **Set NODE_ENV=production** in environment
3. **Use standalone output** for optimal bundle size
4. **Configure health checks** with appropriate start periods
5. **Monitor memory usage** and scale instance if needed
6. **Enable telemetry opt-out** (`NEXT_TELEMETRY_DISABLED=1`)
7. **Use .dockerignore** to reduce build context

---

## 🎯 Recommended Configuration (Summary)

**For Cloud Deployment (Render/Fly.io/Railway):**
- **Dockerfile:** `Dockerfile.production`
- **Instance Size:** 1GB RAM minimum
- **Output Mode:** `standalone`
- **NODE_ENV:** `production`

**For Self-Hosted (VPS/On-Premise):**
- **Deployment:** Docker Compose
- **Resources:** 1 CPU, 1GB RAM
- **Reverse Proxy:** Nginx or Caddy
- **SSL:** Let's Encrypt

**For Static Hosting (Netlify/Vercel/S3):**
- **Output Mode:** `export`
- **Build Command:** `npm run build`
- **Publish Directory:** `out`
- **No server required**

---

## 📞 Support

If issues persist:
1. Check Next.js build logs: `npm run build`
2. Verify dependencies: `npm audit`
3. Test Docker build: `docker build --progress=plain .`
4. Review Render logs in dashboard

Common errors documented in: `KIOSK_ISSUES_ANALYSIS.md`
