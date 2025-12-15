# 🚀 Deployment Guide - Web Application

Complete guide to deploying the GoldenMunch Kiosk web application to Render.com.

---

## 📋 Prerequisites

- GitHub account with access to the repository
- Render.com account (free tier available)
- Backend API already deployed (required for app to function)

---

## 🌐 Deploy to Render.com

### Step 1: Create New Web Service

1. **Login to Render**: https://render.com/dashboard
2. **Click "New +"** in top right
3. **Select "Web Service"**

### Step 2: Connect Repository

**Option A: Connect via GitHub (Recommended)**
1. Click "Connect account" under GitHub
2. Authorize Render to access your repositories
3. Select repository: `Shaloh69/GoldenMunch_POS-System-With-Custom-Cake-Editor`
4. Click "Connect"

**Option B: Public Git Repository**
1. Enter repository URL: `https://github.com/Shaloh69/GoldenMunch_POS-System-With-Custom-Cake-Editor`
2. Click "Connect"

### Step 3: Configure Service Settings

Fill in the following settings:

**Basic Configuration:**
```yaml
Name: goldenmunch-kiosk-web
Region: Oregon (or closest to your location)
Branch: main
Root Directory: client/Kiosk_Web
```

**Build & Deploy:**
```yaml
Runtime: Node
Build Command: npm install && npm run build
Start Command: npm run start
```

**Instance Type:**
- Free (0GB RAM, sleeps after inactivity)
- Starter ($7/month, 512MB RAM, recommended)
- Standard ($25/month, 2GB RAM, for high traffic)

**Recommendation**: Start with **Starter** for stable performance.

### Step 4: Environment Variables

Click **"Advanced"** → **"Add Environment Variable"**

Add the following:

```bash
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://goldenmunch-pos-system-server.onrender.com/api
NEXT_PUBLIC_API_TIMEOUT=60000
PORT=3002
```

**Important:**
- Use your actual backend API URL
- Verify the backend is deployed and accessible
- PORT can be 3002 or 10000 (Render default)

### Step 5: Auto-Deploy Settings

**Auto-Deploy:**
- ✅ Enable "Auto-Deploy" (deploys on git push to main branch)

**Health Check:**
- Path: `/` (optional)
- Enable health check URL

### Step 6: Deploy

1. Click **"Create Web Service"**
2. Render will:
   - Clone your repository
   - Install dependencies
   - Build Next.js app
   - Start the server
3. **Wait 5-10 minutes** for first deployment

### Step 7: Get Your URL

Once deployed, Render provides a URL:
```
https://goldenmunch-kiosk-web.onrender.com
```

**Or custom domain (optional):**
1. Click "Settings" → "Custom Domains"
2. Add your domain: `kiosk.goldenmunch.com`
3. Configure DNS as instructed

---

## 🔧 Post-Deployment Configuration

### 1. Verify Deployment

**Test the app:**
```bash
# Open in browser
open https://goldenmunch-kiosk-web.onrender.com

# Or test API connection
curl https://goldenmunch-kiosk-web.onrender.com
```

**Expected**: App loads with menu page

### 2. Configure Electron Client

Now that the web app is deployed, configure the Electron client:

```bash
cd ../Kiosk_Electron
npm run dev

# Press Ctrl+Shift+C to open settings
# Enter: https://goldenmunch-kiosk-web.onrender.com
# Click "Test URL" → "Save & Reload"
```

### 3. Monitor Deployment

**Check logs:**
1. Go to Render Dashboard
2. Click on `goldenmunch-kiosk-web`
3. Click "Logs" tab
4. Monitor for errors

**Common logs:**
```
=== Starting Next.js server ===
Loaded env from .env.production
Ready on http://0.0.0.0:3002
```

---

## 🔄 Continuous Deployment

### Auto-Deploy on Git Push

**With auto-deploy enabled:**
```bash
# Make changes to your code
git add .
git commit -m "Update homepage layout"
git push origin main

# Render automatically:
# 1. Detects push to main branch
# 2. Pulls latest code
# 3. Runs npm install && npm run build
# 4. Restarts server with new code
# 5. Deployment live in ~5-10 minutes
```

