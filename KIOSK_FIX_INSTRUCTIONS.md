# GoldenMunch Kiosk - Fix Instructions

This document provides step-by-step instructions to fix the kiosk issues identified in `KIOSK_ISSUES_ANALYSIS.md`.

---

## ⚠️ CRITICAL: Install Dependencies First!

**The #1 issue** causing your errors is **missing node_modules**. You MUST install dependencies before anything else will work.

---

## Quick Fix (Get it Running Now)

Follow these steps in order on your Raspberry Pi:

### Step 1: Install Dependencies (CRITICAL!)

**Option A: Use the Emergency Fix Script** (Recommended)

```bash
cd ~/GoldenMunch_POS-System-With-Custom-Cake-Editor
bash scripts/emergency-fix-kiosk.sh
```

This script will:
- Clean any old installations
- Clear npm cache
- Install all dependencies with extended timeouts
- Verify critical packages are installed

**Option B: Manual Installation**

```bash
cd ~/GoldenMunch_POS-System-With-Custom-Cake-Editor/client/Kiosk
npm install
```

**Expected**: This will install all node_modules including Next.js and Electron.

**Troubleshooting**:
- If it fails with timeout errors, try: `npm install --fetch-timeout=600000`
- If still failing, try: `npm run install:safe` (uses extended timeouts)
- Check internet connection: `ping registry.npmjs.org`

### Step 2: Install the Systemd Service

```bash
# Create systemd user directory if it doesn't exist
mkdir -p ~/.config/systemd/user

# Copy the Wayland service file
cp ~/GoldenMunch_POS-System-With-Custom-Cake-Editor/scripts/kiosk-wayland.service \
   ~/.config/systemd/user/

# Reload systemd to recognize the new service
systemctl --user daemon-reload

# Enable the service to start automatically
systemctl --user enable kiosk-wayland.service
```

### Step 3: Enable User Lingering

This allows the service to start even when you're not logged in:

```bash
sudo loginctl enable-linger $USER
```

**Verify**:
```bash
loginctl show-user $USER | grep Linger
```
Should show: `Linger=yes`

### Step 4: Make Scripts Executable

```bash
chmod +x ~/GoldenMunch_POS-System-With-Custom-Cake-Editor/scripts/*.sh
```

### Step 5: Test Run the Kiosk Manually

Before enabling the service, test that it works:

```bash
cd ~/GoldenMunch_POS-System-With-Custom-Cake-Editor/client/Kiosk
npm run electron:dev
```

