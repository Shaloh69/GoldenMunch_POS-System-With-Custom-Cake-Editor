# Kiosk_Electron Client - Complete Architecture Documentation

## Table of Contents
1. [Overview](#overview)
2. [Technology Stack](#technology-stack)
3. [Dependencies](#dependencies)
4. [Architecture](#architecture)
5. [Main Process](#main-process)
6. [Renderer Process](#renderer-process)
7. [IPC Communication](#ipc-communication)
8. [Native Hardware Integration](#native-hardware-integration)
9. [Configuration Files](#configuration-files)
10. [Deployment & Autostart](#deployment--autostart)
11. [Differences from Kiosk_Web](#differences-from-kiosk_web)
12. [How Functions Work](#how-functions-work)

---

## Overview

The **Kiosk_Electron** client is a **lightweight Electron wrapper** (~50MB) designed to run on kiosk devices (Raspberry Pi, Windows, Linux, macOS). It loads the remote Next.js web application (Kiosk_Web) and provides native hardware access, specifically for **thermal printer integration**.

**Location:** `/client/Kiosk_Electron`

**Primary Purpose:**
- Native hardware wrapper for kiosk deployment
- Thermal printer integration (ESC/POS protocol)
- Fullscreen kiosk mode
- Auto-start on boot (Raspberry Pi/Linux)

**Key Characteristic:** Does NOT contain UI code - loads remote Kiosk_Web application

---

## Technology Stack

### Core
- **Electron 34.0.0** - Desktop application framework
- **Node.js 18+** - JavaScript runtime

### Build Tools
- **electron-builder 25.1.8** - Multi-platform build system
- **electron-devtools-installer 3.2.0** - DevTools for debugging

---

## Dependencies

### Runtime Dependencies

**Electron Core:**
```json
{
  "electron": "^34.0.0",
  "electron-builder": "^25.1.8",
  "electron-devtools-installer": "^3.2.0"
}
```

**Thermal Printer Support (ESC/POS Protocol):**
```json
{
  "escpos": "^3.0.0-alpha.6",           // Core ESC/POS library
  "escpos-usb": "^3.0.0-alpha.4",       // USB printer adapter
  "escpos-network": "^3.0.0-alpha.5",   // Network printer adapter
  "escpos-serialport": "^3.0.0-alpha.4",// Serial printer adapter
  "serialport": "^12.0.0",              // Serial communication
  "usb": "^2.14.0"                      // USB device access
}
```

**Important Notes:**
- USB dependencies require **native compilation**
- Windows requires **Visual Studio Build Tools**
- Linux requires **libusb-dev** and **libudev-dev**
- Raspberry Pi requires ARM-specific builds

### Package Size
- **node_modules:** ~50MB (minimal footprint)
- **Built app:** ~100-150MB (platform-specific)
- **Comparison:** 10x smaller than bundling Next.js (~500MB+)

---

## Architecture

### Separation of Concerns

```
┌─────────────────────────────────────┐
│     Kiosk_Electron (~50MB)          │
│  - Electron wrapper                 │
│  - Thermal printer driver           │
│  - Fullscreen kiosk mode            │
│  - Settings management              │
└─────────────────┬───────────────────┘
                  │ HTTPS
                  ▼
┌─────────────────────────────────────┐
│  Kiosk_Web on Render.com (~200MB)   │
│  - Next.js application              │
│  - All UI components                │
│  - Shopping cart                    │
│  - Custom cake QR                   │
└─────────────────┬───────────────────┘
                  │ REST API
                  ▼
┌─────────────────────────────────────┐
│  Backend Server on Render.com       │
│  - Express.js API                   │
│  - MySQL database                   │
│  - Supabase storage                 │
└─────────────────────────────────────┘
```

### Design Philosophy

**Why Separate?**
1. **Smaller Package Size** - 50MB vs 500MB+
2. **Independent Updates** - Update web app without reinstalling Electron
3. **Easier Deployment** - Single remote URL configuration
4. **Platform Consistency** - Same UI across all kiosks
5. **Reduced Complexity** - Web app doesn't need Electron knowledge

---

## Main Process

### Entry Point
**File:** `/client/Kiosk_Electron/electron/main.js`

### Main Process Responsibilities

1. **Window Management**
   - Creates fullscreen kiosk window
   - Loads remote web application
   - Handles window lifecycle

2. **Settings Management**
   - Loads/saves configuration (app URL)
   - Persistent settings in user directory

3. **Crash Recovery**
   - Auto-reload on renderer crashes
   - Safe reload cooldown (10 seconds)

4. **IPC Communication**
   - Bridges renderer with native features
   - Handles printer commands
   - Settings panel management

### Window Configuration

```javascript
// Fullscreen kiosk mode
const mainWindow = new BrowserWindow({
  fullscreen: true,
  kiosk: true,
  backgroundColor: '#000000',
  show: true,
  webPreferences: {
    preload: path.join(__dirname, 'preload.js'),
    contextIsolation: true,      // ✅ Security enabled
    nodeIntegration: false,       // ✅ No require() in renderer
    sandbox: false                // Needed for printer access
  }
});
```

### GPU Configuration (Raspberry Pi)

```javascript
// Essential for Raspberry Pi Wayland compatibility
app.commandLine.appendSwitch('disable-gpu');
app.commandLine.appendSwitch('disable-gpu-compositing');
```

### Security Considerations

```javascript
// No-sandbox mode only when running as root
// (controlled environments like kiosks)
if (process.getuid?.() === 0) {
  app.commandLine.appendSwitch('no-sandbox');
}
```

---

## Renderer Process

### Renderer Architecture

**Primary Renderer:**
- **Remote Next.js App** - Loaded from configured URL
- **Default Dev URL:** `http://localhost:3002`
- **Default Prod URL:** From settings panel or environment variable

**Secondary Windows:**
1. **Settings Window** - Configuration UI
2. **Splash Screen** - Loading screen (currently unused)

### Preload Scripts

**Main Preload** (`electron/preload.js`):
- Exposes printer APIs to renderer
- Security bridge with contextIsolation
- Exposes app version
- Payment integration stub

**Settings Preload** (`electron/settings-preload.js`):
- Settings CRUD operations
- Settings window controls
- App reload trigger

### Security Architecture

```javascript
// Context Isolation enabled
webPreferences: {
  contextIsolation: true,  // Renderer isolated from Node.js
  nodeIntegration: false   // No direct Node.js access
}
```

**Exposed APIs** (via preload.js):
```javascript
window.electron = {
  printer: {
    printReceipt: (orderData) => ipcRenderer.invoke('print-receipt', orderData),
    printTest: () => ipcRenderer.invoke('print-test'),
    printDailyReport: (reportData) => ipcRenderer.invoke('print-daily-report', reportData),
    getStatus: () => ipcRenderer.invoke('printer-status')
  },
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  openPayment: (paymentData) => ipcRenderer.invoke('open-payment', paymentData)
}
```

---

## IPC Communication

### IPC Handlers (Main Process)

**File:** `electron/main.js`

| Channel | Handler Location | Purpose |
|---------|-----------------|---------|
| `open-settings` | main.js:125 | Open settings window (`Ctrl+Shift+C`) |
| `get-settings` | main.js:129 | Get current kiosk configuration |
| `save-settings` | main.js:133 | Save new URL configuration |
| `get-app-version` | main.js:143 | Get Electron app version |
| `open-payment` | main.js:151 | Payment integration (stub) |

**Printer IPC Channels** (Exposed but not yet wired):
- `print-receipt` - Print order receipt
- `print-test` - Test printer connection
- `print-daily-report` - Print daily sales report
- `printer-status` - Get printer connection status

### Settings IPC (Settings Window)

**File:** `electron/settings-preload.js`

**Exposed APIs:**
```javascript
window.electronSettings = {
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),
  closeSettings: () => ipcRenderer.send('close-settings'),
  reloadApp: () => ipcRenderer.send('reload-app')
}
```

---

## Native Hardware Integration

### 1. Thermal Printer Service

**File:** `/client/Kiosk_Electron/electron/printer.js` (430 lines)

#### Supported Connections

1. **USB Printers**
   - Direct USB connection (most common)
   - Vendor ID and Product ID identification
   - Auto-detection

2. **Network Printers**
   - TCP/IP connection
   - Default port: 9100
   - IP address configuration

3. **Serial Printers**
   - RS232/USB-Serial adapters
   - Configurable baud rate
   - COM port specification

#### Printer Configuration

**File:** `/client/Kiosk_Electron/electron/printer-config.json`

```json
{
  "printerType": "usb",
  "usb": {
    "vid": "0x0416",  // XPrinter vendor ID
    "pid": "0x5011"   // Product ID
  },
  "network": {
    "host": "192.168.1.100",
    "port": 9100
  },
  "serial": {
    "path": "/dev/ttyUSB0",
    "baudRate": 9600
  },
  "settings": {
    "width": 48,        // 80mm paper = 48 characters
    "encoding": "GB18030"
  }
}
```

#### Supported Printer Brands

- **Epson** - TM-T20, TM-T88 series
- **Star Micronics** - TSP100, TSP650
- **XPrinter** - XP-58, XP-80
- **Bixolon** - SRP-350, SRP-275
- **Generic** - Any ESC/POS compatible printer

#### Printer Functions

**1. printReceipt(orderData)**

Prints formatted receipts with:
- Order number and date
- Customer name
- Verification code (large font)
- Item list with quantities and prices
- Subtotal, discount, total
- Payment method
- Reference number (for digital payments)
- Special instructions
- Footer with thank you message

**Format Features:**
- Multi-size fonts (1x1, 2x2, 3x3)
- Bold and underline styling
- Text alignment (left, center, right)
- Line separators
- Auto paper cut
- Text wrapping for long content
- Philippine Peso (₱) formatting

**2. printTest()**

Test print to verify:
- Printer connection
- Paper availability
- Print quality

**3. printDailyReport(reportData)**

End-of-day sales report with:
- Date and time
- Total orders and sales
- Payment method breakdown
- Top 5 selling items
- Total cash collected
- Digital payment summary

#### Receipt Example

```
================================
    GOLDENMUNCH BAKERY
================================
Order #: ORD-2025-001234
Date: 2025-01-15 10:30 AM

Customer: Juan Dela Cruz

VERIFICATION CODE
    ╔══════════╗
    ║  456789  ║
    ╚══════════╝

--------------------------------
ITEMS:
--------------------------------
Chocolate Cake (1 pc)
  ₱ 350.00

Iced Coffee (2 pcs)
  ₱ 120.00

--------------------------------
Subtotal:        ₱ 470.00
Discount:        ₱ 47.00 (10%)
Total:           ₱ 423.00

Payment: GCash
Reference: GCASH123456789

Special Instructions:
Please add extra frosting

--------------------------------
Thank you for your order!
Please present verification code
when picking up your order.
================================
```

### 2. Settings Persistence

**File:** `/client/Kiosk_Electron/electron/settings-manager.js`

#### Storage Location

**Platform-Specific:**
- **Linux:** `~/.config/goldenmunch-kiosk-electron/kiosk-config.json`
- **Windows:** `%APPDATA%\goldenmunch-kiosk-electron\kiosk-config.json`
- **macOS:** `~/Library/Application Support/goldenmunch-kiosk-electron/kiosk-config.json`

#### Configuration Structure

```json
{
  "appUrl": "https://goldenmunch-kiosk.onrender.com",
  "lastUpdated": "2025-01-15T10:30:00.000Z"
}
```

#### Configuration Priority

1. **Settings Panel** (highest priority)
2. **Environment Variable** `KIOSK_APP_URL`
3. **Development Default** (`http://localhost:3002`)

### 3. Crash Recovery & Monitoring

**Features:**
- Auto-reload on renderer crash
- 10-second cooldown to prevent infinite loops
- Graceful handling of temporary unresponsiveness
- Process monitoring in startup script

```javascript
// Crash handling
mainWindow.webContents.on('render-process-gone', (_event, details) => {
  console.error('Renderer process crashed:', details.reason);

  if (details.reason === 'crashed' || details.reason === 'killed') {
    // Wait before reloading to prevent rapid crash loops
    setTimeout(() => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.reload();
      }
    }, 1500);
  }
});
```

---

## Configuration Files

### Electron Main Files

| File Path | Purpose |
|-----------|---------|
| `electron/main.js` | Main process entry point (window management) |
| `electron/preload.js` | Security bridge for main window |
| `electron/settings-preload.js` | Security bridge for settings window |
| `electron/settings-manager.js` | Persistent settings (JSON file storage) |
| `electron/printer.js` | Thermal printer service (430 lines) |
| `electron/printer-config.json` | Printer hardware configuration |
| `electron/settings.html` | Settings UI (320 lines) |
| `electron/splash.html` | Splash screen (169 lines, unused) |

### Build Configuration

**File:** `package.json`

```json
{
  "name": "goldenmunch-kiosk-electron",
  "version": "1.0.0",
  "main": "electron/main.js",
  "build": {
    "appId": "com.goldenmunch.kiosk",
    "productName": "GoldenMunch Kiosk",
    "files": ["electron/**/*", "package.json"],
    "extraResources": [{
      "from": "electron/printer-config.json",
      "to": "printer-config.json"
    }],
    "linux": {
      "target": ["deb", "AppImage"],
      "category": "Office"
    },
    "win": {
      "target": "nsis"
    },
    "mac": {
      "target": "dmg"
    }
  }
}
```

### Scripts

**Build Commands:**
- `npm run build:linux` - Linux/Ubuntu (.deb, .AppImage)
- `npm run build:rpi` - Raspberry Pi ARM (.deb, .AppImage with --armv7l)
- `npm run build:win` - Windows (.exe NSIS installer)
- `npm run build:mac` - macOS (.dmg)

---

## Deployment & Autostart

### Raspberry Pi / Linux Deployment

#### 1. Systemd Service

**File:** `/client/Kiosk_Electron/scripts/goldenmunch-kiosk.service`

```ini
[Unit]
Description=GoldenMunch Kiosk Application
After=network.target graphical.target

[Service]
Type=simple
User=pi
Environment=DISPLAY=:0
ExecStart=/home/pi/goldenmunch-kiosk/start-kiosk.sh
Restart=always
RestartSec=10

[Install]
WantedBy=graphical.target
```

**Features:**
- Auto-restart on crash
- Waits for network and graphical target
- Logs to systemd journal
- Runs as non-root user

#### 2. Startup Script

**File:** `/client/Kiosk_Electron/scripts/start-kiosk.sh`

**Startup Sequence:**

```bash
#!/bin/bash

# 1. Wait for X server (up to 30 seconds)
for i in {1..30}; do
  if xset q &>/dev/null; then
    echo "X server is ready"
    break
  fi
  sleep 1
done

# 2. Wait for network (up to 60 seconds)
for i in {1..60}; do
  if ping -c 1 8.8.8.8 &>/dev/null; then
    echo "Network is ready"
    break
  fi
  sleep 1
done

# 3. Disable screen blanking
xset s off         # Disable screen saver
xset s noblank     # Don't blank screen
xset -dpms         # Disable power management

# 4. Set Wayland environment
export ELECTRON_OZONE_PLATFORM_HINT=x11
export XDG_SESSION_TYPE=x11

# 5. Start Electron kiosk
/opt/GoldenMunch\ Kiosk/goldenmunch-kiosk-electron
```

**Log Locations:**
```
~/.goldenmunch-logs/startup.log   # Startup script logs
~/.goldenmunch-logs/kiosk.log     # Electron application logs
```

#### 3. Installation Script

**File:** `/client/Kiosk_Electron/scripts/install-autostart.sh`

**Automated Setup:**
1. Makes scripts executable
2. Updates service file with correct paths
3. Installs systemd service
4. Enables autostart on boot
5. Creates log directories

```bash
#!/bin/bash

# Make scripts executable
chmod +x /path/to/start-kiosk.sh

# Install systemd service
sudo cp goldenmunch-kiosk.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable goldenmunch-kiosk.service
sudo systemctl start goldenmunch-kiosk.service
```

### Raspberry Pi Specific Optimizations

**Critical Environment Variables:**
```bash
export ELECTRON_OZONE_PLATFORM_HINT=x11  # Force X11 over Wayland
export XDG_SESSION_TYPE=x11              # Prevent DRM/GBM errors
```

**GPU Configuration:**
```javascript
// In main.js
app.commandLine.appendSwitch('disable-gpu');
app.commandLine.appendSwitch('disable-gpu-compositing');
```

**Screen Management:**
```bash
xset s off         # Disable screen saver
xset s noblank     # Don't blank screen
xset -dpms         # Disable power management
```

---

## Differences from Kiosk_Web

| Feature | Kiosk_Electron | Kiosk_Web |
|---------|---------------|-----------|
| **Purpose** | Native hardware wrapper | Web application UI |
| **Size** | ~50MB | ~200MB (node_modules) |
| **Contains** | Electron + printer drivers | Complete Next.js app |
| **UI Code** | None (loads remote) | Full React/Next.js UI |
| **Dependencies** | Electron, escpos, serialport, usb | Next.js, React, HeroUI, Three.js |
| **Native Access** | ✅ Printers, settings | ❌ Browser sandbox |
| **Deployment** | Desktop installers (.deb, .exe, .dmg) | Render.com web service |
| **URL Loading** | Configurable remote URL | Self-hosted (localhost:3002) |
| **Printer Support** | ✅ USB/Network/Serial | ❌ Browser limitation |
| **Build Output** | .deb, .exe, .dmg, .AppImage | Next.js build (.next/) |
| **Platform** | Windows, Linux, macOS, RPi | Any browser |
| **Kiosk Mode** | ✅ Fullscreen locked | ❌ Requires Electron |
| **Offline** | Needs network for remote app | Can run offline |
| **Auto-update** | Manual reinstall | Git push to Render |

### Architecture Flow

```
┌──────────────────────────────────┐
│   Kiosk_Electron (50MB)          │
│   - Electron wrapper             │
│   - Printer drivers              │
│   - Settings panel               │
│   - Fullscreen kiosk mode        │
└────────────┬─────────────────────┘
             │ HTTPS (loads remote URL)
             ▼
┌──────────────────────────────────┐
│   Kiosk_Web on Render.com        │
│   - Next.js 16 application       │
│   - Menu browsing                │
│   - Shopping cart                │
│   - Custom cake QR               │
│   - Checkout flow                │
└────────────┬─────────────────────┘
             │ REST API
             ▼
┌──────────────────────────────────┐
│   Backend Server on Render.com   │
│   - Express.js API               │
│   - MySQL database               │
│   - Supabase storage             │
└──────────────────────────────────┘
```

---

## How Functions Work

### 1. Opening Settings Panel

```javascript
// User presses Ctrl+Shift+C
globalShortcut.register('CommandOrControl+Shift+C', () => {
  // 1. Check if settings window already exists
  if (settingsWindow && !settingsWindow.isDestroyed()) {
    settingsWindow.focus();
    return;
  }

  // 2. Create settings window
  settingsWindow = new BrowserWindow({
    width: 600,
    height: 400,
    parent: mainWindow,
    modal: true,
    webPreferences: {
      preload: path.join(__dirname, 'settings-preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  // 3. Load settings HTML
  settingsWindow.loadFile('electron/settings.html');

  // 4. Clean up on close
  settingsWindow.on('closed', () => {
    settingsWindow = null;
  });
});
```

### 2. Saving Settings

```javascript
// Settings window flow

// 1. User enters new URL in settings panel
const newUrl = document.getElementById('app-url').value;

// 2. Test URL connection (optional)
const testConnection = async (url) => {
  try {
    const response = await fetch(url);
    return response.ok;
  } catch (error) {
    return false;
  }
};

// 3. Save settings via IPC
await window.electronSettings.saveSettings({
  appUrl: newUrl
});

// 4. Main process saves to file
ipcMain.handle('save-settings', async (event, settings) => {
  // Write to JSON file
  const configPath = getConfigPath();
  fs.writeFileSync(configPath, JSON.stringify(settings, null, 2));
  return { success: true };
});

// 5. Reload app with new URL
window.electronSettings.reloadApp();

// 6. Main process reloads
ipcMain.on('reload-app', () => {
  mainWindow.reload();
});
```

### 3. Printing Receipt

```javascript
// Web app calls printer API
window.electron.printer.printReceipt({
  orderNumber: 'ORD-2025-001234',
  date: new Date(),
  customerName: 'Juan Dela Cruz',
  verificationCode: '456789',
  items: [
    { name: 'Chocolate Cake', quantity: 1, price: 350 },
    { name: 'Iced Coffee', quantity: 2, price: 120 }
  ],
  subtotal: 470,
  discount: 47,
  total: 423,
  paymentMethod: 'GCash',
  referenceNumber: 'GCASH123456789',
  specialInstructions: 'Please add extra frosting'
});

// IPC call to main process
ipcRenderer.invoke('print-receipt', orderData);

// Main process handles printing
ipcMain.handle('print-receipt', async (event, orderData) => {
  // 1. Load printer configuration
  const config = JSON.parse(
    fs.readFileSync('electron/printer-config.json', 'utf8')
  );

  // 2. Connect to printer
  let device;
  if (config.printerType === 'usb') {
    const usb = require('escpos-usb');
    device = new usb(config.usb.vid, config.usb.pid);
  }

  // 3. Create printer instance
  const escpos = require('escpos');
  const printer = new escpos.Printer(device);

  // 4. Format and print receipt
  device.open(() => {
    printer
      .align('center')
      .style('B')
      .size(2, 2)
      .text('GOLDENMUNCH BAKERY')
      .style('NORMAL')
      .size(1, 1)
      .text('================================')
      .align('left')
      .text(`Order #: ${orderData.orderNumber}`)
      .text(`Date: ${orderData.date}`)
      .text(`Customer: ${orderData.customerName}`)
      .feed(1)
      .align('center')
      .style('B')
      .size(3, 3)
      .text(orderData.verificationCode)
      .feed(2)
      // ... (items, totals, footer)
      .cut()
      .close();
  });

  return { success: true };
});
```

### 4. Auto-Reload on Crash

```javascript
// Main process monitors renderer health
mainWindow.webContents.on('render-process-gone', (_event, details) => {
  console.error('Renderer process crashed:', details);

  // Check crash reason
  if (details.reason === 'crashed' || details.reason === 'killed') {
    console.log('Attempting to reload application...');

    // Safe reload with cooldown
    setTimeout(() => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.reload();
        console.log('Application reloaded');
      }
    }, 1500); // 1.5 second cooldown
  }
});

// Prevent infinite reload loops
let lastCrashTime = 0;
const CRASH_COOLDOWN = 10000; // 10 seconds

mainWindow.webContents.on('render-process-gone', (_event, details) => {
  const now = Date.now();

  // Check if crashing too frequently
  if (now - lastCrashTime < CRASH_COOLDOWN) {
    console.error('Application crashing too frequently. Stopping auto-reload.');
    return;
  }

  lastCrashTime = now;

  // Proceed with reload
  setTimeout(() => {
    mainWindow.reload();
  }, 1500);
});
```

### 5. Autostart on Boot (Raspberry Pi)

```bash
# Systemd service starts on boot
sudo systemctl start goldenmunch-kiosk.service

# Start script runs:
# 1. Wait for X server
until xset q &>/dev/null; do
  echo "Waiting for X server..."
  sleep 1
done

# 2. Wait for network
until ping -c 1 8.8.8.8 &>/dev/null; do
  echo "Waiting for network..."
  sleep 1
done

# 3. Configure display
xset s off
xset s noblank
xset -dpms

# 4. Set environment
export ELECTRON_OZONE_PLATFORM_HINT=x11
export XDG_SESSION_TYPE=x11

# 5. Launch Electron app
/opt/GoldenMunch\ Kiosk/goldenmunch-kiosk-electron

# 6. If crashes, systemd restarts after 10 seconds
# (configured in service file: Restart=always, RestartSec=10)
```

---

## Summary

The **Kiosk_Electron** client is a well-architected, lightweight Electron wrapper that provides:

### Core Features
- **50MB Package** - 10x smaller than bundling Next.js
- **Remote URL Loading** - Configurable via settings panel
- **Thermal Printer Integration** - Full ESC/POS support (430 lines)
- **Fullscreen Kiosk Mode** - Locked down interface
- **Raspberry Pi Support** - X11 forcing, GPU disabled, systemd autostart
- **Multi-platform Builds** - Linux (.deb, .AppImage), Windows (.exe), macOS (.dmg)
- **Crash Recovery** - Auto-reload with cooldown
- **Settings Persistence** - JSON file in user directory

### Supported Hardware
- **Printers:** USB, Network (TCP/IP), Serial (RS232)
- **Brands:** Epson, Star Micronics, XPrinter, Bixolon, any ESC/POS
- **Platforms:** Raspberry Pi, Windows, Linux, macOS

### Deployment
- **Systemd Service** - Auto-start on boot
- **Startup Script** - Network/display checks
- **Log Files** - Startup and application logs
- **Environment Variables** - Wayland/X11 configuration

### Architecture Benefits
1. **Separation of Concerns** - Electron for hardware, Next.js for UI
2. **Independent Updates** - Web app updates without reinstalling Electron
3. **Minimal Footprint** - Small package size
4. **Platform Consistency** - Same UI across all kiosks
5. **Easy Configuration** - Single URL setting

The Kiosk_Electron client demonstrates a smart architectural decision to separate native hardware integration from web UI, resulting in a maintainable, scalable solution for POS kiosk deployment.
