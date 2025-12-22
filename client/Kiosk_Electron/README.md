# 🖥️ GoldenMunch Kiosk - Electron Client

**Lightweight Electron wrapper for the GoldenMunch Kiosk application.**

This is the **Electron client** that runs on kiosk devices (Raspberry Pi, Windows PC, etc.). It loads the Next.js web application from a remote URL and provides local hardware access (thermal printer).

---

## 📦 What This Project Contains

This project contains **only** the Electron client with:

- **Kiosk Mode**: Fullscreen, prevents user exit in production
- **Remote URL Loading**: Loads Next.js app from configurable URL
- **Settings Panel**: Ctrl+Shift+C to configure remote URL
- **Thermal Printer Integration**: USB/Network/Serial printer support
- **Power Management**: Prevents screen sleep
- **Hardware Optimizations**: GPU disabled for Raspberry Pi Wayland compatibility

**This project does NOT contain:**
- ❌ Next.js code (see `../Kiosk_Web/`)
- ❌ UI components (see `../Kiosk_Web/`)
- ❌ API services (see `../Kiosk_Web/`)

---

## 🏗️ Architecture

```
┌─────────────────────────────────────┐
│  ELECTRON CLIENT (This Project)    │
│  ├─ Loads remote Next.js URL        │
│  ├─ Thermal printer (local HW)      │
│  ├─ Settings panel (Ctrl+Shift+C)  │
│  └─ Kiosk mode (fullscreen)         │
└────────────┬────────────────────────┘
             │
             │ HTTPS
             ▼
┌─────────────────────────────────────┐
│  NEXT.JS WEB APP (Kiosk_Web)       │
│  https://your-app.onrender.com     │
└─────────────────────────────────────┘
```

---

## 📂 Project Structure

```
Kiosk_Electron/
├── electron/
│   ├── main.js                # Main process (entry point)
│   ├── preload.js             # Printer IPC bridge
│   ├── settings-preload.js    # Settings IPC bridge
│   ├── settings-manager.js    # URL configuration manager
│   ├── settings.html          # Settings UI (Ctrl+Shift+C)
│   ├── splash.html            # Splash screen
│   ├── printer.js             # Thermal printer service
│   └── printer-config.json    # Printer configuration
│
├── package.json               # Electron dependencies only
├── README.md                  # This file
└── PRINTER_SETUP.md           # Printer configuration guide
```

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

**Note**: This only installs Electron and printer dependencies. No Next.js dependencies!

### 2. Development Mode

```bash
# Run Electron in development mode
npm run dev

# Or
npm start
```

**On first launch:**
- Settings panel opens automatically (no URL configured)
- Or press `Ctrl+Shift+C` to open settings
- Enter the URL of your Next.js app (e.g., `http://localhost:3002` for local dev)

### 3. Configure Remote URL

**For local development** (Next.js running locally):
- URL: `http://localhost:3002`
- Make sure `Kiosk_Web` is running: `cd ../Kiosk_Web && npm run dev`

**For production** (Next.js on Render.com):
- URL: `https://your-app.onrender.com`
- Get URL from Render dashboard after deploying `Kiosk_Web`

### 4. Build for Distribution

```bash
# Linux (Raspberry Pi, Ubuntu, Debian)
npm run build:linux

# Windows
npm run build:win

# macOS
npm run build:mac

# Raspberry Pi (ARM)
npm run build:rpi
```

**Output:**
- Linux: `dist/goldenmunch-kiosk-electron_1.0.0_amd64.deb` or `.AppImage`
- Windows: `dist/GoldenMunch Kiosk Setup.exe`
- macOS: `dist/GoldenMunch Kiosk.dmg`

---

## ⚙️ Configuration

### Settings Panel (Ctrl+Shift+C)

Press `Ctrl+Shift+C` anytime to open the settings panel:

- **Enter URL**: Configure the Next.js app URL
- **Test Connection**: Verify URL is reachable
- **Save & Reload**: Save settings and reload app

### Settings File Location

Configuration is stored in:
- **Linux**: `~/.config/goldenmunch-kiosk-electron/kiosk-config.json`
- **Windows**: `%APPDATA%\goldenmunch-kiosk-electron\kiosk-config.json`
- **macOS**: `~/Library/Application Support/goldenmunch-kiosk-electron/kiosk-config.json`

**Example config:**
```json
{
  "appUrl": "https://goldenmunch-kiosk.onrender.com",
  "lastUpdated": "2025-01-15T10:30:00.000Z"
}
```

### Environment Variables (Optional)

Instead of using the settings panel, you can set environment variables:

```bash
# Linux/macOS
export KIOSK_APP_URL=https://golden-munch-pos.vercel.app
export NODE_ENV=production

# Windows
set KIOSK_APP_URL=https://golden-munch-pos.vercel.app
set NODE_ENV=production
```

**Priority:**
1. Settings Panel Configuration (highest)
2. Environment Variable `KIOSK_APP_URL`
3. Development Default (`http://localhost:3002` in dev mode)
4. Production Default (`https://golden-munch-pos.vercel.app` in production)

---

## 🖨️ Printer Configuration

The Electron client handles thermal printer communication via local hardware access.

### Configure Printer

Edit `electron/printer-config.json`:

```json
{
  "printerType": "usb",
  "usb": {
    "vid": "0x0416",
    "pid": "0x5011"
  },
  "network": {
    "address": "192.168.1.100",
    "port": 9100
  },
  "settings": {
    "width": 48,
    "encoding": "GB18030"
  }
}
```

**See `PRINTER_SETUP.md` for detailed printer configuration.**