**What to look for**:
- ✅ Next.js dev server starts on port 3002
- ✅ Electron window opens
- ✅ No "package not found" errors
- ✅ Fewer or no GBM/DRM errors (some may still appear but shouldn't flood console)
- ✅ Application UI loads

**If it works**, press Ctrl+C to stop and continue to Step 6.

**If it fails**, check:
1. Any error messages
2. Run diagnostics: `bash ~/GoldenMunch_POS-System-With-Custom-Cake-Editor/scripts/diagnose-kiosk.sh`
3. Check logs in `~/kiosk-startup.log`

### Step 6: Start the Service

```bash
# Start the service now
systemctl --user start kiosk-wayland.service

# Check status
systemctl --user status kiosk-wayland.service

# View live logs
journalctl --user -u kiosk-wayland.service -f
```

### Step 7: Verify Auto-Start on Reboot

```bash
# Reboot the Raspberry Pi
sudo reboot

# After reboot, check if service is running
systemctl --user status kiosk-wayland.service
```

---

## What Was Fixed

### 1. Electron Graphics Configuration (`client/Kiosk/electron/main.js`)

**Added these critical flags**:
- `--use-gl=swiftshader` - Forces pure software rendering via SwiftShader
- `--enable-unsafe-swiftshader` - Enables SwiftShader in all contexts
- `--disable-accelerated-2d-canvas` - No hardware canvas acceleration
- `--disable-accelerated-video-decode` - No hardware video decoding
- Extended `--disable-features` to include `UseSkiaRenderer`
- Added Wayland platform configuration

**Result**: Should eliminate or drastically reduce GBM/DRM errors.

### 2. Package.json Turbopack Removal (`client/Kiosk/package.json`)

**Changed**:
```json
// Before
"dev": "next dev --turbopack -p 3002"

// After
"dev": "next dev -p 3002"
```

**Result**: Uses stable webpack instead of experimental Turbopack.

### 3. Systemd Service Configuration (`scripts/kiosk-wayland.service`)

**Improvements**:
- Uses `%h` for home directory (works for any user)
- Added resource limits (MemoryLimit, CPUQuota)
- Added startup limits to prevent boot loops
- Better logging with SyslogIdentifier
- Marked old X11 service as deprecated

**Result**: Service works for any user, better resource management.

---

## Diagnostic Commands

Use these to troubleshoot issues:

### Check Service Status
```bash
systemctl --user status kiosk-wayland.service
```

### View Recent Logs
```bash
journalctl --user -u kiosk-wayland.service -n 50 --no-pager
```

### View Live Logs
```bash
journalctl --user -u kiosk-wayland.service -f
```

### Check Startup Log
```bash
tail -50 ~/kiosk-startup.log
```

### Run Diagnostics
```bash
bash ~/GoldenMunch_POS-System-With-Custom-Cake-Editor/scripts/diagnose-kiosk.sh
```

### Check Port 3002
```bash
# See if Next.js dev server is running
lsof -i :3002

# Or
netstat -tlnp | grep 3002
```

### Check Environment Variables
```bash
echo "WAYLAND_DISPLAY: $WAYLAND_DISPLAY"
echo "XDG_RUNTIME_DIR: $XDG_RUNTIME_DIR"
echo "XDG_SESSION_TYPE: $XDG_SESSION_TYPE"
echo "DESKTOP_SESSION: $DESKTOP_SESSION"
```

---

## Common Issues and Solutions

### Issue: "Next.js package not found"
**Solution**: Run `npm install` in the Kiosk directory

### Issue: Port 3002 already in use
**Solution**:
```bash
# Find what's using the port
lsof -i :3002

# Kill the process (replace PID with actual process ID)
kill -9 <PID>
```

### Issue: Service won't start after reboot
**Solution**: Enable lingering
```bash
sudo loginctl enable-linger $USER
```

### Issue: GBM/DRM errors still appearing
**Expected**: Some may still appear during initialization but should be much fewer
**If excessive**: Check Electron flags are applied correctly in main.js

### Issue: Black screen / Window opens but nothing loads
**Check**:
1. Is Next.js dev server running? `lsof -i :3002`
2. Can you access http://localhost:3002 in a browser?
3. Check browser console in Electron DevTools (if in dev mode)

---

## Production Mode (Future)

For production deployment:

1. **Build the Next.js app**:
```bash
cd ~/GoldenMunch_POS-System-With-Custom-Cake-Editor/client/Kiosk
npm run build
```

2. **Update service file**:
Change `NODE_ENV=development` to `NODE_ENV=production`

3. **Update main.js**:
Change `isDev` check to use production URL:
```javascript
const isDev = process.env.NODE_ENV !== 'production';
```

4. **Restart service**:
```bash
systemctl --user restart kiosk-wayland.service
```

**Benefits**:
- Faster startup
- Better performance
- No live-reload overhead
- More stable

---

## Reverting Changes

If you need to revert to the previous configuration:

```bash
cd ~/GoldenMunch_POS-System-With-Custom-Cake-Editor
git diff HEAD
git checkout HEAD -- client/Kiosk/electron/main.js
git checkout HEAD -- client/Kiosk/package.json
git checkout HEAD -- scripts/kiosk-wayland.service
```

---

## Getting Help

If issues persist:

1. **Run diagnostics**: `bash ~/GoldenMunch_POS-System-With-Custom-Cake-Editor/scripts/diagnose-kiosk.sh`
2. **Collect logs**:
   ```bash
   journalctl --user -u kiosk-wayland.service -n 100 > kiosk-error.log
   cat ~/kiosk-startup.log >> kiosk-error.log
   ```
3. **Check system info**:
   ```bash
   uname -a
   cat /etc/os-release
   node --version
   npm --version
   ```

---

## Next Steps After Fix

Once the kiosk is running:

- [ ] Test all POS functionality
- [ ] Test printer integration
- [ ] Verify touch screen input
- [ ] Test automatic restart on crash
- [ ] Test reboot behavior
- [ ] Configure production mode
- [ ] Set up remote monitoring
- [ ] Create backup/restore procedure
