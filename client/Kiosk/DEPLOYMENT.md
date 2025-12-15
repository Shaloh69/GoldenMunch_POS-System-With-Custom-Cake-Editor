# 🚀 Deployment Guide - Separated Architecture

## Architecture Overview

The kiosk application has been **completely separated** into two independent parts:

```
┌─────────────────────────────────────────────────┐
│  ELECTRON CLIENT (Kiosk Device)                │
│  ├─ Loads remote Next.js app via URL           │
│  ├─ Handles printer integration (local HW)     │
│  ├─ Settings panel (Ctrl+Shift+C)              │
│  └─ Runs in kiosk mode (fullscreen)            │
└─────────────────────────────────────────────────┘
                       │
                       │ HTTPS
                       ▼
┌─────────────────────────────────────────────────┐
│  NEXT.JS WEB APP (Render.com)                  │
│  ├─ Full UI (Menu, Cake Editor, Cart, etc.)    │
│  ├─ Runs as standalone Next.js app             │
│  ├─ SSR/Dynamic rendering enabled               │
│  └─ No Electron dependencies                    │
└─────────────────────────────────────────────────┘
                       │
                       │ API Calls
                       ▼
┌─────────────────────────────────────────────────┐
│  BACKEND API (Already on Render.com)           │
│  └─ https://goldenmunch-pos-system-server...   │
└─────────────────────────────────────────────────┘
```

---

## Part 1: Deploy Next.js App to Render.com

### Step 1: Prepare for Deployment

The Next.js app is now configured as a **standalone web application** (not a static export).

**Files modified for web deployment:**
- ✅ `next.config.mjs` - Removed `output: 'export'`
- ✅ `.env.production` - API URL points to Render backend
- ✅ `package.json` - Scripts updated for deployment

### Step 2: Create Render Web Service

1. **Go to Render Dashboard**
   - Visit: https://render.com/dashboard
   - Click "New +" → "Web Service"

2. **Connect Your Repository**
   - Connect GitHub repository: `Shaloh69/GoldenMunch_POS-System-With-Custom-Cake-Editor`
   - Or manually deploy from Git

3. **Configure Build Settings**

   ```yaml
   Name: goldenmunch-kiosk
   Environment: Node
   Region: Choose closest to your location
   Branch: main (or your deployment branch)
   Root Directory: client/Kiosk
   Build Command: npm install && npm run build
   Start Command: npm run start
   ```

4. **Environment Variables**

   Add these environment variables in Render dashboard:

   ```bash
   NODE_ENV=production
   NEXT_PUBLIC_API_URL=https://goldenmunch-pos-system-server.onrender.com/api
   NEXT_PUBLIC_API_TIMEOUT=60000
   PORT=3002
   ```

5. **Advanced Settings**

   ```yaml
   Auto-Deploy: Yes (deploys on git push)
   Health Check Path: / (optional)
   Instance Type: Free or Starter (recommended: Starter for better performance)
   ```

6. **Deploy**
   - Click "Create Web Service"
   - Wait for deployment (5-10 minutes first time)
   - Note your URL: `https://goldenmunch-kiosk.onrender.com`

---

## Part 2: Configure Electron Kiosk Client

### Step 1: Build Electron Application

On your development machine:

```bash
cd client/Kiosk

# Install dependencies (if not already done)
npm install

# Build Electron for your target platform
# Windows:
npm run electron:build:win

# Linux (Raspberry Pi):
npm run electron:build:linux

# macOS:
npm run electron:build:mac
```

**Build Output:**
- Windows: `dist/GoldenMunch Kiosk Setup.exe`
- Linux: `dist/goldenmunch-kiosk_1.0.0_amd64.deb` (or .AppImage)
- macOS: `dist/GoldenMunch Kiosk.dmg`

### Step 2: Install on Kiosk Device

**For Linux (Raspberry Pi):**
```bash
# Transfer the .deb file to Raspberry Pi
scp dist/goldenmuch-kiosk_1.0.0_amd64.deb pi@<raspberry-pi-ip>:~/

# Install on Raspberry Pi
ssh pi@<raspberry-pi-ip>
sudo dpkg -i goldenmunch-kiosk_1.0.0_amd64.deb

# Or use AppImage (no installation required)
chmod +x goldenmunch-kiosk-1.0.0.AppImage
./goldenmunch-kiosk-1.0.0.AppImage
```

