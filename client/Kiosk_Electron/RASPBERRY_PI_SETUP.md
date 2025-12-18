# 🍓 Raspberry Pi Kiosk Setup Guide

Complete guide to set up GoldenMunch Kiosk on Raspberry Pi with autostart.

---

## 📋 Prerequisites

### Hardware
- **Raspberry Pi 4** (2GB+ RAM recommended)
- **MicroSD Card** (16GB+ recommended)
- **Display** (HDMI monitor/touchscreen)
- **Keyboard & Mouse** (for initial setup)
- **Power Supply** (Official 5V 3A recommended)

### Software
- **Raspberry Pi OS** (Bookworm or Bullseye)
  - Desktop version (not Lite - we need X11)
  - 32-bit or 64-bit

### Network
- **Internet connection** (WiFi or Ethernet)
- **Access to backend server** (local or cloud)

---

## 🚀 Installation Steps

### Step 1: Update System

```bash
sudo apt update
sudo apt upgrade -y
```

### Step 2: Install Node.js (if not already installed)

```bash
# Install Node.js 18 LTS
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version  # Should be v18.x.x
npm --version   # Should be 9.x.x or higher
```

### Step 3: Install Required System Dependencies

```bash
# Install dependencies for Electron
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
    xserver-xorg \
    x11-xserver-utils \
    unclutter

# Install USB printer dependencies (optional)
sudo apt install -y libusb-1.0-0-dev

# Install build tools for native modules
sudo apt install -y build-essential python3
```

### Step 4: Clone/Copy Project

```bash
# If using git
cd /home/user
git clone <your-repo-url> GoldenMunch_POS-System-With-Custom-Cake-Editor
cd GoldenMunch_POS-System-With-Custom-Cake-Editor

# Or copy files via SCP/USB
```

### Step 5: Install Kiosk Dependencies

```bash
cd /home/user/GoldenMunch_POS-System-With-Custom-Cake-Editor/client/Kiosk_Electron
npm install
```

### Step 6: Configure Kiosk URL

**Option A: Using the Settings Panel**

```bash
# Start kiosk in dev mode
npm run dev

# Press Ctrl+Shift+C to open settings
# Enter your backend URL (e.g., https://your-backend.onrender.com)
# Click "Test URL" then "Save & Reload"
```

**Option B: Using Environment Variable**

```bash
# Add to ~/.bashrc or ~/.profile
echo 'export KIOSK_APP_URL=https://your-backend.onrender.com' >> ~/.bashrc
source ~/.bashrc
```

**Option C: Edit config file directly**

```bash
# Create config directory if it doesn't exist
mkdir -p ~/.config/goldenmunch-kiosk-electron

# Create config file
cat > ~/.config/goldenmunch-kiosk-electron/kiosk-config.json << 'EOF'
{
  "appUrl": "https://your-backend.onrender.com",
  "lastUpdated": "2025-01-15T10:00:00.000Z"
}
EOF
```

---

## 🔧 Autostart Setup

### Method 1: Systemd Service (Recommended)

**Step 1: Make startup script executable**

```bash
cd /home/user/GoldenMunch_POS-System-With-Custom-Cake-Editor/client/Kiosk_Electron
chmod +x scripts/start-kiosk.sh
```

**Step 2: Install systemd service**

```bash
# Copy service file to systemd
sudo cp scripts/goldenmunch-kiosk.service /etc/systemd/system/

# Reload systemd
sudo systemctl daemon-reload

# Enable service (start on boot)
sudo systemctl enable goldenmunch-kiosk.service

# Start service now
sudo systemctl start goldenmunch-kiosk.service

# Check status
sudo systemctl status goldenmunch-kiosk.service
```

**Step 3: View logs**

```bash
# View systemd logs
sudo journalctl -u goldenmunch-kiosk.service -f

# View application logs
tail -f ~/.goldenmunch-logs/kiosk.log
tail -f ~/.goldenmunch-logs/startup.log
```

**Service Management Commands:**

```bash
# Stop kiosk
sudo systemctl stop goldenmunch-kiosk.service

# Restart kiosk
sudo systemctl restart goldenmunch-kiosk.service

# Disable autostart
sudo systemctl disable goldenmunch-kiosk.service

# Check status
sudo systemctl status goldenmunch-kiosk.service
```

---

### Method 2: LXDE Autostart (Alternative)

If you prefer LXDE autostart instead of systemd:

```bash
# Create autostart directory
mkdir -p ~/.config/lxsession/LXDE-pi

# Create autostart file
cat > ~/.config/lxsession/LXDE-pi/autostart << 'EOF'
@lxpanel --profile LXDE-pi
@pcmanfm --desktop --profile LXDE-pi
@xscreensaver -no-splash
@/home/user/GoldenMunch_POS-System-With-Custom-Cake-Editor/client/Kiosk_Electron/scripts/start-kiosk.sh
EOF
```

---

## ⚙️ Optional Configurations

### Disable Screen Blanking Permanently

```bash
# Edit lightdm config
sudo nano /etc/lightdm/lightdm.conf

# Find [Seat:*] section and add:
[Seat:*]
xserver-command=X -s 0 -dpms
```

