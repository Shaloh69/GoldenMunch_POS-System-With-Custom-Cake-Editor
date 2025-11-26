# GoldenMunch Kiosk - Electron Desktop Application

## Overview

The GoldenMunch Kiosk has been enhanced with Electron.js to run as a standalone desktop application, perfect for kiosk deployments in your bakery.

## Features

### Kiosk Mode
- **Fullscreen**: Runs in fullscreen mode in production
- **No Exit**: Prevents users from closing the app (kiosk mode)
- **No Context Menu**: Right-click disabled in production
- **Power Management**: Prevents screen from sleeping
- **Locked Navigation**: Users cannot navigate away from the app

### Development Mode
- **Windowed**: Runs in a window for easy development
- **DevTools**: React DevTools and Electron DevTools available
- **Hot Reload**: Automatically reloads when code changes
- **Frame**: Shows window controls for easy testing

## Installation

### 1. Install Dependencies

```bash
cd client/Kiosk
npm install
```

This will install:
- `electron` - Desktop app framework
- `electron-builder` - Build and package the app
- `concurrently` - Run multiple commands simultaneously
- `wait-on` - Wait for dev server to be ready
- `electron-devtools-installer` - React DevTools for Electron

### 2. Development Setup

Make sure you have the environment file:

```bash
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_API_TIMEOUT=30000
```

## Usage

### Development Mode

Run the app in development mode (windowed, with DevTools):

```bash
npm run electron:dev
```

This will:
1. Start the Next.js dev server on http://localhost:3000
2. Wait for the server to be ready
3. Launch Electron pointing to the dev server
4. Enable hot reload for both Next.js and Electron

### Production Mode

#### Build for Current Platform

```bash
npm run electron:build
```

#### Build for Specific Platform

```bash
# Windows
npm run electron:build:win

# macOS
npm run electron:build:mac

# Linux
npm run electron:build:linux
```

The built application will be in `client/Kiosk/dist/`.

## File Structure

```
client/Kiosk/
├── electron/
│   ├── main.js           # Main Electron process
│   └── preload.js        # Preload script (secure bridge)
├── out/                  # Next.js static export (after build)
├── dist/                 # Electron packaged apps
├── .env.local            # Development environment
├── .env.production       # Production environment
└── package.json          # Updated with Electron scripts
```

## Configuration

### Main Process (electron/main.js)

Controls the Electron window and app behavior:

- **Fullscreen in Production**: Users cannot minimize or exit
- **Kiosk Mode**: Locks the app to prevent tampering
- **Power Save Blocker**: Prevents screen from sleeping
- **Security**: Prevents navigation and new windows
- **Auto-reload**: In development, reloads when Next.js rebuilds

### Preload Script (electron/preload.js)

Secure bridge between Electron and the web app:

- Exposes only specific Electron APIs
- Prevents direct access to Node.js
- Enhances security through context isolation
- Disables text selection and drag-drop in kiosk mode

## Kiosk Deployment

### Hardware Requirements

**Minimum:**
- CPU: Intel Core i3 or equivalent
- RAM: 4GB
- Storage: 10GB free space
- Display: 1920x1080 touchscreen

**Recommended:**
- CPU: Intel Core i5 or equivalent
- RAM: 8GB
- Storage: 20GB SSD
- Display: 1920x1080 or higher touchscreen

### Software Requirements

- Windows 10/11, macOS 10.15+, or Ubuntu 20.04+
- Node.js 18+ (for development only, not needed in production)

### Installation on Kiosk Hardware

#### Windows

1. Build the installer:
   ```bash
   npm run electron:build:win
   ```

2. Copy `dist/GoldenMunch Kiosk Setup.exe` to the kiosk machine

3. Run the installer

4. Configure Windows to auto-start the app:
   - Press `Win + R`, type `shell:startup`, press Enter
   - Create a shortcut to the installed app in this folder

#### Linux (Ubuntu/Debian)

1. Build the package:
   ```bash
   npm run electron:build:linux
   ```

2. Install the .deb package:
   ```bash
   sudo dpkg -i dist/goldenmunch-kiosk_1.0.0_amd64.deb
   ```

3. Configure auto-start:
   ```bash
   # Create autostart entry
   mkdir -p ~/.config/autostart
   cat > ~/.config/autostart/goldenmunch-kiosk.desktop << EOF
   [Desktop Entry]
   Type=Application
   Name=GoldenMunch Kiosk
   Exec=/opt/GoldenMunch\ Kiosk/goldenmunch-kiosk
   Terminal=false
   EOF
   ```

#### macOS

1. Build the DMG:
   ```bash
   npm run electron:build:mac
   ```

2. Mount the DMG and drag the app to Applications