**Check deployment status:**
- Render Dashboard → Events tab
- Email notifications (if enabled)

### Manual Deploy

**Trigger manual deployment:**
1. Go to Render Dashboard
2. Click `goldenmunch-kiosk-web`
3. Click "Manual Deploy" → "Deploy latest commit"

### Rollback to Previous Version

**If deployment fails:**
1. Go to Render Dashboard → Events
2. Find previous successful deployment
3. Click "Redeploy"

---

## 📊 Monitoring & Logs

### View Real-Time Logs

**Web Console:**
1. Render Dashboard → `goldenmunch-kiosk-web`
2. Click "Logs" tab
3. Auto-refreshes in real-time

**Filter logs:**
- Build logs (during deployment)
- Runtime logs (after deployment)
- Error logs only

### Common Log Messages

**Successful deployment:**
```
=== Build succeeded ===
Creating optimized production build
Compiled successfully
Route (app)  Size
/ (Server)   120kB

=== Server started ===
Ready on http://0.0.0.0:3002
```

**API connection success:**
```
API client initialized
Base URL: https://goldenmunch-pos-system-server.onrender.com/api
Timeout: 60000ms
```

**Common errors:**
```
Error: ECONNREFUSED - Backend API not accessible
TypeError: Cannot read property 'X' of undefined - Check code
Build failed - Check TypeScript errors
```

---

## 🛠️ Troubleshooting

### Issue: Build Fails

**Error: TypeScript compilation error**

**Solution:**
```bash
# Test build locally first
npm run build

# Fix TypeScript errors
npm run lint
```

**Error: Dependency installation failed**

**Solution:**
1. Check `package.json` for invalid dependencies
2. Ensure Node version matches (`engines.node`)
3. Clear Render build cache: Settings → "Clear build cache"

### Issue: Server Starts But Shows 500 Error

**Check:**
1. Environment variables are set correctly
2. Backend API is accessible
3. Check Render logs for specific error

**Solution:**
```bash
# Test API URL
curl https://goldenmunch-pos-system-server.onrender.com/api/menu

# Expected: JSON response with menu data
```

### Issue: App Loads But API Calls Fail

**Check:**
1. `NEXT_PUBLIC_API_URL` environment variable
2. Backend CORS settings
3. Backend API is running

**Debug:**
```bash
# Check environment variables in Render
# Dashboard → Settings → Environment

# Verify NEXT_PUBLIC_API_URL is set
NEXT_PUBLIC_API_URL=https://...
```

### Issue: Free Tier Sleeps (503 Error)

**Problem**: Free tier sleeps after 15 minutes of inactivity

**Solution:**
1. Upgrade to Starter plan ($7/month)
2. Or use cron job to ping every 10 minutes:
```bash
# Add to cron (external service)
*/10 * * * * curl https://goldenmunch-kiosk-web.onrender.com
```

### Issue: Slow Performance

**Solutions:**
1. **Upgrade instance**: Free → Starter → Standard
2. **Enable caching**: Add caching headers in `next.config.mjs`
3. **Optimize images**: Use Next.js Image component
4. **Reduce bundle size**: Check build output

### Issue: Environment Variables Not Loading

**Check:**
1. Variables are in Render Dashboard (not .env.local)
2. Variable names start with `NEXT_PUBLIC_` for client-side
3. Restart deployment after adding variables

**Solution:**
1. Go to Settings → Environment
2. Add variables
3. Click "Save Changes"
4. Redeploy: Manual Deploy → Deploy latest commit

---

## 🔐 Security Best Practices

### Environment Variables

✅ **DO:**
- Store sensitive data in Render environment variables
- Use `NEXT_PUBLIC_` prefix for client-side vars
- Keep `.env.production` in `.gitignore`

❌ **DON'T:**
- Commit `.env.production` to git
- Hardcode API keys in code
- Expose backend secrets to client

### HTTPS

✅ Render provides free SSL certificates
✅ All traffic is HTTPS by default
✅ No configuration needed