### Auto-login (Skip login screen)

```bash
# Edit raspi-config
sudo raspi-config

# Navigate to: System Options > Boot / Auto Login > Desktop Autologin
# Select "Desktop Autologin" and reboot
```

### Rotate Display (for vertical orientation)

```bash
# Edit config.txt
sudo nano /boot/config.txt

# Add one of these lines:
display_rotate=0  # Normal (0°)
display_rotate=1  # 90° clockwise
display_rotate=2  # 180°
display_rotate=3  # 270° clockwise (90° counter-clockwise)

# Save and reboot
sudo reboot
```

### Hide Mouse Cursor

Uncomment this line in `scripts/start-kiosk.sh`:

```bash
unclutter -idle 0.01 -root &
```

---

## 🖨️ Thermal Printer Setup (Optional)

If using a USB thermal printer:

**Step 1: Connect printer and find USB info**

```bash
# List USB devices
lsusb

# Example output:
# Bus 001 Device 004: ID 0416:5011 Winbond Electronics Corp. Thermal Printer

# Note the Vendor ID (0416) and Product ID (5011)
```

**Step 2: Configure printer**

```bash
# Edit printer config
nano /home/user/GoldenMunch_POS-System-With-Custom-Cake-Editor/client/Kiosk_Electron/electron/printer-config.json
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

**Step 3: Add user to lp group**

```bash
sudo usermod -a -G lp user
sudo reboot
```

---

## 🔍 Troubleshooting

### Kiosk doesn't start

```bash
# Check service status
sudo systemctl status goldenmunch-kiosk.service

# Check logs
tail -100 ~/.goldenmunch-logs/startup.log
journalctl -u goldenmunch-kiosk.service -n 100

# Check if X server is running
echo $DISPLAY
xset q
```

### Black screen / Graphics issues

```bash
# Force X11 (already set in startup script)
export ELECTRON_OZONE_PLATFORM_HINT=x11

# Disable GPU
# (already handled in main.js with --disable-gpu flags)
```

### Network issues

```bash
# Test network
ping -c 3 8.8.8.8

# Check WiFi
iwconfig

# Reconnect WiFi
sudo systemctl restart dhcpcd
```

### Cannot load URL

```bash
# Check configured URL
cat ~/.config/goldenmunch-kiosk-electron/kiosk-config.json

# Test URL manually
curl -I https://your-backend.onrender.com

# Check kiosk logs
tail -100 ~/.goldenmunch-logs/kiosk.log
```

### Printer not working

```bash
# Check USB connection
lsusb

# Check printer config
cat /home/user/GoldenMunch_POS-System-With-Custom-Cake-Editor/client/Kiosk_Electron/electron/printer-config.json

# Check user groups
groups user
# Should include: lp, dialout

# Add to groups if missing
sudo usermod -a -G lp,dialout user
```

---

## 📊 Performance Optimization

### Reduce RAM usage

```bash
# Edit /boot/config.txt
sudo nano /boot/config.txt

# Reduce GPU memory (kiosk doesn't need much)
gpu_mem=64

# Save and reboot
sudo reboot
```

### Overclock (Raspberry Pi 4)

```bash
# Edit /boot/config.txt
sudo nano /boot/config.txt

# Add these lines for mild overclock
over_voltage=2
arm_freq=1750

# WARNING: Only if you have good cooling!
# Save and reboot
sudo reboot
```

---

## 🔒 Security Recommendations

### Change default password

```bash
passwd
# Enter new password
```

### Firewall setup

```bash
# Install UFW
sudo apt install -y ufw

# Allow SSH (if needed)
sudo ufw allow 22

# Enable firewall
sudo ufw enable
```

### Disable unused services

```bash
# Disable Bluetooth (if not needed)
sudo systemctl disable bluetooth

# Disable WiFi (if using Ethernet)
sudo rfkill block wifi
```

---

## 📝 Quick Reference

### Start/Stop Commands

```bash
# Start kiosk
sudo systemctl start goldenmunch-kiosk.service

# Stop kiosk
sudo systemctl stop goldenmunch-kiosk.service

# Restart kiosk
sudo systemctl restart goldenmunch-kiosk.service

# View logs
journalctl -u goldenmunch-kiosk.service -f
```

### Log Locations

```
~/.goldenmunch-logs/startup.log    # Startup script logs
~/.goldenmunch-logs/kiosk.log      # Electron kiosk logs
~/.goldenmunch-logs/server.log     # Backend server logs (if running locally)
```

### Config Locations

```
~/.config/goldenmunch-kiosk-electron/kiosk-config.json    # Kiosk URL config
/home/user/GoldenMunch_POS-System-With-Custom-Cake-Editor/client/Kiosk_Electron/electron/printer-config.json    # Printer config
```

---

## 🆘 Support

If you encounter issues:

1. **Check logs** - Start here! Logs show exactly what's wrong
2. **Verify network** - Ensure Raspberry Pi can reach backend server
3. **Test manually** - Run `npm start` manually to see errors
4. **Check config** - Verify all config files are correct

---

**Ready to deploy! 🚀**
