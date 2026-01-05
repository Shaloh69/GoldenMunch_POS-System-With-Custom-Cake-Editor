# Raspberry Pi Implementation Guide
## Complete Setup for GoldenMunch Kiosk with Vercel Deployment

**Last Updated:** 2026-01-05
**Branch:** `claude/analyze-cake-order-flow-xtPVB`
**Kiosk URL:** `https://goldenkiosk.vercel.app/`

---

## 🎯 What This Guide Does

This guide will set up your Raspberry Pi to:
- ✅ Auto-start the GoldenMunch Kiosk on boot
- ✅ Load Kiosk_Web from Vercel (no local frontend)
- ✅ Run backend server locally for orders/payments
- ✅ Fix touch calibration for Pi 5 + ILITEK touchscreens
- ✅ Launch Chromium in fullscreen kiosk mode
- ✅ Use inline touch keyboard (no content covering)

---

## 📋 Prerequisites

- Raspberry Pi (tested on Pi 4 and Pi 5)
- Raspberry Pi OS Bookworm (with X11 or Wayland)
- ILITEK touchscreen (for touch calibration fix)
- Internet connection
- SSH access or physical access to Pi

---

## 🚀 Step-by-Step Implementation

### Step 1: SSH into Your Raspberry Pi

```bash
ssh pi@<your-pi-ip-address>
# Default password: raspberry (change this for security!)
```

### Step 2: Navigate to Project Directory

```bash
cd ~/GoldenMunch_POS-System-With-Custom-Cake-Editor
```

### Step 3: Pull Latest Changes from GitHub

```bash
# Fetch latest changes
git fetch origin

# Switch to the feature branch
git checkout claude/analyze-cake-order-flow-xtPVB

# Pull latest code
git pull origin claude/analyze-cake-order-flow-xtPVB
```

**Expected Output:**
```
Switched to branch 'claude/analyze-cake-order-flow-xtPVB'
Updating 6e652e4..97c021b
Fast-forward
 KIOSK_VERCEL_SETUP_VERIFICATION.md | 188 ++++++++
 config/99-touchscreen-calibration.conf | 75 ++++
 setup-kiosk-autostart.sh | 6 +-
 ...
```

### Step 4: Install Touch Calibration (Pi 5 + ILITEK ONLY)

**Skip this step if you don't have a Pi 5 with ILITEK touchscreen**

```bash
# Create X11 config directory if it doesn't exist
sudo mkdir -p /etc/X11/xorg.conf.d

# Copy touch calibration config
sudo cp config/99-touchscreen-calibration.conf /etc/X11/xorg.conf.d/

# Verify it's installed
ls -la /etc/X11/xorg.conf.d/99-touchscreen-calibration.conf
```

**Expected Output:**
```
-rw-r--r-- 1 root root 3024 Jan 05 12:00 /etc/X11/xorg.conf.d/99-touchscreen-calibration.conf
```

**Important:** Remove any old xinput touch calibration from `~/.xprofile` or startup scripts:
```bash
# Check if you have old xinput commands
grep -r "xinput" ~/.xprofile ~/.config

# If found, edit and remove xinput lines (keep only xrandr):
nano ~/.xprofile

# Keep ONLY this for screen rotation:
# xrandr --output HDMI-1 --rotate right
# Remove all: xinput set-prop ... or xinput map-to-output ...
```

### Step 5: Install Backend Server Dependencies

```bash
# Navigate to server directory
cd ~/GoldenMunch_POS-System-With-Custom-Cake-Editor/server

# Install dependencies (if not already installed)
npm install

# Verify .env.production exists
ls -la .env.production

# Go back to project root
cd ~/GoldenMunch_POS-System-With-Custom-Cake-Editor
```

### Step 6: Run Kiosk Autostart Setup Script

```bash
# Make sure you're in the project root
cd ~/GoldenMunch_POS-System-With-Custom-Cake-Editor

# Make setup script executable
chmod +x setup-kiosk-autostart.sh

# Run the setup script (DO NOT use sudo)
./setup-kiosk-autostart.sh
```

**What this script does:**
1. ✅ Installs chromium-browser, wlopm, unclutter
2. ✅ Creates `~/start-kiosk.sh` startup script
3. ✅ Configures Labwc autostart (`~/.config/labwc/autostart`)
4. ✅ Creates systemd user service
5. ✅ Creates helper scripts (stop, restart, view-logs)
6. ✅ Checks npm dependencies

**Expected Output:**
```
╔════════════════════════════════════════════════════════╗
║   GoldenMunch POS Kiosk Autostart Setup Script       ║
║   For Raspberry Pi with Wayland/Labwc                 ║
╚════════════════════════════════════════════════════════╝

[✓] Project directory found
[✓] chromium-browser is already installed
...
[✓] Setup completed successfully!
```

