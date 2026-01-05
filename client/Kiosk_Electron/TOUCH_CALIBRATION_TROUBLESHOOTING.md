# Touch Calibration Troubleshooting Guide
## For GoldenMunch Raspberry Pi Kiosk

---

## ⚡ **RASPBERRY PI 5 + ILITEK TOUCHSCREEN - FINAL FIX**

### 🔥 The Problem
On **Raspberry Pi 5 + Bookworm + X11 + ILITEK touchscreens**, ALL xinput matrices fail because:
- Pi 5 uses **libinput first** in the input stack
- ILITEK touchscreens ignore runtime X11 matrices
- xinput applies **after libinput** → changes are ignored

### ✅ The ONLY Working Solution: libinput Calibration

This fix applies touch rotation at the **libinput layer** (before X11), not at the X11 layer.

#### Step 1: Confirm Your Touch Device

```bash
libinput list-devices
```

Look for output like:
```
Device:           ILITEK ILITEK-TP
Kernel:           /dev/input/eventX
```

Note: If you don't see `ILITEK ILITEK-TP`, your device name may be different. Use whatever name appears.

#### Step 2: Create libinput Calibration Override

```bash
sudo nano /etc/X11/xorg.conf.d/99-touchscreen-calibration.conf
```

Paste this **EXACT CONFIG** for **Portrait Right** (90° clockwise):

```xorg
Section "InputClass"
    Identifier "ILITEK Touch Portrait Right"
    MatchProduct "ILITEK ILITEK-TP"
    MatchIsTouchscreen "on"
    Driver "libinput"
    Option "CalibrationMatrix" "0 1 0 -1 0 1 0 0 1"
EndSection
```

**Alternative: Use our pre-made config file:**
```bash
cd ~/GoldenMunch_POS-System-With-Custom-Cake-Editor
sudo cp config/99-touchscreen-calibration.conf /etc/X11/xorg.conf.d/
```

Save and exit (Ctrl+X, then Y, then Enter).

#### Step 3: REMOVE All xinput Hacks

**IMPORTANT:** Do NOT rotate touch with xinput anymore.

Delete or comment out from `~/.xprofile` or any startup scripts:
```bash
# xinput set-prop ...
# xinput map-to-output ...
```

Keep ONLY the xrandr screen rotation:
```bash
xrandr --output HDMI-1 --rotate right
```

#### Step 4: Reboot

```bash
sudo reboot
```

### ✅ WHY THIS WORKS (and xinput doesn't)

| Method | Layer | Result on Pi 5 |
|--------|-------|----------------|
| **xinput** | X11 runtime | ❌ **Ignored** - applies after libinput |
| **libinput CalibrationMatrix** | libinput (pre-X11) | ✅ **Works** - applies before X11 |

**Technical Details:**
- Pi 5 uses **libinput first** in the input stack
- ILITEK touchscreens bind to libinput early
- xinput transformations are applied **too late** in the pipeline
- **Xorg CalibrationMatrix** is read by libinput during initialization → **WORKS**

This is a known Pi 5 + ILITEK behavior documented in libinput and X.Org documentation.

### 🔍 Verify It's Working

```bash
# Check if config is loaded
grep -r "ILITEK" /var/log/Xorg.0.log

# Should see:
# [libinput] ILITEK ILITEK-TP: Applying CalibrationMatrix
```

### 📝 Other Orientations

See comments in `config/99-touchscreen-calibration.conf` for matrices for:
- Portrait Left (270°)
- Landscape Inverted (180°)
- Normal Landscape (0°)

---

## 🔴 OLDER ISSUE: Touch Matrix Reverts After Minutes/Hours

**Note:** This section applies to **older Pi models** or **non-ILITEK** touchscreens where xinput DOES work.

If your touch calibration keeps reverting from Matrix 6 back to inverted state after a few minutes to an hour, this means the **monitor script is not running** or **not persisting**.

---

## 🔍 Step 1: Check if Monitor Script is Running

SSH into your Raspberry Pi and run:

```bash
ps aux | grep monitor-touch-calibration
```

**Expected output:**
```
pi   12345  0.0  0.1  /bin/bash /home/pi/GoldenMunch_POS-System-With-Custom-Cake-Editor/client/Kiosk_Electron/scripts/monitor-touch-calibration.sh
```

**If you see NOTHING or only the `grep` command itself:**
❌ **The monitor script is NOT running!**

---

## 🔧 Step 2: Check Monitor Logs

