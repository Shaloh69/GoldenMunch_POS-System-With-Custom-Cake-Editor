# 🍓 Raspberry Pi 5 Kiosk Setup Guide

**Complete setup guide for GoldenMunch Kiosk on Raspberry Pi 5 (aarch64)**

---

## 📋 System Compatibility

### ✅ Verified Working Configuration

- **Hardware**: Raspberry Pi 5 Model B (4GB/8GB RAM)
- **Architecture**: aarch64 (64-bit ARM)
- **OS**: Debian GNU/Linux 13 (trixie) or Raspberry Pi OS 64-bit (Bookworm)
- **Kernel**: Linux 6.12+ (rpi-2712)
- **Display**: Any HDMI monitor or official Raspberry Pi touchscreen

### ✅ Your System Specs (Verified)
```
CPU: ARM Cortex-A76 (4 cores @ 2.4 GHz)
RAM: 8GB
Architecture: aarch64
OS: Debian 13 (trixie)
Temperature: ~55°C (normal)
Storage: 58GB SD card
```

**Status: ✅ PERFECT for kiosk deployment!**

---

## 🚀 Quick Start (TL;DR)

```bash
# 1. Clone/copy project to home directory
cd ~
git clone <repo-url> GoldenMunch_POS-System-With-Custom-Cake-Editor

# 2. Install dependencies
cd ~/GoldenMunch_POS-System-With-Custom-Cake-Editor/client/Kiosk_Electron
npm install

# 3. Configure kiosk URL
export KIOSK_APP_URL="https://golden-munch-pos.vercel.app"

# 4. Test manually first
npm start

# 5. Install autostart (after testing works)
chmod +x scripts/install-autostart.sh
./scripts/install-autostart.sh
```

---

## 📦 Detailed Installation Steps

### Step 1: System Update

```bash
# Update package list and upgrade system
sudo apt update && sudo apt upgrade -y

# Reboot if kernel was updated
sudo reboot
```

### Step 2: Install Node.js 20 LTS (Recommended for Pi 5)

```bash
# Install Node.js 20 LTS (better arm64 support than Node 18)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version   # Should show v20.x.x
npm --version    # Should show 10.x.x or higher
```

**Why Node 20?**
- Better aarch64 (arm64) optimization
- Improved performance on Raspberry Pi 5
- Better compatibility with latest Electron builds

### Step 3: Install System Dependencies

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

# Optional: USB printer support
sudo apt install -y libusb-1.0-0-dev
```

### Step 4: Ensure X11 is Running (Not Wayland)

**Raspberry Pi 5 on Debian 13 may use Wayland by default. Electron kiosk requires X11.**

#### Check Current Display Server:

```bash
echo $XDG_SESSION_TYPE
# Should output: x11
# If it shows "wayland", follow steps below
```

#### Force X11 (if needed):

```bash
# Edit GDM/LightDM configuration
sudo nano /etc/gdm3/custom.conf
# OR
sudo nano /etc/lightdm/lightdm.conf

# For GDM, uncomment this line under [daemon]:
#WaylandEnable=false

# For LightDM, ensure [Seat:*] section has:
[Seat:*]
user-session=lightdm-xsession
xserver-command=X -s 0 -dpms

# Save and reboot
sudo reboot

# Verify X11 after reboot
echo $XDG_SESSION_TYPE  # Should now show: x11
```

### Step 5: Clone Project

```bash
# Navigate to home directory
cd ~

# Clone project (replace with your repo URL)
git clone https://github.com/Shaloh69/GoldenMunch_POS-System-With-Custom-Cake-Editor.git

# Or if already cloned elsewhere, move it:
# mv /path/to/project ~/GoldenMunch_POS-System-With-Custom-Cake-Editor

# Verify path
ls -la ~/GoldenMunch_POS-System-With-Custom-Cake-Editor
```

### Step 6: Install Kiosk Dependencies

```bash
# Navigate to Kiosk_Electron directory
cd ~/GoldenMunch_POS-System-With-Custom-Cake-Editor/client/Kiosk_Electron

