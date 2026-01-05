# Kiosk Vercel Deployment Verification

## Current Configuration

### Kiosk URL
**Production URL:** `https://goldenkiosk.vercel.app/`

### Chromium Configuration
The kiosk uses the following Chromium flags for optimal Raspberry Pi performance:

```bash
chromium-browser \
  --kiosk                                    # Full-screen kiosk mode
  --noerrdialogs                            # Suppress error dialogs
  --disable-infobars                        # Remove info bars
  --no-first-run                            # Skip first-run wizard
  --disable-session-crashed-bubble          # No crash warnings
  --disable-restore-session-state           # Don't restore sessions
  --check-for-update-interval=31536000      # Disable auto-updates
  --start-fullscreen                        # Start in fullscreen
  --disable-pinch                           # Disable pinch zoom
  --overscroll-history-navigation=0         # Disable swipe navigation
  --ozone-platform=wayland                  # Use Wayland (for Pi OS Bookworm)
  --enable-features=UseOzonePlatform        # Enable Ozone platform
  --app=https://goldenkiosk.vercel.app/
```

## ✅ Verification Checklist

### 1. Chromium Compatibility
- ✅ **--kiosk flag**: Enables fullscreen kiosk mode
- ✅ **--app flag**: Launches URL as PWA/app (not browser with tabs)
- ✅ **Wayland support**: Required for Raspberry Pi OS Bookworm
- ✅ **Touch support**: Chromium supports touch events natively
- ✅ **HTTPS support**: Vercel URLs use HTTPS (required for modern web features)

### 2. URL Format
- ✅ **No trailing slash**: `https://goldenkiosk-git-main-sars-projects-66ed9bf4.vercel.app` (correct)
- ✅ **HTTPS protocol**: Required for secure features and service workers
- ✅ **Vercel domain**: Stable and reliable hosting

### 3. Potential Issues & Solutions

#### ✅ Status: Production URL is Publicly Accessible
**Current URL:** `https://goldenkiosk.vercel.app/`
**HTTP Status:** 200 OK
**Authentication:** None required (public access)
**SSL Certificate:** Valid (HTTPS enabled)

This production deployment is ready to use with the kiosk.

### 4. Testing the Configuration

#### Test on Development Machine:
```bash
# Test if Chromium can access the URL
chromium-browser --app=https://goldenkiosk.vercel.app/
```

#### Test on Raspberry Pi:
```bash
# Run the kiosk startup script manually
cd ~
bash start-kiosk.sh

# Check logs for errors
tail -f ~/kiosk-startup.log
tail -f ~/chromium-output.log
```

#### Verify URL Accessibility:
```bash
# Test from Raspberry Pi
curl -I https://goldenkiosk.vercel.app/

# Should return HTTP 200 OK (✓ Verified working)
```

## 🔧 Configuration Files

### Main Autostart Script
- **Location:** `setup-kiosk-autostart.sh`
- **Generated Script:** `~/start-kiosk.sh`
- **Labwc Autostart:** `~/.config/labwc/autostart`

### Logs
- **Startup Log:** `~/kiosk-startup.log`
- **Server Log:** `~/server-output.log`
- **Chromium Log:** `~/chromium-output.log`

## 📝 Current Setup Process

1. **Install Dependencies:**
   - chromium-browser
   - wlopm (screen blanking control)
   - unclutter (hide cursor)

2. **Start Backend Server:**
   - Location: `~/GoldenMunch_POS-System-With-Custom-Cake-Editor/server`
   - Command: `npm start`
   - Log: `~/server-output.log`

3. **Skip Frontend (Using Vercel):**
   - No local frontend compilation
   - Faster startup
   - Always latest version from Vercel

4. **Launch Chromium:**
   - Full-screen kiosk mode
   - Wayland support for Pi OS Bookworm
   - Direct to Vercel URL

## ✅ Expected Behavior

When the Raspberry Pi boots:
1. Backend server starts (8 seconds wait)
2. Chromium launches in fullscreen kiosk mode
3. Kiosk_Web loads from Vercel
4. Touch keyboard works (inline mode)
5. Payments connect to local backend server

## 🚨 Troubleshooting

### If Chromium Shows Blank Screen:
```bash
# Check if URL is accessible (should return HTTP 200)
curl -I https://goldenkiosk.vercel.app/

# Check Chromium errors
tail -100 ~/chromium-output.log
```

### If Backend Connection Fails from Kiosk:
- Verify CORS configuration allows requests from goldenkiosk.vercel.app
- Check server/src/app.ts CORS_ORIGIN environment variable

### If Touch Not Working:
- Ensure libinput calibration is installed:
  ```bash
  sudo cp config/99-touchscreen-calibration.conf /etc/X11/xorg.conf.d/
  sudo reboot
  ```

### If Backend Connection Fails:
- Check if backend server is running:
  ```bash
  ps aux | grep node
  tail -50 ~/server-output.log
  ```

## 📊 Performance Notes

### Advantages of Vercel Deployment:
- ✅ No local build time (instant startup)
- ✅ Always latest version
- ✅ CDN-optimized delivery
- ✅ Automatic HTTPS
- ✅ Better reliability than local dev server

### Backend Still Local:
- ✅ Fast order processing (no internet latency)
- ✅ Works offline for orders
- ✅ Direct database access
- ✅ Local file storage

## 🔐 Security Considerations

1. **HTTPS Required:**
   - Vercel provides automatic HTTPS
   - Required for service workers
   - Required for modern web features

2. **Backend Authentication:**
   - Backend server should use environment variables
   - Protect API endpoints
   - Use CORS configuration

3. **Kiosk Lockdown:**
   - Chromium kiosk mode prevents navigation
   - Disable browser shortcuts
   - Auto-restart on crash

---

**Last Updated:** 2026-01-05
**Configuration File:** `setup-kiosk-autostart.sh`
**Kiosk URL:** `https://goldenkiosk.vercel.app/`
**Status:** ✅ Verified Working (HTTP 200 OK)