3. Configure auto-start:
   - System Preferences → Users & Groups → Login Items
   - Add GoldenMunch Kiosk

## Network Configuration

### Local Server Setup

The kiosk needs to connect to the backend server:

1. **Same Machine**: Use `http://localhost:3001/api`

2. **Network Server**: Use server IP
   ```env
   NEXT_PUBLIC_API_URL=http://192.168.1.100:3001/api
   ```

3. **Production Server**: Use domain
   ```env
   NEXT_PUBLIC_API_URL=https://api.goldenmunch.com/api
   ```

### Offline Mode (Future Enhancement)

Consider implementing:
- Service worker for offline caching
- IndexedDB for local order queue
- Auto-sync when connection restored

## Security Features

### Implemented

- ✅ Context isolation (Electron security)
- ✅ Disabled node integration
- ✅ Disabled remote module
- ✅ Prevented external navigation
- ✅ Disabled right-click menu
- ✅ Prevented new windows
- ✅ No frame in production (can't close)

### Recommended Additional Security

1. **Network Security**
   - Use HTTPS for API communications
   - Implement API key authentication
   - Whitelist allowed API endpoints

2. **Physical Security**
   - Place kiosk in supervised area
   - Use hardware locks on ports
   - Disable keyboard shortcuts
   - Mount in secure enclosure

3. **Software Security**
   - Regular app updates
   - Virus protection on kiosk machine
   - Automatic screen lock when idle

## Troubleshooting

### App Won't Start

**Issue**: Electron window doesn't open
**Solution**:
1. Check if dev server is running: `curl http://localhost:3000`
2. Check console for errors
3. Try deleting `out/` and `.next/` folders and rebuilding

### Can't Connect to API

**Issue**: "Network Error" or API not responding
**Solution**:
1. Verify server is running: `curl http://localhost:3001/api/health`
2. Check firewall settings
3. Verify `.env.local` has correct API URL
4. Check network connectivity

### App Won't Exit (Development)

**Issue**: Can't close Electron window in dev mode
**Solution**:
- Press `Ctrl+C` in the terminal running `electron:dev`
- Or use Task Manager/Activity Monitor to force quit

### Build Fails

**Issue**: `electron-builder` errors during build
**Solution**:
1. Ensure all dependencies are installed: `npm install`
2. Clear cache: `npm run clean` (if script exists)
3. Try building for specific platform instead of all
4. Check Node.js version (requires 18+)

## Customization

### Change Window Size (Development)

Edit `electron/main.js`:

```javascript
mainWindow = new BrowserWindow({
  width: 1280,  // Change width
  height: 800,  // Change height
  // ...
});
```

### Add Printer Support

1. Install node-thermal-printer:
   ```bash
   npm install node-thermal-printer
   ```

2. Add to `electron/main.js`:
   ```javascript
   const { ThermalPrinter } = require('node-thermal-printer');

   ipcMain.handle('print-receipt', async (event, orderData) => {
     const printer = new ThermalPrinter({
       type: 'epson',
       interface: 'tcp://192.168.1.100',
     });

     printer.alignCenter();
     printer.bold(true);
     printer.println('GoldenMunch Bakery');
     printer.bold(false);
     // ... format receipt
     printer.cut();
     await printer.execute();
   });
   ```

### Add Barcode Scanner Support

1. Listen for barcode scanner input in renderer
2. Use USB HID device via serialport package
3. Process scanned data in preload script

## Performance Optimization

### Tips for Smooth Kiosk Operation

1. **Disable Animations**: Reduce motion for slower hardware
2. **Lazy Load Images**: Use Next.js Image component
3. **Clear Cache Periodically**: Prevent memory bloat
4. **Limit Order History**: Show only recent orders
5. **Auto-restart Daily**: Schedule nightly reboot

### Monitoring

Consider adding:
- Error logging to file
- Performance metrics
- Health check endpoint
- Remote monitoring dashboard

## Updates and Maintenance

### Auto-Update (Future Feature)

Implement using `electron-updater`:

```bash
npm install electron-updater
```

```javascript
const { autoUpdater } = require('electron-updater');

app.on('ready', () => {
  autoUpdater.checkForUpdatesAndNotify();
});
```

### Manual Updates

1. Build new version
2. Copy installer to kiosk
3. Run installer (will update existing installation)
4. Restart kiosk

## Support

For issues:
1. Check logs in `%APPDATA%/goldenmunch-kiosk/logs/` (Windows)
2. Run in development mode to see detailed errors
3. Check browser console (F12) in development

## Version Information

- **Electron**: 34.0.0
- **Next.js**: 15.3.1
- **React**: 18.3.1
- **App Version**: 1.0.0

---

**Last Updated**: 2025-11-17
