# 🚀 GoldenMunch Kiosk - COMPLETE Setup Guide
## Raspberry Pi 5 - From ZERO to PRODUCTION (Password Lost Recovery)

---

## 📋 YOUR SYSTEM SPECIFICATIONS

✅ **Verified Configuration:**
- **Model:** Raspberry Pi 5 Model B Rev 1.0
- **CPU:** ARM Cortex-A76 (4 cores @ 2.4 GHz)
- **RAM:** 8GB
- **Architecture:** aarch64 (64-bit ARM)
- **OS:** Debian GNU/Linux 13 (trixie)
- **Kernel:** Linux 6.12.47+rpt-rpi-2712
- **Storage:** 58.3GB SD card
- **Temperature:** ~55°C (normal)
- **Username:** `saarasubiza`
- **Production URL:** `https://golden-munch-pos.vercel.app`

**Status: ✅ PERFECT for kiosk deployment!**

---

# 🔑 PART 0: PASSWORD RESET (CRITICAL - START HERE!)

Since you've lost the password for user `saarasubiza`, you need to reset it first.

## Method A: Reset via Recovery Mode (Recommended)

### Step 1: Boot into Single User Mode

1. **Power off** the Raspberry Pi completely
2. **Remove the SD card** and insert it into another computer
3. **Mount the boot partition** (usually auto-mounts as `bootfs` or `firmware`)
4. **Edit the cmdline.txt file:**

```bash
# On another Linux computer:
sudo mount /dev/mmcblk0p1 /mnt
sudo nano /mnt/cmdline.txt

# On Windows: Use Notepad to edit the file on the boot drive
# On Mac: Use TextEdit to edit the file on the boot drive
```