```bash
tail -f ~/.goldenmunch-logs/touch-calibration-monitor.log
```

**If file doesn't exist or is empty:**
❌ **The monitor script has never started**

**If file exists with old timestamps:**
❌ **The monitor script started but died**

---

## ✅ Solution 1: Create a Systemd Service (RECOMMENDED)

This ensures the monitor script runs automatically and restarts if it crashes.

### Create the Systemd Service File:

```bash
sudo nano /etc/systemd/system/touch-monitor.service
```

**Paste this content** (replace `your-username` with your actual username, e.g., `pi`):

```ini
[Unit]
Description=GoldenMunch Touch Calibration Monitor
After=graphical.target
Wants=graphical.target

[Service]
Type=simple
User=your-username
Environment="DISPLAY=:0"
Environment="XAUTHORITY=/home/your-username/.Xauthority"
ExecStart=/bin/bash /home/your-username/GoldenMunch_POS-System-With-Custom-Cake-Editor/client/Kiosk_Electron/scripts/monitor-touch-calibration.sh
Restart=always
RestartSec=10

[Install]
WantedBy=graphical.target
```

**Save and exit:** Press `Ctrl+X`, then `Y`, then `Enter`

### Enable and Start the Service:

```bash
# Reload systemd to recognize new service
sudo systemctl daemon-reload

# Enable service to start on boot
sudo systemctl enable touch-monitor.service

# Start service now
sudo systemctl start touch-monitor.service

# Check status
sudo systemctl status touch-monitor.service
```

**Expected output:**
```
● touch-monitor.service - GoldenMunch Touch Calibration Monitor
     Loaded: loaded (/etc/systemd/system/touch-monitor.service; enabled)
     Active: active (running) since ...
```

### Verify It's Working:

```bash
# Check process
ps aux | grep monitor-touch-calibration

# Check logs
journalctl -u touch-monitor.service -f
```

---

## ✅ Solution 2: Add to Kiosk Startup (Alternative)

If you don't want a separate service, ensure the monitor starts with the kiosk.

### Check if start-kiosk.sh is launching the monitor:

```bash
cd ~/GoldenMunch_POS-System-With-Custom-Cake-Editor/client/Kiosk_Electron/scripts
grep -A 10 "monitor-touch-calibration" start-kiosk.sh
```

**You should see:**
```bash
bash "$MONITOR_SCRIPT" &
MONITOR_PID=$!
```

### If missing, ensure you're using the latest version:

```bash
cd ~/GoldenMunch_POS-System-With-Custom-Cake-Editor
git pull origin main  # or your branch
cd client/Kiosk_Electron/scripts
chmod +x *.sh
```

---

## ✅ Solution 3: Manual Testing

Start the monitor script manually and watch it work:

```bash
cd ~/GoldenMunch_POS-System-With-Custom-Cake-Editor/client/Kiosk_Electron/scripts

# Run in foreground to see output
bash monitor-touch-calibration.sh
```

**Expected output:**
```
[2026-01-04 10:30:00] === Touch Calibration Monitor Started ===
[2026-01-04 10:30:00] Check interval: 30s
[2026-01-04 10:30:00] Target matrix: -1 0 1 0 -1 1 0 0 1
[2026-01-04 10:30:00] Applying initial calibration...
[2026-01-04 10:30:02] Starting continuous monitoring...
```

**Leave it running for 5 minutes and verify:**
```bash
# In another terminal
xinput list-props $(xinput list | grep -i touch | grep -o 'id=[0-9]*' | cut -d= -f2) | grep "Coordinate Transformation Matrix"
```

**Should show:**
```
Coordinate Transformation Matrix (158):  -1.000000, 0.000000, 1.000000, 0.000000, -1.000000, 1.000000, 0.000000, 0.000000, 1.000000
```

---

## 🔍 Step 3: Check for Competing Touch Calibration

Sometimes other services or scripts are resetting the calibration.

### Check for other xinput commands:

```bash
# Check systemd services
systemctl list-units | grep -i touch
systemctl list-units | grep -i input
systemctl list-units | grep -i calib

# Check running processes
ps aux | grep xinput

# Check autostart files
ls ~/.config/autostart/
cat ~/.config/lxsession/LXDE-pi/autostart 2>/dev/null || echo "File not found"
```

**If you find any other touch calibration services:**
```bash
# Disable them
sudo systemctl disable [service-name]
sudo systemctl stop [service-name]
```

---

## 🔍 Step 4: Check X11 Configuration

Verify the X11 config is installed:

```bash
cat /etc/X11/xorg.conf.d/99-touchscreen-calibration.conf
```

**Expected output:**
```
Section "InputClass"
    Identifier "ILITEK Touchscreen Calibration"
    MatchProduct "ILITEK|Touch|Touchscreen"
    ...
    Option "CalibrationMatrix" "-1 0 1 0 -1 1 0 0 1"
    ...
EndSection
```

**If file doesn't exist:**
```bash
cd ~/GoldenMunch_POS-System-With-Custom-Cake-Editor/client/Kiosk_Electron/scripts
bash install-touch-calibration.sh
```

---

## 🔍 Step 5: Check Wayland vs X11

Wayland can interfere with X11 touch calibration.

```bash
echo $XDG_SESSION_TYPE
```

**Should show:** `x11`

**If it shows `wayland`:**

```bash
# Disable Wayland
sudo nano /etc/gdm3/custom.conf

# Uncomment this line:
WaylandEnable=false

# Save and reboot
sudo reboot
```

---

## 📊 Complete Diagnostic Checklist

Run all these commands and save the output:

```bash
# 1. Check touch device
xinput list | grep -i touch

# 2. Check current matrix
xinput list-props $(xinput list | grep -i touch | grep -o 'id=[0-9]*' | cut -d= -f2) | grep "Coordinate Transformation Matrix"

# 3. Check X11 config
ls -la /etc/X11/xorg.conf.d/99-touchscreen-calibration.conf

# 4. Check monitor process
ps aux | grep monitor-touch-calibration

# 5. Check monitor service
systemctl status touch-monitor.service

# 6. Check monitor logs
tail -20 ~/.goldenmunch-logs/touch-calibration-monitor.log

# 7. Check session type
echo $XDG_SESSION_TYPE

# 8. Check kiosk service
systemctl status goldenmunch-kiosk.service

# 9. Check kiosk logs
tail -20 ~/.goldenmunch-logs/startup.log
```

---

## 🎯 Most Common Causes

| Issue | Cause | Fix |
|-------|-------|-----|
| **Monitor not running** | Service not created/started | Create systemd service (Solution 1) |
| **Monitor crashes** | Script error or X11 not available | Check logs: `journalctl -u touch-monitor.service` |
| **Wayland enabled** | Using Wayland instead of X11 | Disable Wayland in GDM config |
| **X11 config missing** | Installation incomplete | Run `install-touch-calibration.sh` |
| **Competing calibration** | Other service resetting touch | Find and disable competing services |
| **Wrong DISPLAY** | Monitor can't access X server | Verify `DISPLAY=:0` in service file |

---

## 🚀 Quick Fix (Try This First)

```bash
# 1. Stop kiosk
sudo systemctl stop goldenmunch-kiosk.service

# 2. Create and start monitor service
sudo nano /etc/systemd/system/touch-monitor.service
# (paste the service file content from Solution 1)

sudo systemctl daemon-reload
sudo systemctl enable touch-monitor.service
sudo systemctl start touch-monitor.service

# 3. Verify monitor is running
systemctl status touch-monitor.service
ps aux | grep monitor-touch-calibration

# 4. Restart kiosk
sudo systemctl start goldenmunch-kiosk.service

# 5. Watch monitor logs
tail -f ~/.goldenmunch-logs/touch-calibration-monitor.log
```

---

## ✅ Success Indicators

You'll know the fix worked when:

1. ✅ Monitor service shows "active (running)": `systemctl status touch-monitor.service`
2. ✅ Monitor logs show regular checks every 30 seconds
3. ✅ Touch stays calibrated for hours/days without reverting
4. ✅ No "matrix mismatch" warnings in logs (or they auto-fix immediately)

---

## 📞 Still Not Working?

If touch still reverts after following all steps above:

1. **Collect diagnostic output:**
   ```bash
   cd ~
   bash ~/GoldenMunch_POS-System-With-Custom-Cake-Editor/client/Kiosk_Electron/scripts/collect-diagnostics.sh > touch-diagnostics.txt
   ```

2. **Check the diagnostics file:**
   ```bash
   cat ~/touch-diagnostics.txt
   ```

3. Share the diagnostics output with support.

---

## 💡 Pro Tip

The **systemd service** (Solution 1) is the MOST RELIABLE method because:
- ✅ Starts automatically on boot
- ✅ Restarts if it crashes
- ✅ Runs independently of kiosk
- ✅ Easy to monitor with `systemctl status`
- ✅ Logs to journalctl for debugging

Use this method for production systems!
