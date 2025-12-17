# 🖥️ GoldenMunch POS Kiosk Setup Guide

Complete guide for setting up the GoldenMunch POS system as a kiosk on Raspberry Pi.

---

## 📋 Prerequisites

- **Hardware:** Raspberry Pi 4/5 (4GB+ RAM recommended)
- **OS:** Raspberry Pi OS (Debian 13/Trixie) with Wayland/Labwc
- **Storage:** 16GB+ SD card
- **Network:** Active internet connection
- **Node.js:** Version 18+ (should be pre-installed)

---

## 🚀 Quick Start

### Step 1: Run the Automated Setup Script

```bash
cd ~/GoldenMunch_POS-System-With-Custom-Cake-Editor
./setup-kiosk-autostart.sh
```

This script will:
- ✅ Install required packages (Chromium, wlopm, unclutter)
- ✅ Create kiosk startup scripts
- ✅ Configure Labwc autostart
- ✅ Set up systemd services
- ✅ Create helper scripts (start, stop, restart, logs)
- ✅ Check and install npm dependencies

### Step 2: Enable Auto-Login

After running the setup script, configure auto-login:

```bash
sudo raspi-config
```

**Navigate to:**
1. **System Options** → **Boot / Auto Login**
2. Select: **Desktop Autologin** (Desktop GUI, automatically logged in)
3. Press **OK**
4. Select **Finish** and reboot

### Step 3: Test Before Reboot

Test the kiosk manually before rebooting:

```bash
./start-kiosk.sh
```

If everything works correctly, reboot to test autostart:

```bash
sudo reboot
```

---

## 📁 Files Created by Setup Script

After running the setup script, these files will be created in your home directory:

| File | Description |
|------|-------------|
| `~/start-kiosk.sh` | Start the kiosk (backend + frontend + browser) |
| `~/stop-kiosk.sh` | Stop all kiosk processes |
| `~/restart-kiosk.sh` | Restart the kiosk |
| `~/view-kiosk-logs.sh` | View all kiosk logs |
| `~/.config/labwc/autostart` | Labwc autostart configuration |
| `~/.config/systemd/user/goldenmunch-kiosk.service` | Systemd service file |

---

## 🎮 Quick Commands

### Start/Stop/Restart

```bash
# Start kiosk manually
./start-kiosk.sh

# Stop kiosk
./stop-kiosk.sh

# Restart kiosk
./restart-kiosk.sh
```

### View Logs

```bash
# View all logs at once
./view-kiosk-logs.sh

# View individual logs
tail -f ~/kiosk-startup.log    # Main kiosk startup log
tail -f ~/server-output.log    # Backend server output
tail -f ~/frontend-output.log  # Frontend output
tail -f ~/chromium-output.log  # Browser output
```

### Check Service Status

```bash
# Check systemd service status
systemctl --user status goldenmunch-kiosk

# View systemd service logs
journalctl --user -f -u goldenmunch-kiosk

# Restart systemd service
systemctl --user restart goldenmunch-kiosk
```

---

## ⚙️ Advanced Configuration

### Modify Kiosk Startup Script

The main startup script is located at `~/start-kiosk.sh`. You can edit it to:

```bash
nano ~/start-kiosk.sh
```

**Common modifications:**
- Change wait times between starting services
- Modify browser flags
- Add custom environment variables
- Change the frontend URL

### Chromium Browser Flags

The startup script uses these flags for kiosk mode:

```bash
--kiosk                          # Full-screen kiosk mode
--noerrdialogs                   # No error dialogs
--disable-infobars               # No info bars
--no-first-run                   # Skip first run wizard
--disable-session-crashed-bubble # No crash notifications
--start-fullscreen               # Start in fullscreen
--ozone-platform=wayland         # Use Wayland (required for Labwc)
--enable-features=UseOzonePlatform # Enable Ozone platform
--app=http://localhost:3000      # The URL to load
```

### Change Kiosk URL

Edit `~/start-kiosk.sh` and change the last line:

```bash
--app=http://localhost:3000  # Change this URL
```

### Disable Screen Blanking Permanently

Add to `/boot/firmware/config.txt` (requires sudo):

```bash
sudo nano /boot/firmware/config.txt
```

Add at the end:

```ini
# Disable screen blanking
hdmi_blanking=1
```

---

## 🔧 Troubleshooting

### Issue: Kiosk doesn't start on boot

**Solution 1:** Check auto-login is enabled
```bash
sudo raspi-config
# System Options → Boot / Auto Login → Desktop Autologin
```

**Solution 2:** Check Labwc autostart file
```bash
cat ~/.config/labwc/autostart
# Should contain: /home/YOUR_USER/start-kiosk.sh &
```

**Solution 3:** Check systemd service
```bash
systemctl --user status goldenmunch-kiosk
# Should show "active (running)"
```

### Issue: Browser shows "Can't reach this page"

**Cause:** Frontend or backend not started properly

**Solution:**
```bash
# Check if processes are running
ps aux | grep node
ps aux | grep chromium

# Check logs
./view-kiosk-logs.sh

# Restart kiosk
./restart-kiosk.sh
```

### Issue: Black screen after boot

**Cause:** Script might be starting too early

