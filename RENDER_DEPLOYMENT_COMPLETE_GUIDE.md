# GoldenMunch POS - Complete Render Deployment Guide

## 🚨 Why You're Getting 502 Error

Your **Kiosk Web app is deployed** but getting a 502 error because it's trying to connect to:
```
https://goldenmunch-pos-system-server.onrender.com/api
```

**This API server doesn't exist yet!** You need to deploy it first.

---

## 📋 System Architecture

The GoldenMunch POS system requires 3 components:

```
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│  Kiosk Web App  │─────▶│   API Server    │─────▶│  MySQL Database │
│   (Next.js)     │      │   (Node.js)     │      │   (Aiven/AWS)   │
│   Port: 10000   │      │   Port: 10000   │      │   Port: 3306    │
└─────────────────┘      └─────────────────┘      └─────────────────┘
        ✅                       ❌                        ❌
   DEPLOYED NOW            NEEDS DEPLOYMENT          NEEDS SETUP
```

---

## 🎯 Deployment Steps (In Order)

### Step 1: Set Up MySQL Database (FREE)

**Option A: Aiven (Recommended - Free 1GB)**

1. Go to https://aiven.io/
2. Sign up for free account
3. Create a new service:
   - Service: **MySQL**
   - Cloud: **AWS**
   - Region: **us-east-1** (or closest to you)
   - Plan: **Hobbyist - Free** (1GB storage, 1-3 nodes)
   - Service name: `goldenmunch-mysql`
4. Wait 5-10 minutes for database to start
5. Once running, click on your service and get:
   - **Host**: `goldenmunch-mysql-xxxxx.aivencloud.com`
   - **Port**: `25060` (or similar)
   - **Username**: `avnadmin`
   - **Password**: (shown in dashboard)
   - **Database**: `defaultdb`
   - **SSL Mode**: **REQUIRED** (Aiven requires SSL)
6. Download the CA Certificate (needed for SSL connection)

**Option B: PlanetScale (Alternative)**
- Free tier: 5GB storage
- Go to https://planetscale.com/
- Easier setup but different pricing model

**Option C: Render Managed MySQL**
- Not free, but integrates well
- $7/month for 1GB

---

### Step 2: Deploy API Server

1. **Go to Render Dashboard**: https://dashboard.render.com/

2. **Create New Web Service**:
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Service name: `goldenmunch-api-server`

3. **Configure Build Settings**:
   ```
   Root Directory: server
   Build Command: npm install && npm run build
   Start Command: node dist/server.js
   ```

4. **Docker Configuration** (Better option):
   - Runtime: **Docker**
   - Root Directory: `server`
   - Dockerfile Path: `./Dockerfile`

5. **Instance Type**:
   - Free tier (512MB) - Should work
   - OR Starter ($7/month, 1GB) - Recommended for production

6. **Environment Variables** - Set these in Render:

   ```bash
   # Node Environment
   NODE_ENV=production
   PORT=10000

   # Database Configuration (from Aiven)
   DB_HOST=goldenmunch-mysql-xxxxx.aivencloud.com
   DB_PORT=25060
   DB_USER=avnadmin
   DB_PASSWORD=your_aiven_password
   DB_NAME=defaultdb
   DB_SSL=true

   # JWT Secrets (generate with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
   JWT_SECRET=your_64_char_random_string_here
   ADMIN_JWT_SECRET=your_64_char_random_string_here
   CASHIER_JWT_SECRET=your_64_char_random_string_here

   # CORS Configuration
   CORS_ORIGIN=https://goldenmunch-pos-system-with-custom-cake-ud4p.onrender.com

   # URLs
   BACKEND_URL=https://goldenmunch-api-server.onrender.com
   FRONTEND_URL=https://goldenmunch-pos-system-with-custom-cake-ud4p.onrender.com
   ```

7. **Generate JWT Secrets** (run this locally):
   ```bash
   node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"
   node -e "console.log('ADMIN_JWT_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"
   node -e "console.log('CASHIER_JWT_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"
   ```

8. **Create Service** - Render will build and deploy

9. **Wait for deployment** (~5 minutes first time)

10. **Verify API is running**:
    - Visit: `https://goldenmunch-api-server.onrender.com/api/health`
    - Should see: `{"status":"ok"}`

---

### Step 3: Seed the Database

Once the API server is running, you need to populate the database with initial data.

**Option A: Run seed script via SSH (if available)**
```bash
node seedDatabase.js
node seedCredentials.js
```

**Option B: Use Render Shell**
1. In Render dashboard, go to your API service
2. Click "Shell" tab
3. Run:
   ```bash
   cd /app
   node dist/seedDatabase.js
   node dist/seedCredentials.js
   ```

