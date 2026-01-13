# How to Test Redis Connection Using redis-cli

## 🔧 Install redis-cli

### macOS
```bash
brew install redis
```

### Ubuntu/Debian
```bash
sudo apt-get update
sudo apt-get install redis-tools
```

### Windows (WSL)
```bash
sudo apt-get install redis-tools
```

---

## 🧪 Test Connection to Your Redis Cloud Instance

### Method 1: Using redis-cli with connection string

```bash
redis-cli -u redis://default:h3yT3z9MvMJERLc7h5X99UseQ7FzogDX@redis-12362.crce178.ap-east-1-1.ec2.cloud.redislabs.com:12362
```

### Method 2: Using individual parameters

```bash
redis-cli \
  -h redis-12362.crce178.ap-east-1-1.ec2.cloud.redislabs.com \
  -p 12362 \
  -a h3yT3z9MvMJERLc7h5X99UseQ7FzogDX \
  --user default
```

### Method 3: Connect then authenticate

```bash
# Connect
redis-cli -h redis-12362.crce178.ap-east-1-1.ec2.cloud.redislabs.com -p 12362

# Then authenticate after connecting
AUTH default h3yT3z9MvMJERLc7h5X99UseQ7FzogDX
```

---

## ✅ Test Commands

Once connected, try these commands:

```bash
# Test basic connectivity
PING
# Expected: PONG

# Set a test value
SET test "Hello from Redis CLI"
# Expected: OK

# Get the value back
GET test
# Expected: "Hello from Redis CLI"

# Check server info
INFO server

# List all keys (be careful in production!)
KEYS *

# Delete the test key
DEL test
# Expected: (integer) 1

# Exit
EXIT
```

---

## 🐛 Troubleshooting

### If connection times out:

1. **Check firewall rules** - Redis Cloud may have IP whitelist
   - Go to your Redis Cloud dashboard
   - Check "Security" or "Access Control" settings
   - Add your IP address or allow all IPs (0.0.0.0/0)

2. **Verify credentials**
   ```bash
   # Test with wrong password to confirm auth is working
   redis-cli -h redis-12362.crce178.ap-east-1-1.ec2.cloud.redislabs.com -p 12362 -a wrongpassword
   # Should fail with: WRONGPASS invalid username-password pair
   ```

3. **Check DNS resolution**
   ```bash
   # Verify hostname resolves
   ping redis-12362.crce178.ap-east-1-1.ec2.cloud.redislabs.com

   # Or use nslookup
   nslookup redis-12362.crce178.ap-east-1-1.ec2.cloud.redislabs.com
   ```

4. **Test port connectivity**
   ```bash
   # Use telnet to test if port is open
   telnet redis-12362.crce178.ap-east-1-1.ec2.cloud.redislabs.com 12362

   # Or use nc (netcat)
   nc -zv redis-12362.crce178.ap-east-1-1.ec2.cloud.redislabs.com 12362
   ```

---

## 🔒 Redis Cloud IP Whitelist Setup

If you can't connect, you may need to whitelist IPs:

1. Go to https://app.redislabs.com/
2. Select your database
3. Click **Configuration** → **Security**
4. Under **Allowed Source IPs**, add:
   - Your local IP (for development)
   - Render's IP ranges (for production)
   - Or `0.0.0.0/0` to allow all (less secure but works)

### Render IP Ranges to Whitelist

Render uses dynamic IPs, so you'll need to whitelist these CIDR ranges:

```
# Check Render documentation for current IP ranges
# https://render.com/docs/static-outbound-ip-addresses
```

Or allow all IPs: `0.0.0.0/0` (easier but less secure)

---

## 📊 Your Redis Cloud Connection Details

```
Host:     redis-12362.crce178.ap-east-1-1.ec2.cloud.redislabs.com
Port:     12362
Username: default
Password: h3yT3z9MvMJERLc7h5X99UseQ7FzogDX
TLS:      No (plain connection)
```

---

## 🚀 Quick Test Script (Node.js)

Save this as `test-redis.js`:

```javascript
import { createClient } from 'redis';

const client = createClient({
    username: 'default',
    password: 'h3yT3z9MvMJERLc7h5X99UseQ7FzogDX',
    socket: {
        host: 'redis-12362.crce178.ap-east-1-1.ec2.cloud.redislabs.com',
        port: 12362
    }
});

client.on('error', err => console.log('❌ Redis Client Error', err));

console.log('🔌 Connecting to Redis...');
await client.connect();
console.log('✅ Connected!');

await client.set('test', 'Hello Redis');
const result = await client.get('test');
console.log('📦 GET test:', result);

await client.disconnect();
console.log('👋 Disconnected');
```

Run it:
```bash
node test-redis.js
```

Expected output:
```
🔌 Connecting to Redis...
✅ Connected!
📦 GET test: Hello Redis
👋 Disconnected
```
