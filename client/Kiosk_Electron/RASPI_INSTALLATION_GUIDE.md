# Raspberry Pi Touch Calibration Installation Guide
## GoldenMunch Kiosk System

---

## 🎯 What This Guide Does

This guide will install the **3-tier touch calibration system** on your Raspberry Pi to fix the inverted touch issue permanently:

1. **X11 Persistent Configuration** - System-level calibration that survives reboots
2. **Startup Calibration** - Applies calibration when kiosk starts
3. **Auto-Recovery Monitor** - Checks every 30 seconds and auto-corrects if touch reverts

---

## 📋 Prerequisites

Before starting, ensure:

- ✅ Raspberry Pi 5 (or compatible model)
- ✅ ILITEK touchscreen connected and detected
- ✅ Raspberry Pi OS (Debian-based) installed
- ✅ SSH access to the Pi OR physical access with keyboard
- ✅ This repository cloned to: `~/GoldenMunch_POS-System-With-Custom-Cake-Editor`

---

## 🚀 Quick Installation (Automated)

### Option 1: One-Command Install (Recommended)

```bash
cd ~/GoldenMunch_POS-System-With-Custom-Cake-Editor/client/Kiosk_Electron/scripts
chmod +x install-touch-calibration.sh
sudo ./install-touch-calibration.sh
```

**This script will:**
1. ✅ Install X11 configuration file
2. ✅ Set correct permissions
3. ✅ Verify touchscreen is detected
4. ✅ Apply calibration immediately
5. ✅ Create backup of old configuration

**After installation:**
- Reboot your Pi: `sudo reboot`
- The touch calibration will be automatically applied on every boot
- The monitor script will keep it correct even if something changes it

---

## 🔧 Manual Installation (Step-by-Step)

If you prefer to install manually or the automated script fails:

### Step 1: Install X11 Persistent Configuration

```bash
# Create X11 config directory if it doesn't exist
sudo mkdir -p /etc/X11/xorg.conf.d/

# Copy the calibration config file
sudo cp ~/GoldenMunch_POS-System-With-Custom-Cake-Editor/client/Kiosk_Electron/scripts/99-touchscreen-calibration.conf /etc/X11/xorg.conf.d/

# Set correct permissions
sudo chmod 644 /etc/X11/xorg.conf.d/99-touchscreen-calibration.conf

# Verify the file was copied
cat /etc/X11/xorg.conf.d/99-touchscreen-calibration.conf
```

**Expected output:**
```
Section "InputClass"
    Identifier "ILITEK Touchscreen Calibration"
    MatchProduct "ILITEK|Touch|Touchscreen"
    ...
```

### Step 2: Make Scripts Executable

```bash
cd ~/GoldenMunch_POS-System-With-Custom-Cake-Editor/client/Kiosk_Electron/scripts

# Make all scripts executable
chmod +x start-kiosk.sh
chmod +x monitor-touch-calibration.sh
chmod +x install-touch-calibration.sh
```

### Step 3: Verify Touchscreen Detection

```bash
# List all input devices
xinput list

# You should see something like:
# ⎜   ↳ ILITEK ILITEK-TP                id=9    [slave  pointer  (2)]
```

**Note the touchscreen ID number** (e.g., `id=9`)

### Step 4: Test Calibration Manually

```bash
# Apply the calibration matrix manually (replace 9 with your touchscreen ID)
xinput set-prop 9 "Coordinate Transformation Matrix" -1 0 1 0 -1 1 0 0 1

# Check current matrix
xinput list-props 9 | grep "Coordinate Transformation Matrix"
```

**Expected output:**
```
Coordinate Transformation Matrix (158):  -1.000000, 0.000000, 1.000000, 0.000000, -1.000000, 1.000000, 0.000000, 0.000000, 1.000000
```

### Step 5: Reboot and Verify

```bash
sudo reboot
```

After reboot:

```bash
# Check if calibration was applied
xinput list-props $(xinput list | grep -i touch | grep -o 'id=[0-9]*' | cut -d= -f2) | grep "Coordinate Transformation Matrix"
```

---

## 🔍 Troubleshooting

### Issue 1: Touch is Still Inverted After Reboot

**Check if X11 config was loaded:**
```bash
ls -la /etc/X11/xorg.conf.d/99-touchscreen-calibration.conf
```

**If file doesn't exist:**
```bash
sudo cp ~/GoldenMunch_POS-System-With-Custom-Cake-Editor/client/Kiosk_Electron/scripts/99-touchscreen-calibration.conf /etc/X11/xorg.conf.d/
sudo chmod 644 /etc/X11/xorg.conf.d/99-touchscreen-calibration.conf
sudo reboot
```

### Issue 2: Touchscreen Not Detected