### CORS

**Configure backend to allow:**
```javascript
// Backend CORS config
cors({
  origin: [
    'https://goldenmunch-kiosk-web.onrender.com',
    'http://localhost:3002', // For development
  ],
})
```

---

## 📈 Performance Optimization

### 1. Enable Caching

**Update `next.config.mjs`:**
```javascript
const nextConfig = {
  // ... existing config
  headers: async () => [
    {
      source: '/public/:path*',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=31536000, immutable',
        },
      ],
    },
  ],
};
```

### 2. Optimize Images

**Use Next.js Image component:**
```tsx
import Image from 'next/image';

<Image
  src="/images/cake.jpg"
  alt="Cake"
  width={300}
  height={300}
  quality={80}
/>
```

### 3. Bundle Analysis

**Check bundle size:**
```bash
# Build and analyze
npm run build

# Look for large packages
# Consider lazy loading or code splitting
```

### 4. Database Connection Pooling

**If using database:**
- Use connection pooling
- Close connections properly
- Limit concurrent connections

---

## 💰 Cost Estimation

### Render Pricing (as of 2025)

**Free Tier:**
- $0/month
- 512MB RAM
- Sleeps after 15 minutes inactivity
- Good for testing only

**Starter Plan:**
- $7/month
- 512MB RAM
- Always on
- Recommended for production

**Standard Plan:**
- $25/month
- 2GB RAM
- High traffic support
- Auto-scaling

**Bandwidth:**
- 100GB/month included (all plans)
- $0.10/GB overage

**Estimate for kiosk:**
- Expected: **Starter plan** ($7/month)
- Traffic: Low (single kiosk device)
- Total: ~$7/month

---

## 🔄 Update Process

### Deploy New Features

**Standard workflow:**
```bash
# 1. Make changes locally
vim app/page.tsx

# 2. Test locally
npm run build
npm run start

# 3. Commit and push
git add .
git commit -m "Add new feature"
git push origin main

# 4. Render auto-deploys (5-10 minutes)

# 5. Verify deployment
open https://goldenmunch-kiosk-web.onrender.com
```

### Urgent Hotfix

**Fast deployment:**
```bash
# 1. Fix the issue
git add .
git commit -m "hotfix: Fix critical bug"
git push origin main

# 2. Monitor deployment in Render logs
# 3. Test immediately after deployment

# 4. If fails, rollback in Render Dashboard
```

---

## 📊 Monitoring Checklist

**Daily:**
- [ ] Check Render logs for errors
- [ ] Verify app is accessible
- [ ] Check API connectivity

**Weekly:**
- [ ] Review deployment history
- [ ] Check resource usage (RAM, CPU)
- [ ] Update dependencies if needed

**Monthly:**
- [ ] Review costs and usage
- [ ] Update Node.js/dependencies
- [ ] Backup configuration

---

## 🎯 Deployment Checklist

Before deploying to production:

**Code:**
- [ ] All TypeScript errors fixed (`npm run lint`)
- [ ] Build succeeds locally (`npm run build`)
- [ ] All features tested locally
- [ ] Environment variables documented

**Render Configuration:**
- [ ] Web service created
- [ ] Repository connected
- [ ] Root directory set: `client/Kiosk_Web`
- [ ] Build command: `npm install && npm run build`
- [ ] Start command: `npm run start`
- [ ] Environment variables added
- [ ] Auto-deploy enabled

**Post-Deployment:**
- [ ] App loads successfully
- [ ] API calls work
- [ ] Menu displays correctly
- [ ] Cart functionality works
- [ ] 3D cake editor loads
- [ ] Order submission works
- [ ] Electron client configured with URL

---

## 🆘 Support & Resources

**Render Documentation:**
- https://render.com/docs
- https://render.com/docs/deploy-nextjs-app

**Next.js Documentation:**
- https://nextjs.org/docs/deployment

**Support Channels:**
- Render Community: https://community.render.com
- Render Support: support@render.com (Starter plan and above)

---

**🎉 Your web app is now deployed and ready to be loaded by the Electron client!**