**Option C: Create a seed endpoint** (temporary)
- Add a POST endpoint `/api/admin/seed` that runs the seed scripts
- Call it once, then remove it

---

### Step 4: Verify Kiosk Web App

Now that the API server is running, your Kiosk Web app should work!

1. **Check latest deployment**:
   - Go to Render dashboard
   - Find service: `goldenmunch-pos-system-with-custom-cake-ud4p`
   - Check if latest commit `961877f` (PORT fix) has deployed
   - If not, click "Manual Deploy" → "Deploy latest commit"

2. **Wait for deployment** (2-3 minutes)

3. **Test the website**:
   - Visit: https://goldenmunch-pos-system-with-custom-cake-ud4p.onrender.com
   - Should see the menu loading
   - No more 502 error!

---

## 🔍 Troubleshooting

### Still getting 502 on Kiosk Web?

1. **Check Render logs**:
   ```
   Render Dashboard → Your Service → Logs
   ```
   Look for errors like:
   - `ECONNREFUSED` - API server not reachable
   - `Port already in use` - PORT conflict
   - `Cannot connect to database` - DB config issue

2. **Check API server health**:
   ```
   curl https://goldenmunch-api-server.onrender.com/api/health
   ```
   Should return `{"status":"ok"}`

3. **Verify environment variables**:
   - Render Dashboard → Service → Environment
   - Make sure all variables are set correctly

4. **Check browser console**:
   - F12 → Console tab
   - Look for API request errors
   - Verify it's calling the correct API URL

### API Server won't start?

1. **Database connection issues**:
   - Verify DB_HOST, DB_PORT, DB_USER, DB_PASSWORD
   - For Aiven: Make sure DB_SSL=true
   - Check if database is running in Aiven dashboard

2. **Missing environment variables**:
   - JWT secrets must be set
   - All DB variables must be present

3. **Build failures**:
   - Check build logs for TypeScript errors
   - Make sure all dependencies installed

### Database connection errors?

1. **SSL Certificate**:
   - Aiven requires SSL
   - Set `DB_SSL=true`
   - Download CA cert if needed

2. **Firewall**:
   - Aiven: Allow connections from anywhere (0.0.0.0/0)
   - Check IP allowlist in database dashboard

3. **Credentials**:
   - Double-check username/password
   - Make sure you're using the correct database name

---

## 📊 Expected Resource Usage

### Free Tier (512MB RAM)
- ✅ Kiosk Web: 300-500MB (after Shadcn/ui migration)
- ✅ API Server: 200-400MB (Node.js with MySQL)
- ✅ Database: Aiven free tier (1GB storage)

**Total monthly cost: $0** 🎉

### Recommended Production Setup
- Kiosk Web: Starter ($7/month, 1GB RAM)
- API Server: Starter ($7/month, 1GB RAM)
- Database: Aiven Hobbyist (Free) or Starter ($10/month)

**Total monthly cost: $14-24**

---

## ✅ Success Checklist

- [ ] MySQL database created (Aiven/PlanetScale)
- [ ] Database credentials saved
- [ ] JWT secrets generated
- [ ] API server deployed on Render
- [ ] API server environment variables set
- [ ] API health check returns OK
- [ ] Database seeded with initial data
- [ ] Kiosk web app deployed with latest commit
- [ ] Website loads without 502 error
- [ ] Menu items display on homepage
- [ ] Can add items to cart

---

## 🎯 Next Steps After Deployment

1. **Test the kiosk**:
   - Browse menu
   - Add items to cart
   - Complete checkout
   - Verify orders in database

2. **Admin Dashboard** (optional):
   - Deploy admin dashboard at `client/Kiosk_Admin/`
   - Manage menu items, view orders, etc.

3. **Production Security**:
   - Set up custom domain
   - Enable HTTPS (automatic on Render)
   - Set up monitoring/alerts
   - Configure backups for database

4. **Kiosk Hardware Setup**:
   - Install Electron app on Raspberry Pi
   - Point to: `https://goldenmunch-pos-system-with-custom-cake-ud4p.onrender.com`
   - Configure auto-start

---

## 📞 Need Help?

Common issues and solutions:
1. **502 Error**: API server not deployed or database not connected
2. **Empty menu**: Database not seeded
3. **CORS errors**: Check CORS_ORIGIN env variable
4. **Slow loading**: Free tier instances sleep after inactivity (upgrade to Starter)

---

**Last Updated**: 2025-12-16
**Status**: Ready for deployment
**Estimated Setup Time**: 30-45 minutes