5. **Add this at the END of the SINGLE LINE** (don't create new line):
```
init=/bin/bash
```

Example before:
```
console=serial0,115200 console=tty1 root=PARTUUID=xxx-02 rootfstype=ext4 fsck.repair=yes rootwait
```

Example after:
```
console=serial0,115200 console=tty1 root=PARTUUID=xxx-02 rootfstype=ext4 fsck.repair=yes rootwait init=/bin/bash
```

6. **Save** and **unmount** the SD card
7. **Insert SD card back** into Raspberry Pi
8. **Boot the Pi** - it will boot into a root shell

### Step 2: Reset Password from Root Shell

Once booted, you'll see a root prompt `#`:

```bash
# Remount root filesystem as read-write
mount -o remount,rw /

# Change password for user saarasubiza
passwd saarasubiza

# Enter new password (won't show on screen - this is normal)
# Type it carefully twice

# Remount root filesystem as read-only
mount -o remount,ro /

# Sync and reboot
sync
reboot -f
```

### Step 3: Remove init=/bin/bash

1. **Power off** the Raspberry Pi
2. **Remove SD card** again and insert into another computer
3. **Edit cmdline.txt** and **REMOVE** the `init=/bin/bash` you added
4. **Save** and unmount
5. **Insert SD card** back into Raspberry Pi
6. **Boot normally** - now you can login with the new password!

---

## Method B: Reset via Another User with Sudo (If Available)

If you have another user with sudo access:

```bash
# Login as the other user, then:
sudo passwd saarasubiza

# Enter new password twice
```

---

## Method C: Fresh OS Install (Last Resort)

If password recovery doesn't work, you can do a fresh Debian install:

1. Download **Raspberry Pi OS Lite (64-bit)** or **Debian 13 (trixie) ARM64**
2. Flash to SD card using **Raspberry Pi Imager**
3. In Imager, click "Settings" (gear icon):
   - Set hostname: `GoldenMunch`
   - **Enable SSH**
   - Set username: `saarasubiza`
   - Set password: `YOUR_NEW_PASSWORD` (WRITE IT DOWN!)
   - Configure WiFi (if needed)
   - Set locale: your timezone
4. Write image to SD card
5. Boot Raspberry Pi
6. Continue with Part 1 below

---

## ✅ NEW PASSWORD (WRITE IT HERE!)

**Username:** `saarasubiza`
**Password:** `_______________________________` (FILL THIS IN!)

**⚠️ CRITICAL: WRITE DOWN YOUR NEW PASSWORD AND KEEP IT SAFE!**

---

# 📑 TABLE OF CONTENTS

1. [Initial System Setup](#part-1-initial-system-setup)
2. [Install Dependencies](#part-2-install-dependencies)
3. [Clone Project](#part-3-clone-project)
4. [Install Kiosk Dependencies](#part-4-install-kiosk-dependencies)
5. [Configure Kiosk URL](#part-5-configure-kiosk-url)
6. [Test Manually](#part-6-test-kiosk-manually)
7. [Setup Autostart](#part-7-setup-autostart)
8. [Configure Portrait Mode (Optional)](#part-8-configure-portrait-mode-optional)
9. [Fix Touch Functionality (Optional)](#part-9-fix-touch-functionality-optional)
10. [Final Verification](#part-10-final-verification)

---

# PART 1: INITIAL SYSTEM SETUP

## Step 1.1: Login to Your Raspberry Pi

```bash
# If using SSH from another computer:
ssh saarasubiza@GoldenMunch.local
# Or use the IP address:
ssh saarasubiza@192.168.1.XXX

# Enter your NEW password that you just set
```

**If you see "permission denied", go back to Part 0 and reset the password!**

## Step 1.2: Update System

```bash
# Update package lists
sudo apt update

# Upgrade all packages
sudo apt upgrade -y

# Clean up
sudo apt autoremove -y
sudo apt autoclean

# Check if reboot is needed
if [ -f /var/run/reboot-required ]; then
    echo "Reboot required - rebooting now..."
    sudo reboot
fi
```

**Wait for system to reboot, then SSH back in.**

## Step 1.3: Verify System Info

```bash
# Check OS version
cat /etc/os-release

# Should show:
# PRETTY_NAME="Debian GNU/Linux 13 (trixie)"
# VERSION_ID="13"

# Check architecture
uname -m
# Should show: aarch64

# Check Raspberry Pi model
cat /proc/device-tree/model
# Should show: Raspberry Pi 5 Model B Rev 1.0

# Check temperature
vcgencmd measure_temp
# Should be under 70°C

# Check memory
free -h
# Should show 7.9GB total
```

✅ **Your system is ready!**

---

# PART 2: INSTALL DEPENDENCIES

## Step 2.1: Install Node.js 20 LTS

**Why Node 20?**
- Better ARM64 (aarch64) optimization
- Improved Raspberry Pi 5 performance
- Latest Electron compatibility

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

**If you see version 20.x.x, you're good!** ✅

## Step 2.2: Install System Dependencies

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

# Install build tools (for native modules)
sudo apt install -y \
    build-essential \
    python3 \
    git

# Optional: USB thermal printer support
sudo apt install -y libusb-1.0-0-dev
```

**This will take a few minutes. Wait for completion.** ☕

## Step 2.3: Ensure X11 is Running (NOT Wayland)

**CRITICAL:** Raspberry Pi 5 on Debian 13 may use Wayland by default. Electron kiosk **requires X11**.

### Check Current Display Server:

```bash
echo $XDG_SESSION_TYPE
```

**Expected:** `x11`
**If shows:** `wayland` → Follow steps below ⬇️

### Force X11 (if needed):

```bash
# Check which display manager you're using
sudo systemctl status gdm3 2>/dev/null && echo "Using GDM3" || echo "Not using GDM3"
sudo systemctl status lightdm 2>/dev/null && echo "Using LightDM" || echo "Not using LightDM"

# If using GDM3:
sudo nano /etc/gdm3/custom.conf
# Uncomment this line under [daemon]:
# WaylandEnable=false

# If using LightDM:
sudo nano /etc/lightdm/lightdm.conf
# Add under [Seat:*]:
[Seat:*]
user-session=lightdm-xsession
xserver-command=X -s 0 -dpms

# Save: Ctrl+O, Enter
# Exit: Ctrl+X

# Reboot to apply
sudo reboot
```

**After reboot, verify:**
```bash
echo $XDG_SESSION_TYPE
# Should now show: x11
```

✅ **X11 is ready!**

---

# PART 3: CLONE PROJECT

## Step 3.1: Navigate to Home Directory

```bash
cd ~
pwd
# Should show: /home/saarasubiza
```

## Step 3.2: Clone the Repository

```bash
# Clone the repository
git clone https://github.com/Shaloh69/GoldenMunch_POS-System-With-Custom-Cake-Editor.git

# This will create the directory:
# ~/GoldenMunch_POS-System-With-Custom-Cake-Editor
```

**Wait for cloning to complete...**

## Step 3.3: Verify Project Structure

```bash
# Navigate to project
cd ~/GoldenMunch_POS-System-With-Custom-Cake-Editor

# Check structure
ls -la

# You should see:
# client/
# server/
# README.md
# etc.

# Navigate to Kiosk_Electron
cd client/Kiosk_Electron

# Verify you're in the right place
pwd
# Should show: /home/saarasubiza/GoldenMunch_POS-System-With-Custom-Cake-Editor/client/Kiosk_Electron

ls -la
# You should see:
# electron/
# scripts/
# package.json
# README.md
# etc.
```

✅ **Project cloned successfully!**

---

# PART 4: INSTALL KIOSK DEPENDENCIES

## Step 4.1: Install NPM Packages

```bash
# Make sure you're in the Kiosk_Electron directory
cd ~/GoldenMunch_POS-System-With-Custom-Cake-Editor/client/Kiosk_Electron

# Install npm packages
npm install
```

**This will:**
- ✅ Install Electron (ARM64 build optimized for Raspberry Pi 5)
- ✅ Install thermal printer libraries
- ✅ Build native modules for aarch64
- ⏱️ **Takes 5-10 minutes on first run**

**Wait for installation to complete. Do NOT interrupt!** ☕☕☕

## Step 4.2: Verify Installation

```bash
# Check if node_modules exists
ls -la node_modules

# Check Electron version
npx electron --version
# Should show: v34.x.x or similar

# Check package.json
cat package.json | grep version
# Should show version info
```

✅ **Dependencies installed successfully!**

---

# PART 5: CONFIGURE KIOSK URL

The kiosk needs to know which URL to load. You have **3 options**:

## URL Priority (Kiosk loads in this order):

```
1. Config file: ~/.config/goldenmunch-kiosk-electron/kiosk-config.json
2. Environment variable: $KIOSK_APP_URL
3. Development default: http://localhost:3002 (dev mode only)
4. No URL: Opens settings panel automatically
```

**Your Production URL:** `https://golden-munch-pos.vercel.app`

---

## 🌟 METHOD A: Environment Variable (RECOMMENDED)

This is the **easiest and most reliable** method for production.

```bash
# Add to .bashrc (makes it permanent)
echo 'export KIOSK_APP_URL="https://golden-munch-pos.vercel.app"' >> ~/.bashrc

# Reload shell configuration
source ~/.bashrc

# Verify it's set
echo $KIOSK_APP_URL
# Should show: https://golden-munch-pos.vercel.app
```

✅ **URL configured via environment variable!**

---

## METHOD B: Config File (Alternative)

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

# Verify config file
cat ~/.config/goldenmunch-kiosk-electron/kiosk-config.json
```

✅ **URL configured via config file!**

---

## METHOD C: Using Settings Panel (After First Start)

```bash
# Start kiosk (will be done in next section)
npm start

# Press Ctrl+Shift+C to open settings panel
# Enter URL: https://golden-munch-pos.vercel.app
# Click "Save & Reload"
```

**Choose ONE method above. Method A (Environment Variable) is recommended for production.**

---

# PART 6: TEST KIOSK MANUALLY

## Step 6.1: IMPORTANT - Test Before Autostart!

**⚠️ ALWAYS test manually before setting up autostart!**

This ensures everything works before making it automatic.

```bash
# Navigate to Kiosk_Electron
cd ~/GoldenMunch_POS-System-With-Custom-Cake-Editor/client/Kiosk_Electron

# Start kiosk in production mode
npm start
```

## Step 6.2: What to Expect

**✅ Expected Behavior:**
- Kiosk window opens in fullscreen (kiosk mode)
- Shows black screen briefly while loading
- Loads `https://golden-munch-pos.vercel.app`
- Web app displays correctly
- Touchscreen responds (if you have a touchscreen)

**Console Output Should Show:**
```
Global shortcuts registered:
  Ctrl+Shift+C - Open Settings
  Alt+F4 - Exit Kiosk
  Ctrl+Q - Exit Kiosk
Using environment variable URL: https://golden-munch-pos.vercel.app
```

## Step 6.3: Keyboard Shortcuts (Test Them!)

| Shortcut | Action |
|----------|--------|
| `Ctrl+Shift+C` | Open Settings Panel |
| `Alt+F4` | Exit Kiosk |
| `Ctrl+Q` | Exit Kiosk (alternative) |

**Try pressing `Ctrl+Shift+C`** - Settings panel should open showing your configured URL.

## Step 6.4: Verify URL Loaded Correctly

Press `Ctrl+Shift+C` and verify the URL shows:
```
https://golden-munch-pos.vercel.app
```

## Step 6.5: Exit Kiosk

```bash
# Press Alt+F4 to exit kiosk

# You should return to the terminal
# Check terminal output for any errors
```

**If you see any errors, DO NOT proceed to autostart! Fix errors first.**

## Step 6.6: Common Issues During Testing

### Issue: Black screen / nothing loads
```bash
# Check network connectivity
ping -c 3 golden-munch-pos.vercel.app

# Check URL is configured
echo $KIOSK_APP_URL

# Check logs for errors
# (logs appear in terminal where you ran npm start)
```

### Issue: "DISPLAY :0 not found" error
```bash
# Check if X11 is running
echo $DISPLAY
# Should show: :0

echo $XDG_SESSION_TYPE
# Should show: x11

# If not, go back to Step 2.3 and configure X11
```

### Issue: GPU/Graphics errors
```bash
# Already handled by the startup script
# which sets ELECTRON_OZONE_PLATFORM_HINT=x11
```

✅ **If kiosk loads correctly and shows the web app, you're ready for autostart!**

---

# PART 7: SETUP AUTOSTART

## Step 7.1: Run Autostart Installer

The project includes an automated installer that:
- ✅ Detects your username automatically (`saarasubiza`)
- ✅ Updates all paths dynamically
- ✅ Creates systemd service
- ✅ Enables autostart on boot
- ✅ Sets up logging

```bash
cd ~/GoldenMunch_POS-System-With-Custom-Cake-Editor/client/Kiosk_Electron

# Make installer executable
chmod +x scripts/install-autostart.sh

# Run installer
./scripts/install-autostart.sh
```

**Installer Output:**
```
=========================================
GoldenMunch Kiosk - Autostart Installer
=========================================

Step 1: Making startup script executable...
✓ Startup script is now executable

Step 2: Updating paths in service file...
✓ Service file updated with correct paths
  User: saarasubiza
  Home: /home/saarasubiza

Step 3: Installing systemd service...
[sudo password required]
✓ Systemd service installed

Step 4: Enabling service (autostart on boot)...
✓ Service enabled - will start on boot

Step 5: Creating log directory...
✓ Log directory created: /home/saarasubiza/.goldenmunch-logs

Step 6: Checking kiosk configuration...
✓ Kiosk URL is already configured
  URL: https://golden-munch-pos.vercel.app

=========================================
Installation Complete!
=========================================

Would you like to start the kiosk now? (y/n)
```

**When prompted:** Type **`y`** and press Enter to start kiosk now.

## Step 7.2: Verify Service is Running

```bash
# Check service status
sudo systemctl status goldenmunch-kiosk.service

# Should show:
# ● goldenmunch-kiosk.service - GoldenMunch Kiosk Electron Application
#    Loaded: loaded (/etc/systemd/system/goldenmunch-kiosk.service; enabled)
#    Active: active (running) since [date]
```

**Look for:** `Active: active (running)` in green text ✅

## Step 7.3: View Live Logs

```bash
# View systemd service logs (live)
journalctl -u goldenmunch-kiosk.service -f

# Press Ctrl+C to exit log view

# View application logs
tail -f ~/.goldenmunch-logs/kiosk.log

# View startup logs
tail -f ~/.goldenmunch-logs/startup.log
```

## Step 7.4: Service Management Commands (Reference)

```bash
# Start kiosk
sudo systemctl start goldenmunch-kiosk.service

# Stop kiosk
sudo systemctl stop goldenmunch-kiosk.service

# Restart kiosk
sudo systemctl restart goldenmunch-kiosk.service

# Check status
sudo systemctl status goldenmunch-kiosk.service

# View logs (live)
journalctl -u goldenmunch-kiosk.service -f

# Disable autostart (if needed)
sudo systemctl disable goldenmunch-kiosk.service

# Re-enable autostart
sudo systemctl enable goldenmunch-kiosk.service
```

## Step 7.5: Configure Auto-Login (RECOMMENDED)

This makes the Pi automatically login as `saarasubiza` on boot.

```bash
# Use raspi-config
sudo raspi-config

# Navigate using arrow keys:
# 1. System Options → Boot / Auto Login → Desktop Autologin
# 2. Select "Desktop Autologin"
# 3. Press Enter
# 4. Select "Finish"
# 5. Reboot when prompted
```

**Or manually edit LightDM config:**

```bash
sudo nano /etc/lightdm/lightdm.conf

# Add under [Seat:*]:
[Seat:*]
autologin-user=saarasubiza
autologin-user-timeout=0

# Save: Ctrl+O, Enter
# Exit: Ctrl+X

# Reboot to apply
sudo reboot
```

## Step 7.6: Disable Screen Blanking (RECOMMENDED)

Prevents the screen from turning off.

```bash
# Edit lightdm config
sudo nano /etc/lightdm/lightdm.conf

# Find [Seat:*] section and add/update:
[Seat:*]
xserver-command=X -s 0 -dpms
autologin-user=saarasubiza
autologin-user-timeout=0

# Save: Ctrl+O, Enter
# Exit: Ctrl+X

# Reboot to apply
sudo reboot
```

✅ **Autostart configured! Kiosk will now start automatically on boot.**

---

# PART 8: CONFIGURE PORTRAIT MODE (OPTIONAL)

**Skip this section if you're using landscape mode.**

For vertical/portrait orientation displays:

## Step 8.1: Check Current Display

```bash
# Get display information
xrandr

# Example output:
# HDMI-1 connected 1920x1080+0+0 (normal left inverted right x axis y axis) ...
# Note your display name (e.g., HDMI-1)
```

## Step 8.2: Rotate Display - METHOD A (Preferred for Pi 5)

### Using config.txt (Hardware rotation):

```bash
# Edit boot config
sudo nano /boot/firmware/config.txt

# Scroll to the end and add ONE of these lines:
display_rotate=0  # Normal (landscape - 0°)
display_rotate=1  # 90° clockwise (portrait)
display_rotate=2  # 180° (upside down)
display_rotate=3  # 270° clockwise (90° counter-clockwise)

# For portrait mode (90° clockwise), add:
display_rotate=1

# Save: Ctrl+O, Enter
# Exit: Ctrl+X

# Reboot to apply
sudo reboot
```

## Step 8.3: Rotate Display - METHOD B (Software rotation)

### Using xrandr (Session-based):

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

## Step 8.4: Make Software Rotation Permanent

Add to startup script so it rotates every time:

```bash
# Edit startup script
nano ~/GoldenMunch_POS-System-With-Custom-Cake-Editor/client/Kiosk_Electron/scripts/start-kiosk.sh

# Find the line after "xset -dpms" (around line 94)
# Add this line below it:

xrandr --output HDMI-1 --rotate right  # For portrait mode

# Save: Ctrl+O, Enter
# Exit: Ctrl+X

# Restart kiosk to apply
sudo systemctl restart goldenmunch-kiosk.service
```

## Step 8.5: Verify Rotation

```bash
# Check rotation
xrandr | grep -A 1 "connected"

# Portrait mode should show: 1080x1920 instead of 1920x1080
```

✅ **Portrait mode configured!**

---

# PART 9: FIX TOUCH FUNCTIONALITY (OPTIONAL)

**Skip this section if you don't have a touchscreen.**

## Step 9.1: Check Touchscreen Detection

```bash
# List input devices
xinput list

# Look for touchscreen in output, examples:
# - "FT5406 memory based driver"  (Official Pi touchscreen)
# - "ADS7846 Touchscreen"
# - "eGalax Inc. USB TouchController"
# Note the ID number (e.g., id=6)
```

## Step 9.2: Install Touchscreen Drivers

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

## Step 9.3: Calibrate Touchscreen

```bash
# Install calibration tool
sudo apt install -y xinput-calibrator

# Run calibration
xinput_calibrator

# Follow on-screen instructions
# Tap the crosshairs in each corner precisely
```

### Save Calibration Data:

After calibration, you'll see output like:

```
Section "InputClass"
    Identifier "calibration"
    MatchProduct "ADS7846 Touchscreen"
    Option "Calibration" "3932 300 294 3801"
    Option "SwapAxes" "1"
EndSection
```

**Copy this output and save it:**

```bash
# Create xorg config directory
sudo mkdir -p /etc/X11/xorg.conf.d

# Create calibration file
sudo nano /etc/X11/xorg.conf.d/99-calibration.conf

# Paste the calibration output from xinput_calibrator
# Save: Ctrl+O, Enter
# Exit: Ctrl+X

# Reboot to apply
sudo reboot
```

## Step 9.4: Fix Touch Rotation for Portrait Mode

**If touch is rotated incorrectly after display rotation:**

```bash
# Find touchscreen device ID
xinput list
# Note the ID number (e.g., id=6)

# Map touchscreen to rotated display
xinput map-to-output 6 HDMI-1
# (Replace 6 with your touchscreen ID)
# (Replace HDMI-1 with your display name)

# Make permanent by adding to startup script
nano ~/GoldenMunch_POS-System-With-Custom-Cake-Editor/client/Kiosk_Electron/scripts/start-kiosk.sh

# Find the xrandr rotation line (if you added it)
# Add this line below it:
xinput map-to-output 6 HDMI-1

# Save and restart
sudo systemctl restart goldenmunch-kiosk.service
```

## Step 9.5: Verify Touch is Working

```bash
# Restart kiosk
sudo systemctl restart goldenmunch-kiosk.service

# Touch the screen in different locations
# Touch position should match visual position exactly
```

## Step 9.6: Advanced Touch Configuration (If Needed)

### Invert Touch Axes (if touch is mirrored):

```bash
# Find device ID
xinput list

# Get current properties
xinput list-props 6  # Replace 6 with your device ID

# Invert X axis (horizontal flip)
xinput set-prop 6 "Coordinate Transformation Matrix" -1 0 1 0 1 0 0 0 1

# Invert Y axis (vertical flip)
xinput set-prop 6 "Coordinate Transformation Matrix" 1 0 0 0 -1 1 0 0 1

# Swap X and Y (if rotated 90°)
xinput set-prop 6 "Coordinate Transformation Matrix" 0 1 0 1 0 0 0 0 1

# Make permanent by adding to startup script
```

✅ **Touch functionality configured!**

---

# PART 10: FINAL VERIFICATION

## Step 10.1: Complete Reboot Test

**This is the FINAL TEST to ensure everything works on boot.**

```bash
# Reboot to test complete boot sequence
sudo reboot
```

**What SHOULD happen (in order):**
1. ✅ Raspberry Pi boots
2. ✅ Auto-login as `saarasubiza` (if configured)
3. ✅ X11 desktop starts
4. ✅ Systemd starts goldenmunch-kiosk service
5. ✅ Startup script waits for X server and network
6. ✅ Display rotates to portrait (if configured)
7. ✅ Kiosk loads in fullscreen
8. ✅ URL loads: `https://golden-munch-pos.vercel.app`
9. ✅ Touchscreen works correctly (if configured)
10. ✅ No screen blanking

**Total boot time to kiosk:** ~30-60 seconds

## Step 10.2: Check All Logs

SSH back into the Pi and check logs:

```bash
ssh saarasubiza@GoldenMunch.local

# Check service status
sudo systemctl status goldenmunch-kiosk.service

# Should show:
# Active: active (running)

# Check startup log
tail -50 ~/.goldenmunch-logs/startup.log

# Should show:
# X server is ready!
# Network is ready!
# Kiosk started (PID: XXXX)

# Check kiosk log
tail -50 ~/.goldenmunch-logs/kiosk.log

# Should show:
# Global shortcuts registered
# Using environment variable URL: https://golden-munch-pos.vercel.app

# Check for errors
journalctl -u goldenmunch-kiosk.service -n 100 --no-pager | grep -i error

# Should show no errors (or only harmless warnings)
```

## Step 10.3: Monitor System Resources

```bash
# Check temperature
vcgencmd measure_temp
# Should be under 70°C (ideally under 65°C)

# Check memory usage
free -h
# Should have 6+ GB available

# Check disk space
df -h
# Should have plenty free on /

# Check CPU usage
top
# Press 'q' to exit
# Electron should use 10-30% CPU
```

## Step 10.4: Test All Functionality

- ✅ Tap buttons in the web app
- ✅ Swipe/scroll works
- ✅ All UI elements respond correctly
- ✅ Keyboard shortcuts work:
  - `Ctrl+Shift+C` → Settings panel opens
  - Verify URL is correct
  - Close settings panel
- ✅ Screen doesn't blank after 10 minutes
- ✅ System is stable (no crashes/freezes)

## Step 10.5: Production Readiness Test

**Leave kiosk running for 30 minutes and verify:**
- ✅ No crashes
- ✅ No memory leaks (check `free -h`)
- ✅ No screen blanking
- ✅ Temperature stable (check `vcgencmd measure_temp`)
- ✅ Web app remains responsive

---

# 🎯 PRODUCTION DEPLOYMENT CHECKLIST

Before marking as **production-ready**, verify ALL items:

**System:**
- [ ] System fully updated (`sudo apt update && sudo apt upgrade`)
- [ ] Node.js 20 LTS installed (`node --version`)
- [ ] X11 confirmed running (`echo $XDG_SESSION_TYPE` shows `x11`)
- [ ] All system dependencies installed

**Kiosk:**
- [ ] Project cloned to `~/GoldenMunch_POS-System-With-Custom-Cake-Editor`
- [ ] Kiosk dependencies installed (`npm install` completed)
- [ ] URL configured: `https://golden-munch-pos.vercel.app`
- [ ] Manual test successful (`npm start` works)

**Autostart:**
- [ ] Autostart installed (`./scripts/install-autostart.sh` completed)
- [ ] Service enabled (`sudo systemctl is-enabled goldenmunch-kiosk.service` shows `enabled`)
- [ ] Auto-login enabled (boots directly to desktop)
- [ ] Screen blanking disabled

**Display (if applicable):**
- [ ] Portrait mode configured (if using vertical display)
- [ ] Display rotation correct
- [ ] Touchscreen working and calibrated
- [ ] Touch rotation matches display rotation

**Testing:**
- [ ] Keyboard shortcuts working (`Ctrl+Shift+C` opens settings)
- [ ] Full reboot test passed (boots directly into kiosk)
- [ ] All logs checked (no critical errors)
- [ ] 30-minute stability test passed

**Security:**
- [ ] System password changed from default
- [ ] Password written down and stored securely
- [ ] Network connection stable

**Final:**
- [ ] Temperature normal (< 70°C under load)
- [ ] Memory usage normal (6+ GB available)
- [ ] Final user acceptance test completed

---

# 📊 QUICK REFERENCE COMMANDS

## Service Management

```bash
# Start kiosk
sudo systemctl start goldenmunch-kiosk.service

# Stop kiosk
sudo systemctl stop goldenmunch-kiosk.service

# Restart kiosk
sudo systemctl restart goldenmunch-kiosk.service

# Check status
sudo systemctl status goldenmunch-kiosk.service

# View logs (live)
journalctl -u goldenmunch-kiosk.service -f

# Disable autostart
sudo systemctl disable goldenmunch-kiosk.service

# Enable autostart
sudo systemctl enable goldenmunch-kiosk.service
```

## Display Configuration

```bash
# Check displays
xrandr

# Rotate portrait (90° clockwise)
xrandr --output HDMI-1 --rotate right

# Rotate landscape (normal)
xrandr --output HDMI-1 --rotate normal

# Rotate 180°
xrandr --output HDMI-1 --rotate inverted

# Rotate 270° clockwise (90° counter-clockwise)
xrandr --output HDMI-1 --rotate left
```

## Touch Configuration

```bash
# List input devices
xinput list

# Map touch to display (after rotation)
xinput map-to-output <TOUCH_ID> HDMI-1

# Calibrate touch
sudo apt install -y xinput-calibrator
xinput_calibrator
```

## System Monitoring

```bash
# Temperature
vcgencmd measure_temp

# Memory
free -h

# Disk space
df -h

# CPU usage
top
# Press 'q' to exit

# Network status
ping -c 3 8.8.8.8

# Network interface
ip addr show
```

## Log Locations

```
# Application logs
~/.goldenmunch-logs/startup.log    # Startup script output
~/.goldenmunch-logs/kiosk.log      # Electron app output

# System logs
journalctl -u goldenmunch-kiosk.service    # Systemd service logs
journalctl -u goldenmunch-kiosk.service -f # Live logs

# View recent logs
tail -50 ~/.goldenmunch-logs/kiosk.log
tail -50 ~/.goldenmunch-logs/startup.log
```

## Configuration Files

```
# Kiosk URL config
~/.config/goldenmunch-kiosk-electron/kiosk-config.json

# Systemd service
/etc/systemd/system/goldenmunch-kiosk.service

# Startup script
~/GoldenMunch_POS-System-With-Custom-Cake-Editor/client/Kiosk_Electron/scripts/start-kiosk.sh

# Environment variables
~/.bashrc

# Boot config (display rotation)
/boot/firmware/config.txt

# LightDM config (auto-login, screen blanking)
/etc/lightdm/lightdm.conf

# Touch calibration
/etc/X11/xorg.conf.d/99-calibration.conf
```

---

# 🆘 COMMON ISSUES & SOLUTIONS

## Issue: Kiosk doesn't start on boot

**Symptoms:** Screen stays at desktop or login screen

**Solution:**
```bash
# Check service status
sudo systemctl status goldenmunch-kiosk.service

# Check logs for errors
tail -100 ~/.goldenmunch-logs/startup.log
journalctl -u goldenmunch-kiosk.service -n 100

# Common causes:
# 1. X server not running - check: echo $DISPLAY
# 2. Wrong username in service - reinstall autostart
# 3. Dependencies not installed - run: npm install

# Reinstall autostart if needed
cd ~/GoldenMunch_POS-System-With-Custom-Cake-Editor/client/Kiosk_Electron
./scripts/install-autostart.sh
```

## Issue: Wrong URL loading

**Symptoms:** Kiosk loads wrong page or settings panel

**Solution:**
```bash
# Check current config
cat ~/.config/goldenmunch-kiosk-electron/kiosk-config.json

# Check environment variable
echo $KIOSK_APP_URL

# Update environment variable (preferred)
echo 'export KIOSK_APP_URL="https://golden-munch-pos.vercel.app"' >> ~/.bashrc
source ~/.bashrc

# Or update config file
cat > ~/.config/goldenmunch-kiosk-electron/kiosk-config.json << 'EOF'
{
  "appUrl": "https://golden-munch-pos.vercel.app",
  "lastUpdated": "2025-01-15T10:00:00.000Z"
}
EOF

# Restart kiosk
sudo systemctl restart goldenmunch-kiosk.service
```

## Issue: Display not rotating

**Symptoms:** Display stays in landscape when you want portrait

**Solution:**
```bash
# Method 1: Edit boot config (hardware rotation - preferred)
sudo nano /boot/firmware/config.txt

# Add at the end:
display_rotate=1  # For 90° clockwise portrait

# Save and reboot
sudo reboot

# Method 2: Software rotation (session-based)
xrandr --output HDMI-1 --rotate right

# Make permanent by adding to startup script
nano ~/GoldenMunch_POS-System-With-Custom-Cake-Editor/client/Kiosk_Electron/scripts/start-kiosk.sh
# Add after "xset -dpms":
xrandr --output HDMI-1 --rotate right
```

## Issue: Touch not working

**Symptoms:** Touch screen doesn't respond

**Solution:**
```bash
# Check if touchscreen is detected
xinput list
# Should see touchscreen in the list

# If not detected:
# 1. Check physical connection
# 2. Check power to touchscreen

# Install drivers
sudo apt install -y xserver-xorg-input-evdev xserver-xorg-input-libinput

# Reboot
sudo reboot

# If still not working:
# Check kernel messages
dmesg | grep -i touch

# Check USB devices (for USB touchscreens)
lsusb
```

## Issue: Touch position wrong / offset

**Symptoms:** Touching screen registers in wrong location

**Solution:**
```bash
# Method 1: Map touch to display
xinput list  # Get touchscreen ID
xinput map-to-output <ID> HDMI-1

# Example:
xinput map-to-output 6 HDMI-1

# Method 2: Calibrate
sudo apt install -y xinput-calibrator
xinput_calibrator

# Follow on-screen instructions
# Save calibration output to:
sudo nano /etc/X11/xorg.conf.d/99-calibration.conf
# Paste calibration data
# Reboot
sudo reboot
```

## Issue: Screen blanking / turning off

**Symptoms:** Screen goes black after 10 minutes

**Solution:**
```bash
# Edit LightDM config
sudo nano /etc/lightdm/lightdm.conf

# Add/update under [Seat:*]:
[Seat:*]
xserver-command=X -s 0 -dpms

# Save and reboot
sudo reboot

# Verify in startup script (should already be there)
cat ~/GoldenMunch_POS-System-With-Custom-Cake-Editor/client/Kiosk_Electron/scripts/start-kiosk.sh
# Should contain:
# xset s off
# xset s noblank
# xset -dpms
```

## Issue: Black screen / GPU errors

**Symptoms:** Kiosk shows black screen, logs show GPU/DRM errors

**Solution:**
```bash
# Already handled by startup script which sets:
# export ELECTRON_OZONE_PLATFORM_HINT=x11

# Verify environment variables
cat ~/GoldenMunch_POS-System-With-Custom-Cake-Editor/client/Kiosk_Electron/scripts/start-kiosk.sh | grep ELECTRON

# Should show:
# export ELECTRON_OZONE_PLATFORM_HINT=x11
# export XDG_SESSION_TYPE=x11

# If missing, manually add to startup script
nano ~/GoldenMunch_POS-System-With-Custom-Cake-Editor/client/Kiosk_Electron/scripts/start-kiosk.sh
```

## Issue: "DISPLAY :0 not found" error

**Symptoms:** Service fails to start, logs show DISPLAY error

**Solution:**
```bash
# Increase wait time for X server
nano ~/GoldenMunch_POS-System-With-Custom-Cake-Editor/client/Kiosk_Electron/scripts/start-kiosk.sh

# Find line (around line 51):
for i in {1..30}; do

# Change to:
for i in {1..60}; do

# Save and restart
sudo systemctl restart goldenmunch-kiosk.service
```

## Issue: High temperature / overheating

**Symptoms:** Temperature > 70°C

**Solution:**
```bash
# Check current temperature
vcgencmd measure_temp

# Monitor in real-time
watch -n 1 vcgencmd measure_temp

# If consistently over 70°C:
# 1. Add heatsink to CPU
# 2. Add active cooling (fan)
# 3. Improve ventilation
# 4. Reduce overclock (if overclocked)

# Check if overclocked
vcgencmd get_config arm_freq
vcgencmd get_config over_voltage

# If overclocked, reduce or remove overclock:
sudo nano /boot/firmware/config.txt
# Remove or comment out:
# over_voltage=...
# arm_freq=...
```

## Issue: Network not available at boot

**Symptoms:** Kiosk loads but shows "Cannot connect" error

**Solution:**
```bash
# Increase network wait time in startup script
nano ~/GoldenMunch_POS-System-With-Custom-Cake-Editor/client/Kiosk_Electron/scripts/start-kiosk.sh

# Find line (around line 72):
for i in {1..60}; do

# Change to:
for i in {1..120}; do

# For WiFi, ensure it's configured:
sudo nano /etc/wpa_supplicant/wpa_supplicant.conf

# For Ethernet, check cable connection
ip link show

# Restart service
sudo systemctl restart goldenmunch-kiosk.service
```

## Issue: Kiosk crashes / restarts repeatedly

**Symptoms:** Black screen flashing, service keeps restarting

**Solution:**
```bash
# Check crash logs
tail -100 ~/.goldenmunch-logs/kiosk.log
journalctl -u goldenmunch-kiosk.service -n 200 | grep -i error

# Common causes:
# 1. Out of memory
free -h

# 2. Corrupted node_modules
cd ~/GoldenMunch_POS-System-With-Custom-Cake-Editor/client/Kiosk_Electron
rm -rf node_modules package-lock.json
npm install

# 3. Bad URL configuration
cat ~/.config/goldenmunch-kiosk-electron/kiosk-config.json
# Verify URL is correct

# 4. Missing dependencies
npm install

# Restart after fixes
sudo systemctl restart goldenmunch-kiosk.service
```

---

# ✅ YOU'RE DONE!

## 🎉 CONGRATULATIONS!

Your GoldenMunch Kiosk is now **fully configured** and **production-ready**!

## What You Have Achieved:

✅ **Raspberry Pi 5** running optimized Electron kiosk
✅ **Debian 13 (trixie)** fully updated and configured
✅ **Auto-start on boot** via systemd service
✅ **Auto-login** configured (boots directly to kiosk)
✅ **X11** properly configured (not Wayland)
✅ **Production URL** loaded: `https://golden-munch-pos.vercel.app`
✅ **Screen blanking** disabled (24/7 operation)
✅ **Systemd monitoring** with auto-restart on failure
✅ **Comprehensive logging** for troubleshooting
✅ **Portrait mode** (if configured)
✅ **Touch functionality** (if configured)
✅ **Global keyboard shortcuts** for management
✅ **Secure password** set and stored safely

## Boot Sequence (What Happens on Power-On):

```
1. Raspberry Pi boots (10-15 seconds)
   ↓
2. Auto-login as saarasubiza (2-3 seconds)
   ↓
3. X11 desktop starts (5-10 seconds)
   ↓
4. Systemd starts goldenmunch-kiosk service
   ↓
5. Startup script waits for X server (instant if ready)
   ↓
6. Startup script waits for network (5-30 seconds)
   ↓
7. Display rotates (if portrait mode configured)
   ↓
8. Screen blanking disabled
   ↓
9. Kiosk loads in fullscreen
   ↓
10. Web app loads from URL (5-15 seconds)
    ↓
11. READY FOR PRODUCTION! 🎉
```

**Total boot time:** 30-90 seconds (depending on network)

## Support & Maintenance:

### Logs:
```bash
# Application logs
~/.goldenmunch-logs/kiosk.log
~/.goldenmunch-logs/startup.log

# System logs
journalctl -u goldenmunch-kiosk.service -f
```

### Service Management:
```bash
# Status
sudo systemctl status goldenmunch-kiosk.service

# Restart
sudo systemctl restart goldenmunch-kiosk.service

# View logs
journalctl -u goldenmunch-kiosk.service -f
```

### Configuration:
```bash
# URL config
~/.config/goldenmunch-kiosk-electron/kiosk-config.json

# Environment variable
echo $KIOSK_APP_URL
```

### Monitoring:
```bash
# Temperature
vcgencmd measure_temp

# Memory
free -h

# CPU
top
```

## Regular Maintenance (Monthly):

```bash
# 1. Update system
sudo apt update && sudo apt upgrade -y

# 2. Check temperature
vcgencmd measure_temp
# Should be under 70°C

# 3. Check disk space
df -h
# Should have plenty free

# 4. Check logs for errors
tail -100 ~/.goldenmunch-logs/kiosk.log | grep -i error

# 5. Reboot to clear memory
sudo reboot
```

## Emergency Recovery:

If kiosk stops working:
1. Check service: `sudo systemctl status goldenmunch-kiosk.service`
2. Check logs: `tail -100 ~/.goldenmunch-logs/startup.log`
3. Restart service: `sudo systemctl restart goldenmunch-kiosk.service`
4. If still broken: Reboot: `sudo reboot`

## Your Credentials (KEEP SAFE!):

**Raspberry Pi:**
- Hostname: `GoldenMunch` or `GoldenMunch.local`
- Username: `saarasubiza`
- Password: `___________________________` (FILL IN YOUR NEW PASSWORD!)
- SSH: `ssh saarasubiza@GoldenMunch.local`

**Kiosk Configuration:**
- Production URL: `https://golden-munch-pos.vercel.app`
- Settings Shortcut: `Ctrl+Shift+C`
- Exit Shortcut: `Alt+F4` or `Ctrl+Q`

---

## 🎊 ENJOY YOUR KIOSK!

Your GoldenMunch Kiosk is now running 24/7 in production mode!

**Tested and verified on:**
- Raspberry Pi 5 Model B (8GB RAM)
- Debian GNU/Linux 13 (trixie)
- ARM64 (aarch64) architecture
- Node.js 20 LTS
- Electron 34

**Have questions?** Refer to the troubleshooting section above or check the logs!

---

**END OF GUIDE** ✨