**Check device name:**
```bash
xinput list
ls /dev/input/by-id/ | grep -i touch
```

**If touchscreen has different name** (not ILITEK):
```bash
# Edit the X11 config to match your device
sudo nano /etc/X11/xorg.conf.d/99-touchscreen-calibration.conf

# Change this line to match your device name:
#   MatchProduct "ILITEK|Touch|Touchscreen"
# To something like:
#   MatchProduct "eGalax|FT5406|YourDeviceName"
```

### Issue 3: Touch Reverts After Some Time

**This is why the monitor script exists!**

Check if monitor is running:
```bash
ps aux | grep monitor-touch-calibration
```

**If not running:**
```bash
# Start it manually
cd ~/GoldenMunch_POS-System-With-Custom-Cake-Editor/client/Kiosk_Electron/scripts
bash monitor-touch-calibration.sh &
```

**Check monitor logs:**
```bash
tail -f ~/.goldenmunch-logs/touch-calibration-monitor.log
```

### Issue 4: X11 Config Not Being Applied

**Force X11 mode (disable Wayland):**
```bash
sudo nano /etc/gdm3/custom.conf

# Uncomment this line:
WaylandEnable=false

# Save and reboot
sudo reboot
```

---

## 📊 Verification Checklist

After installation, verify all components:

- [ ] X11 config file exists: `/etc/X11/xorg.conf.d/99-touchscreen-calibration.conf`
- [ ] Touchscreen detected: `xinput list | grep -i touch`
- [ ] Calibration applied: `xinput list-props [ID] | grep "Coordinate Transformation Matrix"`
- [ ] Matrix is correct: `-1.000000, 0.000000, 1.000000, 0.000000, -1.000000, 1.000000...`
- [ ] Touch works correctly (not inverted)
- [ ] Monitor script running: `ps aux | grep monitor-touch-calibration`
- [ ] Kiosk script executable: `ls -l ~/GoldenMunch_POS-System-With-Custom-Cake-Editor/client/Kiosk_Electron/scripts/start-kiosk.sh`

---

## 📝 How It Works

### Component 1: X11 Configuration (System-Level)
- **File**: `/etc/X11/xorg.conf.d/99-touchscreen-calibration.conf`
- **Runs**: On every X server start (boot, reboot, X restart)
- **Purpose**: Persistent calibration that survives reboots

### Component 2: Startup Script
- **File**: `start-kiosk.sh`
- **Runs**: When kiosk starts
- **Purpose**: Ensures calibration is applied after Chromium loads

### Component 3: Auto-Recovery Monitor
- **File**: `monitor-touch-calibration.sh`
- **Runs**: Continuously in background (every 30 seconds)
- **Purpose**: Detects and fixes calibration if it gets reset

**Together, these 3 components ensure touch calibration is ALWAYS correct!**

---

## 🔄 Starting the Kiosk

Once installed, start the kiosk:

```bash
cd ~/GoldenMunch_POS-System-With-Custom-Cake-Editor/client/Kiosk_Electron/scripts
./start-kiosk.sh
```

The script will:
1. Wait for X server
2. Wait for network
3. Disable screen blanking
4. Set portrait mode
5. Detect touchscreen
6. Start Chromium kiosk
7. Apply touch calibration
8. **Start auto-recovery monitor**

---

## 📞 Support

If touch is still inverted after following this guide:

1. **Check logs:**
   ```bash
   # Kiosk startup log
   tail -f ~/.goldenmunch-logs/startup.log

   # Touch monitor log
   tail -f ~/.goldenmunch-logs/touch-calibration-monitor.log

   # Kiosk output
   tail -f ~/.goldenmunch-logs/kiosk.log
   ```

2. **Verify X11 config:**
   ```bash
   cat /etc/X11/xorg.conf.d/99-touchscreen-calibration.conf
   ```

3. **Check X server logs:**
   ```bash
   cat /var/log/Xorg.0.log | grep -i touch
   ```

4. **Test calibration manually:**
   ```bash
   xinput set-prop [TOUCH_ID] "Coordinate Transformation Matrix" -1 0 1 0 -1 1 0 0 1
   ```

---

## ✅ Success Indicators

You'll know the installation was successful when:

1. ✅ Touch works correctly (not inverted) immediately after boot
2. ✅ Touch stays correct even after hours of use
3. ✅ Monitor log shows regular checks: `tail -f ~/.goldenmunch-logs/touch-calibration-monitor.log`
4. ✅ No "matrix mismatch" warnings in monitor log
5. ✅ Kiosk starts automatically with correct touch

---

## 🎉 Done!

Your Raspberry Pi touch calibration is now permanently fixed with:
- ✅ Persistent X11 configuration
- ✅ Startup calibration
- ✅ Auto-recovery monitoring

Touch should work correctly and stay correct indefinitely!