**When prompted:** Type `n` (no) to skip testing now - we'll test after configuring auto-login.

### Step 7: Configure Auto-Login

**IMPORTANT:** The kiosk needs to auto-login on boot.

```bash
sudo raspi-config
```

**Navigate in raspi-config:**
1. Select **"1 System Options"**
2. Select **"S5 Boot / Auto Login"**
3. Select **"B4 Desktop Autologin"**
4. Press **"OK"**
5. Select **"Finish"**
6. When asked to reboot, select **"No"** (we'll reboot manually)

### Step 8: Verify Configuration Files

```bash
# Check startup script exists
ls -la ~/start-kiosk.sh

# Check Labwc autostart
cat ~/.config/labwc/autostart

# Should show:
# wlopm --on '*' &
# /home/pi/start-kiosk.sh &

# Check systemd service
systemctl --user status goldenmunch-kiosk
```

### Step 9: Test the Kiosk (Optional - Before Reboot)

```bash
# Test manually before reboot
~/start-kiosk.sh
```

**What should happen:**
- Backend server starts (wait 8 seconds)
- Chromium opens in fullscreen
- Kiosk_Web loads from https://goldenkiosk.vercel.app/
- Touch should work (if calibration installed)

**To stop the test:**
```bash
~/stop-kiosk.sh
```

### Step 10: Reboot and Enable Autostart

```bash
sudo reboot
```

**What should happen after reboot:**
1. Pi boots to desktop
2. Auto-login as pi user (if configured)
3. Labwc/LXDE starts
4. Backend server starts automatically
5. Chromium launches in kiosk mode
6. Kiosk_Web loads from Vercel

**Wait:** Give it 20-30 seconds for everything to start.

---

## 🔍 Verification & Troubleshooting

### Check if Kiosk is Running

```bash
# SSH into Pi (from another computer)
ssh pi@<your-pi-ip>

# Check if processes are running
ps aux | grep chromium
ps aux | grep node

# Check logs
tail -50 ~/kiosk-startup.log
tail -50 ~/server-output.log
tail -50 ~/chromium-output.log
```

### View Logs

```bash
# Use the log viewer script
~/view-kiosk-logs.sh

# Or view individual logs
tail -f ~/kiosk-startup.log      # Main startup log
tail -f ~/server-output.log      # Backend server log
tail -f ~/chromium-output.log    # Chromium browser log
```

### Common Issues & Solutions

#### Issue: Chromium Shows Blank Screen

**Check:**
```bash
# Test if Vercel URL is accessible
curl -I https://goldenkiosk.vercel.app/

# Should return: HTTP/2 200
```

**If 401 or 403:** Update Vercel deployment settings to allow public access

**If Network Error:** Check Pi internet connection
```bash
ping -c 3 goldenkiosk.vercel.app
```

#### Issue: Backend Server Not Starting

**Check:**
```bash
# View server logs
tail -100 ~/server-output.log

# Check if server dependencies installed
cd ~/GoldenMunch_POS-System-With-Custom-Cake-Editor/server
ls node_modules/

# If empty, install:
npm install
```

#### Issue: Touch Calibration Not Working (Pi 5)

**Check if libinput config is loaded:**
```bash
# View X11 log for ILITEK
grep -i "ilitek" /var/log/Xorg.0.log

# Should see: "Applying CalibrationMatrix"
```

**If not found:**
```bash
# Reinstall touch config
sudo cp ~/GoldenMunch_POS-System-With-Custom-Cake-Editor/config/99-touchscreen-calibration.conf /etc/X11/xorg.conf.d/
sudo reboot
```

#### Issue: Kiosk Doesn't Auto-Start on Boot

**Check auto-login:**
```bash
# Verify auto-login is enabled
cat /etc/lightdm/lightdm.conf | grep autologin
```

**Check Labwc autostart:**
```bash
cat ~/.config/labwc/autostart

# Should contain:
# /home/pi/start-kiosk.sh &
```

**Check systemd service:**
```bash
systemctl --user status goldenmunch-kiosk

# If not enabled:
systemctl --user enable goldenmunch-kiosk
systemctl --user start goldenmunch-kiosk
```

#### Issue: Keyboard Covers Content

**This should be fixed** - keyboard now uses inline mode.

If still overlaying:
```bash
# Check git branch
cd ~/GoldenMunch_POS-System-With-Custom-Cake-Editor
git branch

# Should be on: claude/analyze-cake-order-flow-xtPVB
# If not:
git checkout claude/analyze-cake-order-flow-xtPVB
git pull origin claude/analyze-cake-order-flow-xtPVB
```

---

## 🛠️ Helper Commands

### Manage Kiosk

```bash
# Start kiosk manually
~/start-kiosk.sh

# Stop kiosk
~/stop-kiosk.sh

# Restart kiosk
~/restart-kiosk.sh

# View all logs
~/view-kiosk-logs.sh
```

### Systemd Service Management

```bash
# Check service status
systemctl --user status goldenmunch-kiosk

# Start service
systemctl --user start goldenmunch-kiosk

# Stop service
systemctl --user stop goldenmunch-kiosk

# Restart service
systemctl --user restart goldenmunch-kiosk

# Enable autostart
systemctl --user enable goldenmunch-kiosk

# Disable autostart
systemctl --user disable goldenmunch-kiosk

# View service logs
journalctl --user -u goldenmunch-kiosk -f
```

### Update Kiosk Code

```bash
# Pull latest changes
cd ~/GoldenMunch_POS-System-With-Custom-Cake-Editor
git pull origin claude/analyze-cake-order-flow-xtPVB

# Restart kiosk to apply changes
~/restart-kiosk.sh
```

---

## 📊 What's Running on Your Pi

### Backend Server (Local)
- **Location:** `~/GoldenMunch_POS-System-With-Custom-Cake-Editor/server`
- **Port:** 5000 (default)
- **Purpose:** Handles orders, payments, database
- **Log:** `~/server-output.log`

### Frontend (Vercel - Hosted)
- **URL:** https://goldenkiosk.vercel.app/
- **Hosted on:** Vercel CDN
- **Purpose:** Kiosk user interface
- **Updates:** Automatic (no rebuild needed)

### Chromium Browser
- **Mode:** Fullscreen kiosk
- **Platform:** Wayland (Pi OS Bookworm)
- **Log:** `~/chromium-output.log`

---

## 🎯 Expected Behavior

### On Boot:
1. **0-10 seconds:** Pi boots, auto-login
2. **10-18 seconds:** Backend server starts
3. **18-20 seconds:** Chromium launches
4. **20-25 seconds:** Kiosk_Web loads from Vercel
5. **25+ seconds:** Fully operational kiosk

### During Operation:
- ✅ Touch keyboard appears inline (doesn't cover content)
- ✅ Orders save to local database
- ✅ Payments processed by backend server
- ✅ QR payment modal scrollable with keyboard
- ✅ Screen doesn't blank (wlopm keeps it on)
- ✅ Mouse cursor hidden (unclutter)

---

## 🔐 Security Notes

### Change Default Password
```bash
passwd
# Enter new password
```

### Backend Security
The backend server runs locally but should use environment variables:
```bash
cd ~/GoldenMunch_POS-System-With-Custom-Cake-Editor/server
nano .env.production

# Ensure secure values for:
# JWT_SECRET=<random-string>
# DATABASE_PASSWORD=<secure-password>
```

### Network Security
- Backend server is NOT exposed to internet (local only)
- Kiosk connects to Vercel via HTTPS
- Database is local (no remote access)

---

## ✅ Success Checklist

After implementation, verify:

- [ ] Pi auto-boots to kiosk
- [ ] Chromium opens in fullscreen
- [ ] Kiosk_Web loads from https://goldenkiosk.vercel.app/
- [ ] Touch screen works correctly (Pi 5 + ILITEK)
- [ ] Touch keyboard appears inline (doesn't overlay)
- [ ] Orders can be created and saved
- [ ] Backend server is running (`ps aux | grep node`)
- [ ] Logs show no errors (`~/view-kiosk-logs.sh`)
- [ ] Screen doesn't blank during use
- [ ] Kiosk auto-restarts if Chromium crashes

---

## 📞 Need Help?

### View Complete Documentation
```bash
cd ~/GoldenMunch_POS-System-With-Custom-Cake-Editor

# Kiosk setup verification
cat KIOSK_VERCEL_SETUP_VERIFICATION.md

# Touch calibration troubleshooting
cat client/Kiosk_Electron/TOUCH_CALIBRATION_TROUBLESHOOTING.md
```

### Check All Logs
```bash
~/view-kiosk-logs.sh
```

### Restart Everything
```bash
sudo reboot
```

---

**Setup Complete!** Your Raspberry Pi kiosk should now be running with:
- ✅ Vercel-hosted Kiosk_Web
- ✅ Local backend server
- ✅ Touch calibration (Pi 5)
- ✅ Inline keyboard
- ✅ Auto-start on boot

🎉 **Enjoy your GoldenMunch Kiosk!**