**Solution:** Increase wait time in `~/start-kiosk.sh`:

```bash
nano ~/start-kiosk.sh
# Change: sleep 10
# To:     sleep 20
```

### Issue: "Permission denied" errors

**Solution:** Ensure scripts are executable:

```bash
chmod +x ~/start-kiosk.sh
chmod +x ~/stop-kiosk.sh
chmod +x ~/restart-kiosk.sh
chmod +x ~/view-kiosk-logs.sh
chmod +x ~/.config/labwc/autostart
```

### Issue: npm dependencies missing

**Solution:** Manually install dependencies:

```bash
cd ~/GoldenMunch_POS-System-With-Custom-Cake-Editor/server
npm install

cd ~/GoldenMunch_POS-System-With-Custom-Cake-Editor/client/Kiosk_Web
npm install
```

### Issue: Port 3000 already in use

**Solution:** Kill existing processes:

```bash
# Find process using port 3000
lsof -i :3000

# Kill it
kill -9 <PID>

# Or use the stop script
./stop-kiosk.sh
```

---

## 🎯 Performance Optimization

### Increase GPU Memory (Optional)

Edit boot config:

```bash
sudo nano /boot/firmware/config.txt
```

Add:

```ini
# Increase GPU memory for better browser performance
gpu_mem=256
```

### Overclock Raspberry Pi 4/5 (Optional)

**⚠️ Warning:** Overclocking may void warranty and requires good cooling!

```ini
# Add to /boot/firmware/config.txt
over_voltage=2
arm_freq=1800
```

### Reduce Boot Time

Disable unnecessary services:

```bash
# Disable Bluetooth (if not needed)
sudo systemctl disable bluetooth

# Disable WiFi (if using ethernet)
sudo rfkill block wifi
```

---

## 🔄 Update and Maintenance

### Update the Application

```bash
cd ~/GoldenMunch_POS-System-With-Custom-Cake-Editor

# Stop kiosk
./stop-kiosk.sh

# Pull latest changes
git pull

# Update dependencies
cd server && npm install
cd ../client/Kiosk_Web && npm install

# Restart kiosk
cd ~
./restart-kiosk.sh
```

### Clear Browser Cache

The kiosk runs in a clean state each time, but to manually clear:

```bash
rm -rf ~/.config/chromium/Default/Cache/*
```

### Reset Kiosk to Default

```bash
# Remove all kiosk files
rm -rf ~/start-kiosk.sh ~/stop-kiosk.sh ~/restart-kiosk.sh ~/view-kiosk-logs.sh
rm -rf ~/.config/labwc/autostart
rm -rf ~/.config/systemd/user/goldenmunch-kiosk.service

# Rerun setup script
cd ~/GoldenMunch_POS-System-With-Custom-Cake-Editor
./setup-kiosk-autostart.sh
```

---

## 📊 Monitoring

### Check System Resources

```bash
# CPU and memory usage
top

# Disk usage
df -h

# Temperature (important for Pi)
vcgencmd measure_temp
```

### Monitor Logs in Real-Time

```bash
# Watch all logs
watch -n 2 './view-kiosk-logs.sh'

# Or monitor specific log
tail -f ~/kiosk-startup.log
```

---

## 🆘 Emergency Access

### Access Terminal While Kiosk is Running

**Method 1:** SSH from another computer
```bash
ssh YOUR_USER@YOUR_PI_IP
```

**Method 2:** Use TTY (on the Pi itself)
- Press `Ctrl + Alt + F2` to open TTY2
- Login with your credentials
- Stop kiosk: `./stop-kiosk.sh`
- Return to GUI: `Ctrl + Alt + F1`

### Disable Autostart Temporarily

Boot into single-user mode or edit autostart:

```bash
# SSH into the Pi
ssh YOUR_USER@YOUR_PI_IP

# Disable systemd service
systemctl --user disable goldenmunch-kiosk

# Or rename autostart file
mv ~/.config/labwc/autostart ~/.config/labwc/autostart.disabled

# Reboot
sudo reboot
```

---

## 📝 Notes

1. **First Boot:** The first boot after setup may take 2-3 minutes as npm builds are created
2. **Updates:** Always test updates on a separate Pi before deploying to production
3. **Backups:** Regularly backup your SD card using tools like `dd` or Win32DiskImager
4. **Security:** Change default passwords and keep the OS updated
5. **Power:** Use a quality power supply (5V 3A minimum for Pi 4/5)

---

## 🔗 Useful Links

- **Raspberry Pi Documentation:** https://www.raspberrypi.com/documentation/
- **Labwc Documentation:** https://github.com/labwc/labwc
- **Next.js Documentation:** https://nextjs.org/docs
- **Node.js Documentation:** https://nodejs.org/docs

---

## 📞 Support

If you encounter issues not covered in this guide:

1. Check the logs: `./view-kiosk-logs.sh`
2. Verify all services are running: `ps aux | grep node`
3. Check system resources: `top` and `vcgencmd measure_temp`
4. Review Raspberry Pi system logs: `journalctl -xe`

---

**Last Updated:** December 2025
**Version:** 1.0.0
**Tested On:** Raspberry Pi 4/5 with Debian 13 (Trixie) / Wayland / Labwc