**For Windows:**
```bash
# Run the installer
GoldenMunch Kiosk Setup.exe
```

### Step 3: Configure Remote URL

**First Launch:**
1. The app will show a settings panel automatically (no URL configured)
2. Or press **Ctrl+Shift+C** to open settings

**Configure URL:**
1. Enter your Render URL: `https://goldenmunch-kiosk.onrender.com`
2. Click "Test URL" to verify connection
3. Click "Save & Reload"
4. The kiosk will load the remote Next.js app

**Settings Location:**
- Windows: `C:\Users\<username>\AppData\Roaming\goldenmunch-kiosk\kiosk-config.json`
- Linux: `~/.config/goldenmunch-kiosk/kiosk-config.json`
- macOS: `~/Library/Application Support/goldenmunch-kiosk/kiosk-config.json`

---

## Development Workflows

### Scenario 1: Develop Next.js UI (Hot Reload)

```bash
# Terminal 1: Start Next.js dev server
npm run dev

# Terminal 2: Start Electron (loads localhost:3002)
npm run electron:dev
```

The Electron app will automatically load from `http://localhost:3002` in development mode.

### Scenario 2: Test Remote URL Locally

```bash
# Terminal 1: Start Next.js as production server
npm run build
npm run start

# Terminal 2: Run Electron in remote mode
npm run electron:dev:remote

# Configure URL in settings: http://localhost:3002
```

### Scenario 3: Test Production Build

```bash
# Configure Electron to load from Render
npm run electron:dev:remote

# In settings panel, enter: https://goldenmunch-kiosk.onrender.com
```

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Shift+C` | Open Settings Panel |
| `Ctrl+Shift+I` | Open DevTools (Development only) |
| `F11` | Toggle Fullscreen (Development only) |
| `ESC` | Cannot exit kiosk mode in production |

---

## Environment Variables

### For Electron (Optional)

You can set environment variables instead of using the settings panel:

**Linux/macOS:**
```bash
export KIOSK_APP_URL=https://goldenmunch-kiosk.onrender.com
export NODE_ENV=production
```

**Windows:**
```cmd
set KIOSK_APP_URL=https://goldenmunch-kiosk.onrender.com
set NODE_ENV=production
```

**Priority:**
1. Settings Panel Configuration (highest priority)
2. Environment Variable `KIOSK_APP_URL`
3. Development Default (`http://localhost:3002`)

### For Next.js on Render

Create `.env.production` (already configured):

```bash
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://goldenmunch-pos-system-server.onrender.com/api
NEXT_PUBLIC_API_TIMEOUT=60000
```

---

## Printer Configuration

**Printer functionality remains in Electron** (requires local hardware access).

**Configuration File:** `electron/printer-config.json`

```json
{
  "printerType": "usb",
  "usb": {
    "vid": "0x0416",
    "pid": "0x5011"
  },
  "network": {
    "address": "192.168.1.100",
    "port": 9100
  },
  "serial": {
    "path": "/dev/ttyUSB0",
    "baudRate": 9600
  },
  "settings": {
    "width": 48,
    "encoding": "GB18030"
  }
}
```

See `PRINTER_SETUP.md` for detailed printer configuration.

---

## Troubleshooting

### Issue: "No URL Configured" Error

**Solution:**
- Press `Ctrl+Shift+C` to open settings
- Enter your Render URL
- Click "Save & Reload"

### Issue: Cannot Connect to Remote URL

**Check:**
1. Verify Render deployment is running: Visit URL in browser
2. Check internet connection on kiosk device
3. Verify URL in settings (no trailing slash)
4. Check Render logs for errors

### Issue: Printer Not Working

**Printer only works on Electron client** (local hardware).

**Check:**
1. USB connection: `lsusb` (Linux) or Device Manager (Windows)
2. Printer config: `electron/printer-config.json`
3. IPC bridge: Check DevTools console for errors

### Issue: Settings Panel Won't Open

