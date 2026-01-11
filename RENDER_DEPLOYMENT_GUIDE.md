# 🚀 Render Deployment Guide for GoldenMunch POS

This guide will help you deploy the GoldenMunch POS system to Render with Redis Cloud integration.

## 📋 Prerequisites

- ✅ Render account (free tier available)
- ✅ Redis Cloud instance (you have: `redis-12362.crce178.ap-east-1-1.ec2.cloud.redislabs.com:12362`)
- ✅ MySQL database (Aiven, PlanetScale, or Render PostgreSQL)
- ✅ Supabase account (for image storage)
- ✅ Email SMTP credentials (Gmail, SendGrid, etc.)

---

## 🔧 Step 1: Redis Cloud Configuration

### Your Redis Cloud Details:
```
Host: redis-12362.crce178.ap-east-1-1.ec2.cloud.redislabs.com
Port: 12362
Username: goldenmunch-MKA164UW
Password: [You need to get this from Redis Cloud dashboard]
```

### How to Get Your Redis Password:
1. Go to [Redis Cloud Console](https://app.redislabs.com/)
2. Navigate to **Databases** → Select your database
3. Click **Configuration** tab
4. Find **Default user password** or create a new access key
5. Copy the password

### Build Your Redis URL:
Your Redis URL format should be:
```bash
rediss://goldenmunch-MKA164UW:YOUR_PASSWORD_HERE@redis-12362.crce178.ap-east-1-1.ec2.cloud.redislabs.com:12362
```

**Note:** Use `rediss://` (with double 's') for TLS/SSL connection, which Redis Cloud requires.

**Example:**
```bash
rediss://goldenmunch-MKA164UW:MySecurePass123@redis-12362.crce178.ap-east-1-1.ec2.cloud.redislabs.com:12362
```

---

## 🌐 Step 2: Deploy Backend to Render

### 2.1 Create Web Service

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click **New** → **Web Service**
3. Connect your GitHub repository
4. Configure the service:

```yaml
Name: goldenmunch-pos-backend
Environment: Node
Region: Choose closest to your users (Singapore for Asia)
Branch: main (or your deployment branch)
Root Directory: server
Build Command: npm install && npm run build
Start Command: npm start
```

### 2.2 Environment Variables on Render

Go to **Environment** tab and add these variables:

#### Application Settings
```bash
NODE_ENV=production
PORT=5000
```

#### Database Configuration (MySQL/Aiven)
```bash
DB_HOST=your-mysql-host.aivencloud.com
DB_PORT=3306
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=GoldenMunchPOS
DB_SSL=true
```

#### Redis Configuration (RECOMMENDED: Use REDIS_URL)
```bash
REDIS_ENABLED=true
REDIS_URL=rediss://goldenmunch-MKA164UW:YOUR_PASSWORD@redis-12362.crce178.ap-east-1-1.ec2.cloud.redislabs.com:12362
```

**Alternative: Individual Parameters**
```bash
REDIS_ENABLED=true
REDIS_HOST=redis-12362.crce178.ap-east-1-1.ec2.cloud.redislabs.com
REDIS_PORT=12362
REDIS_USERNAME=goldenmunch-MKA164UW
REDIS_PASSWORD=your_password_here
REDIS_TLS=true
REDIS_DB=0
REDIS_DEFAULT_TTL=300
```

#### JWT Secrets (Generate secure random strings)
```bash
# Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET=your_generated_secret_here
ADMIN_JWT_SECRET=your_generated_admin_secret_here
CASHIER_JWT_SECRET=your_generated_cashier_secret_here
ADMIN_JWT_EXPIRES_IN=8h
CASHIER_JWT_EXPIRES_IN=12h
```

#### CORS Configuration
```bash
CORS_ORIGIN=https://your-frontend-url.onrender.com,https://your-kiosk-url.onrender.com
```

#### URLs
```bash
MOBILE_EDITOR_URL=https://your-backend-url.onrender.com
BACKEND_URL=https://your-backend-url.onrender.com
```

#### Supabase Configuration
```bash
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_KEY=your_supabase_service_role_key
```

#### Email Configuration (Gmail example)
```bash
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_gmail_app_password
EMAIL_FROM_NAME=GoldenMunch POS
ADMIN_EMAIL=admin@goldenmunch.com
BUSINESS_PHONE=+1234567890
BUSINESS_ADDRESS=123 Main Street, City, Country
```

#### Logging
```bash
LOG_LEVEL=info
```

---

## 💻 Step 3: Deploy Frontend (CashierAdmin) to Render

### 3.1 Create Static Site or Web Service

**Option A: Static Site (Faster, cheaper)**
```yaml
Name: goldenmunch-cashieradmin
Build Command: npm install && npm run build
Publish Directory: .next
Root Directory: client/cashieradmin
```

**Option B: Web Service (with SSR)**
```yaml
Name: goldenmunch-cashieradmin
Environment: Node
Build Command: npm install && npm run build
Start Command: npm start
Root Directory: client/cashieradmin
```

### 3.2 Frontend Environment Variables
```bash
NEXT_PUBLIC_API_URL=https://your-backend-url.onrender.com
```

---

## 🖥️ Step 4: Deploy Kiosk Frontend

Similar to CashierAdmin:

```yaml
Name: goldenmunch-kiosk
Build Command: npm install && npm run build
Start Command: npm start
Root Directory: client/Kiosk_Web
```

**Environment Variables:**
```bash
NEXT_PUBLIC_API_URL=https://your-backend-url.onrender.com
```

---

## 🗄️ Step 5: Database Setup

### 5.1 Run Database Migration

After deploying the backend, you need to run the messaging migration:

**Option 1: Using Render Shell**
1. Go to your backend service on Render
2. Click **Shell** tab
3. Run:
```bash
mysql -h YOUR_DB_HOST -P 3306 -u YOUR_DB_USER -p YOUR_DB_NAME < server/migrations/add_messaging_support.sql
```

**Option 2: Using Local MySQL Client**
```bash
mysql -h your-mysql-host.aivencloud.com -P 3306 -u your_user -p your_database < server/migrations/add_messaging_support.sql
```

**Option 3: Using MySQL Workbench/DBeaver**
1. Connect to your cloud database
2. Open and execute `server/migrations/add_messaging_support.sql`

---

## ✅ Step 6: Verify Redis Connection

### Test Redis Locally First
Create a test file `test-redis.js`:

```javascript
const { createClient } = require('redis');

async function testRedis() {
  const client = createClient({
    url: 'rediss://goldenmunch-MKA164UW:YOUR_PASSWORD@redis-12362.crce178.ap-east-1-1.ec2.cloud.redislabs.com:12362'
  });

  client.on('error', (err) => console.error('Redis Error:', err));

  try {
    await client.connect();
    console.log('✅ Connected to Redis!');

    await client.set('test', 'Hello Redis!');
    const value = await client.get('test');
    console.log('✅ Test value:', value);

    await client.quit();
    console.log('✅ Connection closed successfully');
  } catch (error) {
    console.error('❌ Redis connection failed:', error);
  }
}

testRedis();
```

Run: `node test-redis.js`

### Check Render Logs
After deployment, check your backend logs on Render for:
```
✅ Redis connection established
```

If you see errors, check:
- ✅ Redis password is correct
- ✅ Using `rediss://` (with TLS)
- ✅ Username is included in URL
- ✅ Redis Cloud firewall allows Render IPs

---

## 🔍 Step 7: System Health Check

After deployment, test these endpoints:

### Backend Health
```bash
GET https://your-backend-url.onrender.com/api/health
```

### Redis Stats
```bash
GET https://your-backend-url.onrender.com/api/admin/stats
# Should show cache hits/misses
```

### Test Messaging
1. Create a custom cake request
2. Open request details in admin panel
3. Send a test message
4. Verify SSE real-time updates work

---

## 🚨 Troubleshooting

### Redis Connection Failed
**Error:** `ECONNREFUSED` or `ETIMEDOUT`
- ✅ Verify Redis Cloud firewall settings allow external connections
- ✅ Check if using `rediss://` instead of `redis://`
- ✅ Verify password is correct (no special characters need URL encoding)

**Error:** `AUTH failed`
- ✅ Username/password incorrect
- ✅ Password needs URL encoding if it contains special characters
  - Example: `p@ss:word` → `p%40ss%3Aword`

**Error:** `WRONGPASS invalid username-password pair`
- ✅ Check username is `goldenmunch-MKA164UW`
- ✅ Get fresh password from Redis Cloud dashboard

### Database Connection Issues
- ✅ Set `DB_SSL=true` for cloud databases
- ✅ Verify firewall allows Render IPs
- ✅ Check connection limits

### Build Failures
- ✅ Ensure `package-lock.json` is committed
- ✅ Check Node.js version compatibility
- ✅ Verify all dependencies are in `package.json`

---

## 📊 Performance Optimization

### Redis Cache Configuration
Based on your traffic, adjust TTL values:

**High traffic:**
```bash
REDIS_DEFAULT_TTL=600  # 10 minutes
```

**Low traffic:**
```bash
REDIS_DEFAULT_TTL=180  # 3 minutes
```

### Render Auto-Scaling
Enable auto-scaling on Render for production:
- Min instances: 1
- Max instances: 3
- Target CPU: 70%

---

## 💰 Cost Estimation

**Free Tier (Render):**
- ✅ Static sites: Free
- ✅ Web services: 750 hours/month free
- ⚠️ Spins down after 15 min inactivity (upgrade to prevent)

**Redis Cloud:**
- ✅ Free tier: 30MB storage, adequate for caching
- 💰 Paid: $5-10/month for 250MB-1GB

**Total Monthly Cost (Minimal):**
- Development: $0 (all free tiers)
- Production: $7-25/month (depending on traffic)

---

## 🎯 Next Steps

1. ✅ Get your Redis Cloud password
2. ✅ Configure environment variables on Render
3. ✅ Deploy backend → Test Redis connection
4. ✅ Run database migration
5. ✅ Deploy frontends
6. ✅ Test messaging feature
7. ✅ Monitor logs for errors

---

## 📚 Additional Resources

- [Render Documentation](https://render.com/docs)
- [Redis Cloud Documentation](https://docs.redis.com/latest/rc/)
- [Node.js Redis Client](https://github.com/redis/node-redis)
- [GoldenMunch POS Docs](./EMAIL_AND_NOTIFICATION_ANALYSIS.md)

---

## ✉️ Support

If you encounter issues:
1. Check Render logs (Shell tab → View logs)
2. Verify all environment variables are set
3. Test Redis connection independently
4. Check database connectivity

Your system is **100% ready** for Redis integration! Just need to configure the environment variables on Render.