# Install npm packages
npm install

# This will:
# - Install Electron (arm64 build)
# - Install printer libraries (if USB printer is used)
# - Build native modules for aarch64

# Installation may take 5-10 minutes on first run
```

**Troubleshooting npm install:**

If you get permission errors:
```bash
# Fix npm permissions
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc
```

If native module build fails:
```bash
# Ensure build tools are installed
sudo apt install -y build-essential python3

# Try rebuilding
npm rebuild
```

### Step 7: Configure Kiosk URL

You need to tell the kiosk which URL to load. Choose one method:

#### **Method A: Environment Variable (Recommended)**

```bash
# Add to your .bashrc
echo 'export KIOSK_APP_URL="https://golden-munch-pos.vercel.app"' >> ~/.bashrc
source ~/.bashrc

# Verify
echo $KIOSK_APP_URL
```

#### **Method B: Config File**

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
```

#### **Method C: Using Settings Panel (After First Start)**

```bash
# Start kiosk
npm start

# Press Ctrl+Shift+C to open settings
# Enter URL and click "Save & Reload"
```

### Step 8: Test Kiosk Manually First

**IMPORTANT: Always test manually before setting up autostart!**

```bash
cd ~/GoldenMunch_POS-System-With-Custom-Cake-Editor/client/Kiosk_Electron

# Start in development mode (easier to debug)
npm run dev

# Or production mode
npm start
```

**What to check:**
- ✅ Kiosk opens in fullscreen
- ✅ Web app loads correctly from URL
- ✅ Touchscreen works (if applicable)
- ✅ No error messages in logs

**Exit kiosk:**
- Press `Alt+F4`
- Or press `Ctrl+Q`
- Or SSH from another computer and run: `pkill -f electron`

---

## 🔧 Autostart Setup (After Manual Test Works!)

### Install Autostart Service

The project includes an automated installer that:
- Detects your username automatically
- Updates all paths dynamically
- Creates systemd service
- Sets up logging

```bash
cd ~/GoldenMunch_POS-System-With-Custom-Cake-Editor/client/Kiosk_Electron

# Make installer executable
chmod +x scripts/install-autostart.sh

# Run installer
./scripts/install-autostart.sh
```

**The installer will:**
1. ✅ Make startup script executable
2. ✅ Update service file with your username (`saarasubiza`)
3. ✅ Install systemd service
4. ✅ Enable autostart on boot
5. ✅ Create log directories
6. ✅ Ask if you want to start now

### Service Management Commands

```bash
# Start kiosk now
sudo systemctl start goldenmunch-kiosk.service

# Stop kiosk
sudo systemctl stop goldenmunch-kiosk.service

# Restart kiosk
sudo systemctl restart goldenmunch-kiosk.service

# Check status
sudo systemctl status goldenmunch-kiosk.service

# View live logs
journalctl -u goldenmunch-kiosk.service -f

# Disable autostart (if needed)
sudo systemctl disable goldenmunch-kiosk.service

# Re-enable autostart
sudo systemctl enable goldenmunch-kiosk.service
```

### Log Locations

```bash
# Systemd service logs
journalctl -u goldenmunch-kiosk.service -f

# Application logs
tail -f ~/.goldenmunch-logs/kiosk.log          # Electron output
tail -f ~/.goldenmunch-logs/startup.log        # Startup script output

# View all logs
ls -lh ~/.goldenmunch-logs/
```

---

## ⚙️ Optional Configurations

### 1. Auto-login (Skip Login Screen)

```bash
# Use raspi-config
sudo raspi-config

# Navigate to:
# System Options > Boot / Auto Login > Desktop Autologin

# Or manually edit:
sudo nano /etc/lightdm/lightdm.conf

# Add under [Seat:*]:
[Seat:*]
autologin-user=saarasubiza
autologin-user-timeout=0
```