**Solutions:**
1. Ensure `Ctrl+Shift+C` shortcut is not blocked
2. Check Electron logs in terminal
3. Manually edit config file (see Settings Location above)

### Issue: Render App Shows 404 or 500 Error

**Check:**
1. Build logs on Render dashboard
2. Environment variables are set correctly
3. API backend is running
4. Check Render logs: Dashboard → Logs

---

## CI/CD Pipeline (Optional)

### Automatic Deployment on Git Push

**Render Configuration (already enabled):**
- Auto-deploy: Enabled
- Branch: `main`
- On push to `main` → Render rebuilds and deploys

**GitHub Actions (Optional):**

Create `.github/workflows/deploy-kiosk.yml`:

```yaml
name: Deploy Kiosk to Render

on:
  push:
    branches: [main]
    paths:
      - 'client/Kiosk/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Trigger Render Deploy
        run: |
          curl -X POST ${{ secrets.RENDER_DEPLOY_HOOK_URL }}
```

Add `RENDER_DEPLOY_HOOK_URL` to GitHub secrets.

---

## Performance Optimization

### Render.com (Next.js)

1. **Use Starter Plan** (not Free tier) for better performance
2. **Enable CDN**: Render automatically serves static assets via CDN
3. **Add Caching Headers**: Configure in `next.config.mjs`
4. **Optimize Images**: Use Next.js Image component

### Electron Client

1. **Disable GPU** (already configured for Raspberry Pi)
2. **Reduce Memory Usage**: Set NODE_OPTIONS if needed
3. **Enable HTTP Caching**: Modify `cache: false` in main.js if desired

---

## Security Considerations

### Electron Client

✅ **Enabled:**
- Context Isolation
- NodeIntegration disabled
- Preload script for safe IPC
- No remote module
- Kiosk mode (prevents user exit in production)

### Next.js on Render

✅ **Enabled:**
- HTTPS by default (Render)
- Environment variables (not committed to git)
- API calls to authenticated backend
- No sensitive data in client-side code

---

## File Structure After Separation

```
client/Kiosk/
├── electron/
│   ├── main.js ✨ MODIFIED - Loads remote URL
│   ├── preload.js (unchanged - printer IPC)
│   ├── settings-preload.js ✨ NEW - Settings IPC
│   ├── settings-manager.js ✨ NEW - URL configuration
│   ├── settings.html ✨ NEW - Settings UI (Ctrl+Shift+C)
│   ├── splash.html (unchanged)
│   ├── printer.js (unchanged)
│   └── printer-config.json (unchanged)
│
├── app/ (unchanged - Next.js pages)
├── components/ (unchanged)
├── services/ (unchanged)
├── config/ (unchanged - API config)
│
├── next.config.mjs ✨ MODIFIED - Removed static export
├── package.json ✨ MODIFIED - Updated scripts
├── .env.local (development)
├── .env.production (production - for Render)
│
└── DEPLOYMENT.md ✨ NEW - This file
```

---

## Support

For issues or questions:

1. **Render Deployment**: Check Render dashboard logs
2. **Electron Client**: Check terminal/console logs
3. **API Issues**: Check backend logs on Render
4. **Printer Issues**: See `PRINTER_SETUP.md`

---

## Summary Checklist

### Next.js Deployment to Render
- [ ] Create Render Web Service
- [ ] Configure build settings (`npm install && npm run build`)
- [ ] Set start command (`npm run start`)
- [ ] Add environment variables (API URL)
- [ ] Deploy and get URL (e.g., `https://goldenmunch-kiosk.onrender.com`)

### Electron Client Setup
- [ ] Build Electron app (`npm run electron:build:linux`)
- [ ] Install on kiosk device (`.deb` or `.AppImage`)
- [ ] Launch app (auto-opens settings if not configured)
- [ ] Press `Ctrl+Shift+C` to open settings
- [ ] Enter Render URL
- [ ] Test connection and save
- [ ] Verify app loads successfully

### Printer Configuration (if needed)
- [ ] Configure `electron/printer-config.json`
- [ ] Test printer connection
- [ ] Verify IPC communication

---

**🎉 Your kiosk is now fully separated and ready for deployment!**

The Electron client is a lightweight shell that loads your Next.js app from Render, while keeping printer functionality local.