### Printer IPC APIs

The Next.js app can call printer functions via IPC:

```javascript
// In Next.js app (Kiosk_Web)
window.electron.printer.printReceipt(orderData);
window.electron.printer.printTest();
window.electron.printer.getStatus();
```

**Note**: These APIs only work when running inside Electron, not in a regular browser.

---

## 🎹 Keyboard Shortcuts

| Shortcut | Action | Available In |
|----------|--------|--------------|
| `Ctrl+Shift+C` | Open Settings Panel | Always |
| `Ctrl+Shift+I` | Open DevTools | Development Only |
| `F11` | Toggle Fullscreen | Development Only |
| `ESC` | Exit Fullscreen | Development Only |

**Production**: Kiosk mode prevents all exit shortcuts

---

## 🔧 Development Tips

### Test with Local Next.js

```bash
# Terminal 1: Start Next.js (in Kiosk_Web)
cd ../Kiosk_Web
npm run dev

# Terminal 2: Start Electron (in Kiosk_Electron)
cd ../Kiosk_Electron
npm run dev

# In settings panel: Enter http://localhost:3002
```

### Test with Remote Next.js

```bash
# Just run Electron
npm run dev

# In settings panel: Enter your Render URL
# Example: https://goldenmunch-kiosk.onrender.com
```

### Debug Electron

```bash
# Run with DevTools open
NODE_ENV=development npm start

# Check console logs in terminal
# Electron logs appear in terminal, not browser DevTools
```

---

## 📦 Deployment

### Step 1: Build Electron

```bash
# For your target platform
npm run build:linux  # or build:win, build:mac
```

### Step 2: Install on Kiosk Device

**Linux (Debian/Ubuntu/Raspberry Pi):**
```bash
# Transfer .deb file
scp dist/goldenmunch-kiosk-electron_1.0.0_amd64.deb pi@kiosk:/tmp/

# Install
ssh pi@kiosk
sudo dpkg -i /tmp/goldenmunch-kiosk-electron_1.0.0_amd64.deb
```

**Or use AppImage (no installation):**
```bash
chmod +x dist/goldenmunch-kiosk-electron-1.0.0.AppImage
./dist/goldenmunch-kiosk-electron-1.0.0.AppImage
```

**Windows:**
```bash
# Run the installer
dist/GoldenMunch Kiosk Setup.exe
```

### Step 3: Configure URL

1. Launch the app
2. Settings panel opens automatically (first time)
3. Enter your Render URL: `https://your-app.onrender.com`
4. Click "Test URL" → "Save & Reload"
5. App loads from remote Next.js

---

## 🐛 Troubleshooting

### Issue: Settings Panel Won't Open

**Solution:**
- Ensure shortcut is not blocked by OS
- Manually edit config file (see Settings File Location)
- Check terminal logs for errors

### Issue: Cannot Load URL

**Check:**
1. Internet connection on kiosk device
2. URL is correct (no trailing slash)
3. Next.js app is deployed and running
4. Firewall allows HTTPS connections

**Logs:**
```bash
# Check Electron logs in terminal
# Look for "Loading URL:" and "FAILED TO LOAD URL" messages
```

### Issue: Printer Not Working

**Check:**
1. Printer is connected (USB/Network)
2. Printer config: `electron/printer-config.json`
3. Printer status: `window.electron.printer.getStatus()` (in DevTools)
4. See `PRINTER_SETUP.md`

### Issue: Black Screen / Won't Start

**Linux/Raspberry Pi:**
```bash
# Graphics issues - force X11
export ELECTRON_OZONE_PLATFORM_HINT=x11

# Or run with flags
npm start -- --ozone-platform=x11 --disable-gpu
```

**Windows:**
```bash
# Disable hardware acceleration
npm start
```

---

## 🔐 Security

### Enabled Security Features

✅ **Context Isolation**: Renderer cannot access Node.js directly
✅ **Node Integration Disabled**: No `require()` in renderer
✅ **Remote Module Disabled**: No remote access
✅ **Preload Script**: Safe IPC bridge for printer
✅ **Sandboxed Renderer**: Renderer runs in sandbox

### IPC Exposed to Renderer

Only these safe APIs are exposed to the Next.js app:

```javascript
window.electron.printer.printReceipt(orderData)
window.electron.printer.printTest()
window.electron.printer.printDailyReport(reportData)
window.electron.printer.getStatus()
```

**No other Node.js access is available to the renderer.**

---

## 📊 Dependencies

### Runtime Dependencies

- `electron` - Electron framework
- `escpos` + plugins - Thermal printer support
- `serialport` - Serial port communication
- `usb` - USB device access

### Build Dependencies

- `electron-builder` - Electron packaging
- `electron-devtools-installer` - React DevTools (dev only)

**Total size**: ~50MB (compared to 500MB+ with bundled Next.js)

---

## 🔗 Related Projects

- **Kiosk_Web** (`../Kiosk_Web/`) - Next.js web application UI
- **Backend API** - Separate API server on Render.com

---

## 📖 Additional Documentation

- `PRINTER_SETUP.md` - Thermal printer configuration guide
- `../Kiosk_Web/README.md` - Next.js web app documentation
- `../Kiosk_Web/DEPLOYMENT.md` - Deployment guide for web app

---

## 🆘 Support

For issues:
1. Check terminal logs for Electron errors
2. Check DevTools console for renderer errors
3. Verify URL is configured correctly (Ctrl+Shift+C)
4. Check printer configuration (`PRINTER_SETUP.md`)

---

**🎉 This is the Electron client only. For the UI, see `Kiosk_Web`!**