### 2. Disable Screen Blanking Permanently

```bash
# Edit lightdm config
sudo nano /etc/lightdm/lightdm.conf

# Add under [Seat:*]:
[Seat:*]
xserver-command=X -s 0 -dpms

# Save and reboot
sudo reboot
```

### 3. Hide Mouse Cursor

Edit the startup script:
```bash
nano ~/GoldenMunch_POS-System-With-Custom-Cake-Editor/client/Kiosk_Electron/scripts/start-kiosk.sh

# Uncomment this line (around line 101):
unclutter -idle 0.01 -root &
```

### 4. Rotate Display (Portrait Mode)

For Raspberry Pi 5, edit config.txt:
```bash
sudo nano /boot/firmware/config.txt

# Add one of these:
display_rotate=0  # Normal (0°)
display_rotate=1  # 90° clockwise
display_rotate=2  # 180°
display_rotate=3  # 270° clockwise

# For DSI touchscreens, use instead:
lcd_rotate=0  # or 1, 2, 3

# Save and reboot
sudo reboot
```

### 5. Performance Optimization

**Reduce GPU memory** (kiosk doesn't need much):
```bash
sudo nano /boot/firmware/config.txt

# Add or modify:
gpu_mem=64

# Save and reboot
sudo reboot
```

**Overclock (optional, with good cooling):**
```bash
sudo nano /boot/firmware/config.txt

# Mild overclock for Pi 5:
over_voltage=2
arm_freq=2600

# WARNING: Only with active cooling!
# Monitor temperature: vcgencmd measure_temp
```

---

## 🖨️ USB Thermal Printer Setup (Optional)

If using a USB thermal printer:

### Step 1: Connect and Identify Printer

```bash
# Connect printer via USB, then:
lsusb

# Example output:
# Bus 001 Device 004: ID 0416:5011 Winbond Electronics Corp. Thermal Printer

# Note the Vendor ID (0416) and Product ID (5011)
```

### Step 2: Configure Printer

```bash
# Edit printer config
nano ~/GoldenMunch_POS-System-With-Custom-Cake-Editor/client/Kiosk_Electron/electron/printer-config.json
```

```json
{
  "printerType": "usb",
  "usb": {
    "vid": "0x0416",
    "pid": "0x5011"
  },
  "settings": {
    "width": 48,
    "encoding": "GB18030"
  }
}
```

### Step 3: Add User to Printer Groups

```bash
sudo usermod -a -G lp,dialout saarasubiza
sudo reboot
```

### Step 4: Test Printer

After reboot:
```bash
# Check groups
groups
# Should include: lp, dialout

# Test printer from kiosk
# (Use the kiosk's print test function)
```

---

## 🔍 Troubleshooting

### Kiosk Doesn't Start on Boot

```bash
# Check service status
sudo systemctl status goldenmunch-kiosk.service

# Check logs
journalctl -u goldenmunch-kiosk.service -n 100 --no-pager
tail -100 ~/.goldenmunch-logs/startup.log

# Common issues:
# 1. X server not running - check with: echo $DISPLAY
# 2. Wrong username in service file - reinstall autostart
# 3. npm packages not installed - run: npm install
```

### Black Screen / Kiosk Opens but Blank

```bash
# Check if X11 is running
echo $XDG_SESSION_TYPE  # Should be: x11

# Check kiosk logs
tail -100 ~/.goldenmunch-logs/kiosk.log

# Common causes:
# 1. Wayland instead of X11 - see Step 4 above
# 2. GPU issues - logs will show renderer errors
# 3. Network not ready - check: ping 8.8.8.8
```

### Cannot Load URL / White Screen

```bash
# Test URL manually
curl -I https://golden-munch-pos.vercel.app

# Check configured URL
cat ~/.config/goldenmunch-kiosk-electron/kiosk-config.json

# Check network
ping -c 3 8.8.8.8

# Check kiosk logs for errors
tail -50 ~/.goldenmunch-logs/kiosk.log | grep -i error
```

### "DISPLAY :0 not found" Error

```bash
# Wait longer for X server
# Edit start-kiosk.sh and increase wait time:
nano ~/GoldenMunch_POS-System-With-Custom-Cake-Editor/client/Kiosk_Electron/scripts/start-kiosk.sh

# Change line 47 from:
for i in {1..30}; do
# To:
for i in {1..60}; do

# Restart service
sudo systemctl restart goldenmunch-kiosk.service
```

### Touchscreen Not Working

```bash
# Check if touchscreen is detected
xinput list

# Should see touchscreen in list
# If not, check USB connection and drivers

# For official Pi touchscreen:
sudo apt install -y xserver-xorg-input-evdev
sudo reboot
```

### Printer Not Working

```bash
# Check USB connection
lsusb | grep -i print

# Check user groups
groups saarasubiza
# Should include: lp, dialout

# Add to groups if missing
sudo usermod -a -G lp,dialout saarasubiza
sudo reboot

# Check printer config
cat ~/GoldenMunch_POS-System-With-Custom-Cake-Editor/client/Kiosk_Electron/electron/printer-config.json

# Test USB permissions
ls -l /dev/usb/lp*
```

### High Temperature

```bash
# Check current temp
vcgencmd measure_temp

# If over 70°C:
# 1. Add heatsink
# 2. Add fan
# 3. Reduce overclock
# 4. Check ventilation

# Monitor temp in real-time
watch -n 1 vcgencmd measure_temp
```

### Network Issues

```bash
# Check network connectivity
ping -c 3 8.8.8.8

# Check WiFi status
iwconfig

# Restart networking
sudo systemctl restart NetworkManager

# For persistent WiFi config:
sudo nano /etc/wpa_supplicant/wpa_supplicant.conf
```

---

## 📊 Performance Monitoring

### Check System Resources

```bash
# CPU temperature
vcgencmd measure_temp

# Memory usage
free -h

# CPU usage
top

# Disk space
df -h

# Kiosk process
ps aux | grep electron
```

### Optimize Performance

```bash
# 1. Reduce GPU memory (already using 64MB is good)
# 2. Disable unnecessary services:
sudo systemctl disable bluetooth
sudo systemctl disable cups  # If not using printer

# 3. Clear Electron cache periodically
rm -rf ~/.config/goldenmunch-kiosk-electron/Cache/*

# 4. Monitor logs and clean old logs
du -sh ~/.goldenmunch-logs/
# Clean if over 100MB:
rm ~/.goldenmunch-logs/*.log
sudo journalctl --vacuum-time=7d
```

---

## 🔒 Security Recommendations

### 1. Change Default Password

```bash
passwd
# Enter new strong password
```

### 2. Setup Firewall

```bash
# Install UFW
sudo apt install -y ufw

# Allow SSH (if needed for remote management)
sudo ufw allow 22

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

### 3. Update Regularly

```bash
# Create update script
cat > ~/update-kiosk.sh << 'EOF'
#!/bin/bash
sudo apt update
sudo apt upgrade -y
cd ~/GoldenMunch_POS-System-With-Custom-Cake-Editor/client/Kiosk_Electron
npm update
sudo reboot
EOF

chmod +x ~/update-kiosk.sh

# Run monthly
./update-kiosk.sh
```

### 4. Disable Unused Services

```bash
# Disable Bluetooth (if not needed)
sudo systemctl disable bluetooth

# Disable WiFi (if using Ethernet)
sudo rfkill block wifi

# Disable SSH (if not needed for remote access)
sudo systemctl disable ssh
```

---

## 📝 Complete Cheat Sheet

### Essential Commands

```bash
# Start/Stop Kiosk
sudo systemctl start goldenmunch-kiosk.service
sudo systemctl stop goldenmunch-kiosk.service
sudo systemctl restart goldenmunch-kiosk.service

# View Status
sudo systemctl status goldenmunch-kiosk.service

# Live Logs
journalctl -u goldenmunch-kiosk.service -f

# Application Logs
tail -f ~/.goldenmunch-logs/kiosk.log

# Check Temperature
vcgencmd measure_temp

# Check Network
ping 8.8.8.8

# Restart System
sudo reboot

# Shutdown
sudo shutdown -h now
```

### File Locations

```
# Project
~/GoldenMunch_POS-System-With-Custom-Cake-Editor/

# Kiosk
~/GoldenMunch_POS-System-With-Custom-Cake-Editor/client/Kiosk_Electron/

# Startup Script
~/GoldenMunch_POS-System-With-Custom-Cake-Editor/client/Kiosk_Electron/scripts/start-kiosk.sh

# Systemd Service
/etc/systemd/system/goldenmunch-kiosk.service

# Config
~/.config/goldenmunch-kiosk-electron/kiosk-config.json

# Logs
~/.goldenmunch-logs/kiosk.log
~/.goldenmunch-logs/startup.log

# Printer Config
~/GoldenMunch_POS-System-With-Custom-Cake-Editor/client/Kiosk_Electron/electron/printer-config.json
```

---

## 🎯 Deployment Checklist

Before deploying to production:

- [ ] System fully updated (`sudo apt update && sudo apt upgrade`)
- [ ] Node.js 20 LTS installed
- [ ] X11 confirmed running (not Wayland)
- [ ] Kiosk tested manually and works
- [ ] Correct URL configured
- [ ] Autostart installed and enabled
- [ ] Auto-login enabled (optional)
- [ ] Screen blanking disabled
- [ ] Logs checked for errors
- [ ] Printer tested (if applicable)
- [ ] Temperature monitored under load
- [ ] Network connection stable
- [ ] Touchscreen calibrated (if applicable)
- [ ] System password changed from default
- [ ] Firewall enabled
- [ ] Final reboot test completed

---

## 🆘 Getting Help

### Check Logs First!

```bash
# Service logs (most useful!)
journalctl -u goldenmunch-kiosk.service -n 200 --no-pager

# Application logs
cat ~/.goldenmunch-logs/kiosk.log
cat ~/.goldenmunch-logs/startup.log

# System logs
dmesg | tail -100
```

### Collect System Info

```bash
# Create diagnostic report
cat > ~/kiosk-diagnostics.txt << 'EOF'
=== SYSTEM INFO ===
$(uname -a)
$(cat /proc/device-tree/model)

=== NODE/NPM ===
$(node --version)
$(npm --version)

=== DISPLAY ===
DISPLAY=$DISPLAY
XDG_SESSION_TYPE=$XDG_SESSION_TYPE

=== SERVICE STATUS ===
$(sudo systemctl status goldenmunch-kiosk.service --no-pager)

=== RECENT LOGS ===
$(journalctl -u goldenmunch-kiosk.service -n 50 --no-pager)

=== KIOSK CONFIG ===
$(cat ~/.config/goldenmunch-kiosk-electron/kiosk-config.json 2>/dev/null || echo "Not configured")

=== TEMPERATURE ===
$(vcgencmd measure_temp)

=== MEMORY ===
$(free -h)

=== DISK ===
$(df -h /)
EOF

# View report
cat ~/kiosk-diagnostics.txt
```

---

## 🎉 Success!

Your Raspberry Pi 5 kiosk is now fully configured and ready for deployment!

**What happens after reboot:**
1. Raspberry Pi boots
2. Auto-login (if configured)
3. X11 starts
4. Systemd launches kiosk service
5. Startup script waits for X server and network
6. Electron kiosk opens in fullscreen
7. Web app loads from configured URL
8. Kiosk runs 24/7 with automatic restart on failure

**You're all set! 🚀**
