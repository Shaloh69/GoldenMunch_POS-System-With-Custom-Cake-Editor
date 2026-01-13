# Redis Cloud Configuration for Render

## ✅ Your Redis Cloud Credentials

Your Redis instance is already configured and ready to use!

**Connection Details:**
- Host: `redis-12362.crce178.ap-east-1-1.ec2.cloud.redislabs.com`
- Port: `12362`
- Username: `default`
- Password: `h3yT3z9MvMJERLc7h5X99UseQ7FzogDX`
- TLS: **Not Required** (plain connection)

---

## 🔧 Render Environment Variables Setup

### Method 1: Individual Parameters (Recommended)

Add these environment variables in your Render dashboard:

```bash
REDIS_ENABLED=true
REDIS_HOST=redis-12362.crce178.ap-east-1-1.ec2.cloud.redislabs.com
REDIS_PORT=12362
REDIS_USERNAME=default
REDIS_PASSWORD=h3yT3z9MvMJERLc7h5X99UseQ7FzogDX
REDIS_TLS=false
REDIS_DB=0
```

### Method 2: Connection URL (Alternative)

Or use a single REDIS_URL variable:

```bash
REDIS_ENABLED=true
REDIS_URL=redis://default:h3yT3z9MvMJERLc7h5X99UseQ7FzogDX@redis-12362.crce178.ap-east-1-1.ec2.cloud.redislabs.com:12362
```

---

## 📝 How to Add Environment Variables to Render

1. Go to your Render dashboard: https://dashboard.render.com/
2. Select your **goldenmunch-api-server** service
3. Click **Environment** in the left sidebar
4. Click **Add Environment Variable**
5. Add each variable above one by one
6. Click **Save Changes**
7. Render will automatically redeploy with the new configuration

---

## 🧪 Testing Redis Connection

After deployment, check your Render logs for:

```
📦 Connecting to Redis using host/port configuration...
📦 Redis client connected
📦 Redis client ready
✅ Redis connection established
```

If you see these messages, Redis is working! 🎉

---

## ⚠️ Important Notes

1. **No TLS Required**: Your Redis Cloud instance uses a plain connection (not TLS)
2. **Already in .env.production**: These values are already in the repo, but Render env vars take precedence
3. **Render Auto-deploys**: Adding env vars triggers a new deployment automatically
4. **Non-blocking**: Even if Redis fails, your server will continue running

---

## 🔍 Troubleshooting

### If Redis still fails to connect:

1. **Check Redis Cloud Dashboard**:
   - Verify the instance is running
   - Check if there are IP restrictions
   - Confirm the password hasn't changed

2. **Check Render Logs**:
   - Look for "Redis Client Error" messages
   - Verify env vars are loaded correctly

3. **Test locally**:
   ```bash
   cd server
   npm install
   # Add Redis env vars to .env file
   npm run dev
   ```

---

## 📊 What Redis is Used For

In your GoldenMunch POS system, Redis provides:

- **Session caching** for faster authentication
- **Menu data caching** to reduce database queries
- **Order status caching** for real-time updates
- **Rate limiting** for API protection

If Redis is unavailable, the app works fine but may be slightly slower.
