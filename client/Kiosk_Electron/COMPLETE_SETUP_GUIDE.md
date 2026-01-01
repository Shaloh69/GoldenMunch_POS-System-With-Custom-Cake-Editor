# 🚀 GoldenMunch Kiosk - Complete Setup Guide
## Raspberry Pi 5 - From Zero to Production

**Your Setup:**
- Raspberry Pi 5 Model B (aarch64)
- Debian 13 (trixie)
- Username: `saarasubiza`
- Production URL: `https://golden-munch-pos.vercel.app`

---

# 📑 Table of Contents

1. [Initial System Setup](#1-initial-system-setup)
2. [Install Dependencies](#2-install-dependencies)
3. [Configure Kiosk URL](#3-configure-kiosk-url)
4. [Test Kiosk Manually](#4-test-kiosk-manually)
5. [Setup Autostart](#5-setup-autostart)
6. [Configure Portrait Mode](#6-configure-portrait-mode)
7. [Fix Touch Functionality](#7-fix-touch-functionality)
8. [Final Verification](#8-final-verification)

---

## ✅ URL Configuration Verification

### How Kiosk_Electron Loads URLs (Priority Order):

```
1. Config File: ~/.config/goldenmunch-kiosk-electron/kiosk-config.json
2. Environment Variable: $KIOSK_APP_URL
3. Development: http://localhost:3002 (dev mode only)
4. None: Opens settings panel automatically
```

**Your Production URL:** `https://golden-munch-pos.vercel.app`

---

# 1. Initial System Setup

## Step 1.1: Update System

```bash
# Update package lists
sudo apt update

# Upgrade all packages
sudo apt upgrade -y

# Reboot if kernel was updated
sudo reboot
```

## Step 1.2: Install Node.js 20 LTS

```bash
# Download and install Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version
# Expected: v20.x.x

npm --version
# Expected: 10.x.x or higher
```

**Why Node 20?**
- Better arm64 (aarch64) optimization
- Improved Raspberry Pi 5 performance
- Latest Electron compatibility

## Step 1.3: Clone Project

```bash
# Navigate to home directory
cd ~

# Clone the repository
git clone https://github.com/Shaloh69/GoldenMunch_POS-System-With-Custom-Cake-Editor.git

# Navigate to kiosk directory
cd ~/GoldenMunch_POS-System-With-Custom-Cake-Editor/client/Kiosk_Electron

# Verify you're in the right place
pwd
# Should show: /home/saarasubiza/GoldenMunch_POS-System-With-Custom-Cake-Editor/client/Kiosk_Electron
```

---

# 2. Install Dependencies

## Step 2.1: Install System Dependencies

```bash
# Install Electron dependencies
sudo apt install -y \
    libgtk-3-0 \
    libnotify4 \
    libnss3 \
    libxss1 \
    libxtst6 \
    xdg-utils \
    libatspi2.0-0 \
    libdrm2 \
    libgbm1 \
    libasound2 \
    libxrandr2 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxcursor1 \
    libxi6

# Install X11 utilities
sudo apt install -y \
    xserver-xorg \
    x11-xserver-utils \
    unclutter-xfixes \
    xinit

# Install build tools
sudo apt install -y \
    build-essential \
    python3 \
    git

# Optional: USB printer support
sudo apt install -y libusb-1.0-0-dev
```

## Step 2.2: Ensure X11 is Running

**CRITICAL: Raspberry Pi 5 on Debian 13 may use Wayland by default. Electron requires X11.**

### Check Current Display Server:

```bash
echo $XDG_SESSION_TYPE
```

**Expected:** `x11`
**If shows:** `wayland` → Follow steps below

### Force X11 (if needed):

```bash
# Check which display manager you're using
sudo systemctl status gdm3 2>/dev/null && echo "Using GDM3" || echo "Not GDM3"
sudo systemctl status lightdm 2>/dev/null && echo "Using LightDM" || echo "Not LightDM"

# For GDM3:
sudo nano /etc/gdm3/custom.conf
# Uncomment this line under [daemon]:
# WaylandEnable=false

# For LightDM:
sudo nano /etc/lightdm/lightdm.conf
# Add under [Seat:*]:
[Seat:*]
user-session=lightdm-xsession
xserver-command=X -s 0 -dpms

# Save and reboot
sudo reboot

# After reboot, verify:
echo $XDG_SESSION_TYPE
# Should now show: x11
```

## Step 2.3: Install Kiosk Dependencies

```bash
# Navigate to Kiosk_Electron
cd ~/GoldenMunch_POS-System-With-Custom-Cake-Editor/client/Kiosk_Electron

# Install npm packages
npm install

# This will:
# - Install Electron (arm64 build)
# - Install printer libraries
# - Build native modules for aarch64
# Takes 5-10 minutes on first run
```

**Wait for installation to complete...**

---

# 3. Configure Kiosk URL

## URL Priority (Settings Manager):

```
1. Config file: ~/.config/goldenmunch-kiosk-electron/kiosk-config.json
2. Environment variable: $KIOSK_APP_URL
3. Development default: http://localhost:3002 (dev mode only)
4. No URL: Opens settings panel
```

## Method A: Environment Variable (Recommended for Production)

```bash
# Add to .bashrc
echo 'export KIOSK_APP_URL="https://golden-munch-pos.vercel.app"' >> ~/.bashrc

# Reload shell
source ~/.bashrc

# Verify
echo $KIOSK_APP_URL
# Should show: https://golden-munch-pos.vercel.app
```

## Method B: Config File (Alternative)

```bash
# Create config directory
mkdir -p ~/.config/goldenmunch-kiosk-electron

# Create config file
cat > ~/.config/goldenmunch-kiosk-electron/kiosk-config.json << 'EOF'
{
  "appUrl": "https://golden-munch-pos.vercel.app",
  "lastUpdated": "2025-01-15T10:00:00.000Z"
}
EOF

# Verify
cat ~/.config/goldenmunch-kiosk-electron/kiosk-config.json
```

## Method C: Using Settings Panel (After First Start)

```bash
# Start kiosk
npm start

# Press Ctrl+Shift+C to open settings panel
# Enter URL: https://golden-munch-pos.vercel.app
# Click "Save & Reload"
```

**Choose ONE method above. Method A (Environment Variable) is recommended.**

---

# 4. Test Kiosk Manually

## Step 4.1: First Test Run

**IMPORTANT: Always test manually before setting up autostart!**

```bash
cd ~/GoldenMunch_POS-System-With-Custom-Cake-Editor/client/Kiosk_Electron

# Start kiosk
npm start
```

## Step 4.2: What to Check

**✅ Expected Behavior:**
- Kiosk opens in fullscreen (kiosk mode)
- Shows black screen briefly while loading
- Loads `https://golden-munch-pos.vercel.app`
- Web app displays correctly
- Touchscreen responds (if applicable)

**Console Output Should Show:**
```
Global shortcuts registered:
  Ctrl+Shift+C - Open Settings
  Alt+F4 - Exit Kiosk
  Ctrl+Q - Exit Kiosk
Using configured URL: https://golden-munch-pos.vercel.app
OR
Using environment variable URL: https://golden-munch-pos.vercel.app
```

## Step 4.3: Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Shift+C` | Open Settings Panel |
| `Alt+F4` | Exit Kiosk |
| `Ctrl+Q` | Exit Kiosk |

## Step 4.4: Verify URL Loaded Correctly

Press `Ctrl+Shift+C` to open settings panel and verify URL shows:
```
https://golden-munch-pos.vercel.app
```

## Step 4.5: Exit and Check Logs

```bash
# Press Alt+F4 to exit

# Check if any errors occurred
cd ~/GoldenMunch_POS-System-With-Custom-Cake-Editor/client/Kiosk_Electron
# Look at npm output for errors

# If all good, proceed to autostart setup
```

---

# 5. Setup Autostart

## Step 5.1: Run Autostart Installer

```bash
cd ~/GoldenMunch_POS-System-With-Custom-Cake-Editor/client/Kiosk_Electron

# Make installer executable
chmod +x scripts/install-autostart.sh

# Run installer (will auto-detect username: saarasubiza)
./scripts/install-autostart.sh
```

**Installer will:**
1. ✅ Make startup script executable
2. ✅ Update service file with your username (`saarasubiza`)
3. ✅ Install systemd service to `/etc/systemd/system/`
4. ✅ Enable service (start on boot)
5. ✅ Create log directories
6. ✅ Ask if you want to start now

**When prompted:** Say **'y'** to start kiosk now.

## Step 5.2: Verify Service is Running

```bash
# Check status
sudo systemctl status goldenmunch-kiosk.service

# Should show:
# ● goldenmunch-kiosk.service - GoldenMunch Kiosk Electron Application
#    Loaded: loaded (/etc/systemd/system/goldenmunch-kiosk.service; enabled)
#    Active: active (running)
```

## Step 5.3: View Live Logs

```bash
# View systemd logs (live)
journalctl -u goldenmunch-kiosk.service -f

# Press Ctrl+C to exit log view

# View application logs
tail -f ~/.goldenmunch-logs/kiosk.log

# View startup logs
tail -f ~/.goldenmunch-logs/startup.log
```

## Step 5.4: Service Management Commands

```bash
# Start kiosk
sudo systemctl start goldenmunch-kiosk.service

# Stop kiosk
sudo systemctl stop goldenmunch-kiosk.service

# Restart kiosk
sudo systemctl restart goldenmunch-kiosk.service

# Check status
sudo systemctl status goldenmunch-kiosk.service

# Disable autostart (if needed)
sudo systemctl disable goldenmunch-kiosk.service

# Re-enable autostart
sudo systemctl enable goldenmunch-kiosk.service
```

## Step 5.5: Configure Auto-Login (Recommended)

**This makes the Pi automatically login and start the kiosk on boot.**

```bash
# Use raspi-config
sudo raspi-config

# Navigate to:
# System Options > Boot / Auto Login > Desktop Autologin

# Select "Desktop Autologin"
# Exit and reboot
sudo reboot
```

## Step 5.6: Disable Screen Blanking

```bash
# Edit lightdm config
sudo nano /etc/lightdm/lightdm.conf

# Find [Seat:*] section and add:
[Seat:*]
xserver-command=X -s 0 -dpms

# Save: Ctrl+O, Enter
# Exit: Ctrl+X

# Reboot to apply
sudo reboot
```

---

# 6. Configure Portrait Mode

**For vertical/portrait orientation displays**

## Step 6.1: Check Current Display

```bash
# Get display info
xrandr

# Example output:
# HDMI-1 connected 1080x1920+0+0 (normal left inverted right x axis y axis) ...
```

## Step 6.2: Rotate Display (Raspberry Pi 5)

### Method A: Using config.txt (Preferred)

```bash
# Edit boot config
sudo nano /boot/firmware/config.txt

# Add one of these lines at the end:
display_rotate=0  # Normal (landscape - 0°)
display_rotate=1  # 90° clockwise (portrait)
display_rotate=2  # 180° (upside down)
display_rotate=3  # 270° clockwise (90° counter-clockwise)

# For portrait mode, use:
display_rotate=1

# Save: Ctrl+O, Enter
# Exit: Ctrl+X

# Reboot to apply
sudo reboot
```

### Method B: Using xrandr (Session-based)

```bash
# Rotate 90° clockwise (portrait)
xrandr --output HDMI-1 --rotate right

# Rotate 90° counter-clockwise
xrandr --output HDMI-1 --rotate left

# Rotate 180°
xrandr --output HDMI-1 --rotate inverted

# Normal (landscape)
xrandr --output HDMI-1 --rotate normal
```

**Note:** Replace `HDMI-1` with your actual display name from `xrandr` output.

### Method C: Add to Startup Script (Persistent via xrandr)

```bash
# Edit startup script
nano ~/GoldenMunch_POS-System-With-Custom-Cake-Editor/client/Kiosk_Electron/scripts/start-kiosk.sh

# Find the line after "xset -dpms" (around line 91)
# Add this line:

xrandr --output HDMI-1 --rotate right  # For portrait mode

# Save and restart kiosk
sudo systemctl restart goldenmunch-kiosk.service
```

## Step 6.3: Verify Rotation

```bash
# Check rotation
xrandr | grep -A 1 "connected"

# Should show rotated resolution
# Portrait: 1080x1920 instead of 1920x1080
```

---

# 7. Fix Touch Functionality

## Step 7.1: Check Touchscreen Detection

```bash
# List input devices
xinput list

# Look for touchscreen in output
# Example: "FT5406 memory based driver"
# Note the ID number
```

## Step 7.2: Install Touchscreen Drivers

### For Official Raspberry Pi Touchscreen:

```bash
# Install evdev driver
sudo apt install -y xserver-xorg-input-evdev

# Reboot
sudo reboot
```

### For USB Touchscreens:

```bash
# Install additional drivers
sudo apt install -y \
    xserver-xorg-input-libinput \
    xserver-xorg-input-evdev

# Reboot
sudo reboot
```

## Step 7.3: Calibrate Touchscreen

```bash
# Install calibration tool
sudo apt install -y xinput-calibrator

# Run calibration
xinput_calibrator

# Follow on-screen instructions
# Tap the crosshairs in each corner
```

### Save Calibration:

After calibration, you'll see output like:

```
Section "InputClass"
    Identifier "calibration"
    MatchProduct "ADS7846 Touchscreen"
    Option "Calibration" "3932 300 294 3801"
    Option "SwapAxes" "1"
EndSection
```

**Save it:**

```bash
# Create config file
sudo nano /etc/X11/xorg.conf.d/99-calibration.conf

# Paste the calibration output
# Save: Ctrl+O, Enter
# Exit: Ctrl+X

# Reboot
sudo reboot
```

## Step 7.4: Fix Touch Rotation for Portrait Mode

**If touch is rotated incorrectly after display rotation:**

```bash
# Find touchscreen device ID
xinput list
# Note the ID (e.g., ID=6)

# Map touchscreen to rotated display
xinput map-to-output <ID> HDMI-1

# Example:
xinput map-to-output 6 HDMI-1

# Make permanent by adding to startup script
nano ~/GoldenMunch_POS-System-With-Custom-Cake-Editor/client/Kiosk_Electron/scripts/start-kiosk.sh

# Add after xrandr rotation line:
xinput map-to-output 6 HDMI-1

# Save and restart
sudo systemctl restart goldenmunch-kiosk.service
```

## Step 7.5: Verify Touch is Working

```bash
# Test touch in kiosk
sudo systemctl restart goldenmunch-kiosk.service

# Touch the screen
# Should interact with web app correctly
# Touch position should match visual position
```

## Step 7.6: Advanced Touch Configuration

### Invert Touch Axes (if needed):

```bash
# Find device
xinput list

# Get device properties
xinput list-props <device-id>

# Invert X axis
xinput set-prop <device-id> "Coordinate Transformation Matrix" -1 0 1 0 1 0 0 0 1

# Invert Y axis
xinput set-prop <device-id> "Coordinate Transformation Matrix" 1 0 0 0 -1 1 0 0 1

# Swap X and Y
xinput set-prop <device-id> "Coordinate Transformation Matrix" 0 1 0 1 0 0 0 0 1
```

---

# 8. Final Verification

## Step 8.1: Complete Reboot Test

```bash
# Reboot to test everything
sudo reboot
```

**What should happen:**
1. ✅ Raspberry Pi boots
2. ✅ Auto-login as `saarasubiza`
3. ✅ X11 starts
4. ✅ Kiosk service starts automatically
5. ✅ Display rotates to portrait (if configured)
6. ✅ Kiosk loads in fullscreen
7. ✅ URL loads: `https://golden-munch-pos.vercel.app`
8. ✅ Touchscreen works correctly
9. ✅ No screen blanking

## Step 8.2: Check All Logs

```bash
# Check service status
sudo systemctl status goldenmunch-kiosk.service

# Check startup log
tail -50 ~/.goldenmunch-logs/startup.log

# Check kiosk log
tail -50 ~/.goldenmunch-logs/kiosk.log

# Check for errors
journalctl -u goldenmunch-kiosk.service -n 100 --no-pager | grep -i error
```

## Step 8.3: Monitor System Resources

```bash
# Check temperature
vcgencmd measure_temp
# Should be under 70°C

# Check memory
free -h
# Should have plenty available (6+ GB free)

# Check disk space
df -h
# Should have plenty on /

# Check CPU usage
top
# Press 'q' to exit
```

## Step 8.4: Test Touch Interactions

- ✅ Tap buttons
- ✅ Swipe/scroll
- ✅ Multi-touch (if supported)
- ✅ Keyboard input (on-screen keyboard)
- ✅ All UI elements respond

## Step 8.5: Test Keyboard Shortcuts

- ✅ Press `Ctrl+Shift+C` → Settings panel opens
- ✅ Verify URL in settings
- ✅ Press `Alt+F4` → Kiosk exits (will auto-restart via systemd)

---

# 🎯 Production Deployment Checklist

Before marking as production-ready:

- [ ] System fully updated
- [ ] Node.js 20 LTS installed
- [ ] X11 confirmed running (not Wayland)
- [ ] Kiosk dependencies installed
- [ ] URL configured correctly: `https://golden-munch-pos.vercel.app`
- [ ] Manual test successful
- [ ] Autostart installed and enabled
- [ ] Auto-login enabled
- [ ] Screen blanking disabled
- [ ] Portrait mode configured (if needed)
- [ ] Touchscreen working and calibrated
- [ ] Touch rotation matches display rotation
- [ ] Keyboard shortcuts working
- [ ] Full reboot test passed
- [ ] All logs checked (no errors)
- [ ] Temperature normal (< 70°C)
- [ ] System password changed from default
- [ ] Network connection stable
- [ ] Final user acceptance test completed

---

# 📊 Quick Reference Commands

## Service Management

```bash
# Start
sudo systemctl start goldenmunch-kiosk.service

# Stop
sudo systemctl stop goldenmunch-kiosk.service

# Restart
sudo systemctl restart goldenmunch-kiosk.service

# Status
sudo systemctl status goldenmunch-kiosk.service

# Logs (live)
journalctl -u goldenmunch-kiosk.service -f
```

## Display Configuration

```bash
# Check displays
xrandr

# Rotate portrait
xrandr --output HDMI-1 --rotate right

# Rotate landscape
xrandr --output HDMI-1 --rotate normal
```

## Touch Configuration

```bash
# List inputs
xinput list

# Map touch to display
xinput map-to-output <ID> HDMI-1

# Calibrate
xinput_calibrator
```

## System Monitoring

```bash
# Temperature
vcgencmd measure_temp

# Memory
free -h

# Disk
df -h

# CPU
top
```

## Log Locations

```
~/.goldenmunch-logs/startup.log    # Startup script
~/.goldenmunch-logs/kiosk.log      # Electron app
journalctl -u goldenmunch-kiosk    # Systemd service
```

---

# 🆘 Common Issues & Solutions

## Issue: Kiosk doesn't start on boot

**Solution:**
```bash
# Check service
sudo systemctl status goldenmunch-kiosk.service

# Check logs
tail -100 ~/.goldenmunch-logs/startup.log
journalctl -u goldenmunch-kiosk.service -n 100

# Reinstall autostart
cd ~/GoldenMunch_POS-System-With-Custom-Cake-Editor/client/Kiosk_Electron
./scripts/install-autostart.sh
```

## Issue: Wrong URL loading

**Solution:**
```bash
# Check current config
cat ~/.config/goldenmunch-kiosk-electron/kiosk-config.json

# Update URL
cat > ~/.config/goldenmunch-kiosk-electron/kiosk-config.json << 'EOF'
{
  "appUrl": "https://golden-munch-pos.vercel.app",
  "lastUpdated": "2025-01-15T10:00:00.000Z"
}
EOF

# Restart
sudo systemctl restart goldenmunch-kiosk.service
```

## Issue: Display not rotating

**Solution:**
```bash
# Edit config
sudo nano /boot/firmware/config.txt

# Add for portrait:
display_rotate=1

# Save and reboot
sudo reboot
```

## Issue: Touch not working

**Solution:**
```bash
# Check detection
xinput list

# Install drivers
sudo apt install -y xserver-xorg-input-evdev xserver-xorg-input-libinput

# Reboot
sudo reboot
```

## Issue: Touch position wrong

**Solution:**
```bash
# Map to display
xinput list  # Get ID
xinput map-to-output <ID> HDMI-1

# Calibrate
sudo apt install -y xinput-calibrator
xinput_calibrator
```

## Issue: Screen blanking

**Solution:**
```bash
# Edit lightdm
sudo nano /etc/lightdm/lightdm.conf

# Add:
[Seat:*]
xserver-command=X -s 0 -dpms

# Reboot
sudo reboot
```

---

# ✅ You're Done!

Your GoldenMunch Kiosk is now fully configured and production-ready!

**What you have:**
- ✅ Raspberry Pi 5 kiosk running Electron
- ✅ Auto-start on boot
- ✅ Auto-login configured
- ✅ Portrait mode (if configured)
- ✅ Touch functionality working
- ✅ Production URL: `https://golden-munch-pos.vercel.app`
- ✅ Systemd service monitoring with auto-restart
- ✅ Comprehensive logging

**Support:**
- Logs: `~/.goldenmunch-logs/`
- Service: `sudo systemctl status goldenmunch-kiosk.service`
- Config: `~/.config/goldenmunch-kiosk-electron/kiosk-config.json`

**Enjoy your kiosk! 🎉**
