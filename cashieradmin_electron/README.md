# GoldenMunch CashierAdmin Electron

Desktop application wrapper for GoldenMunch CashierAdmin with native POS-58 thermal printer support.

## Features

- **Native Printer Support**: Direct integration with POS-58 thermal printers via USB
- **Receipt Printing**: Print order receipts with detailed item information
- **Daily Reports**: Generate and print daily sales reports
- **Test Printing**: Test printer connectivity and configuration
- **Persistent Settings**: Save printer preferences and window settings
- **Cross-Platform**: Build for Windows, macOS, and Linux

## Prerequisites

Before installing, ensure you have:

- **Node.js** v16 or higher
- **npm** v7 or higher
- **POS-58 Thermal Printer** connected via USB
- **Printer Drivers** installed for your operating system

### Printer Driver Installation

#### Windows
1. Connect your POS-58 printer
2. Windows should auto-detect and install drivers
3. If not, download drivers from manufacturer website
4. Verify printer appears in "Devices and Printers"

#### macOS
1. Connect your POS-58 printer
2. Open "System Preferences" > "Printers & Scanners"
3. Click "+" to add printer
4. Select POS-58 and install

#### Linux (Ubuntu/Debian)
```bash
sudo apt-get update
sudo apt-get install libusb-1.0-0-dev
```

## Installation

1. **Navigate to the electron directory**:
```bash
cd cashieradmin_electron
```

2. **Install dependencies**:
```bash
npm install
```

3. **Configure settings** (optional):

Edit the default configuration in `src/main.js`:
```javascript
const DEFAULT_CONFIG = {
  serverUrl: 'http://localhost:3000',  // Your cashieradmin URL
  printerName: 'POS-58',               // Your printer name
  windowWidth: 1400,
  windowHeight: 900,
};
```

## Running the Application

### Development Mode

Run with DevTools and hot reload:
```bash
npm run dev
```

This will:
- Open the app with DevTools
- Connect to local cashieradmin at `http://localhost:3001`
- Enable console logging

### Production Mode

Run the production build:
```bash
npm start
```

This will:
- Open the app without DevTools
- Connect to configured server URL
- Run in optimized mode

## Building Executables

### Build for Windows
```bash
npm run build:win
```

Creates installer in `dist/` directory:
- `GoldenMunch CashierAdmin Setup.exe` (NSIS installer)

### Build for macOS
```bash
npm run build:mac
```

Creates DMG file in `dist/` directory:
- `GoldenMunch CashierAdmin.dmg`

### Build for Linux
```bash
npm run build:linux
```

Creates packages in `dist/` directory:
- `goldenmunch-cashieradmin-electron_1.0.0_amd64.deb`
- `GoldenMunch CashierAdmin.AppImage`

### Build for All Platforms
```bash
npm run build
```

## Project Structure

```
cashieradmin_electron/
├── src/
│   ├── main.js          # Electron main process
│   ├── preload.js       # IPC bridge (context isolation)
│   └── printer.js       # POS-58 printer integration
├── assets/              # App icons (create this folder)
│   ├── icon.png
│   ├── icon.ico         # Windows
│   └── icon.icns        # macOS
├── dist/                # Build output (auto-generated)
├── package.json         # Dependencies and build config
└── README.md           # This file
```

## Printer API

The application exposes a printer API through the Electron bridge:

### JavaScript API (Available in Web App)

```javascript
// Check printer status
const status = await window.electron.printer.getStatus();
console.log(status);
// {
//   available: true,
//   connected: true,
//   config: { printerName: 'POS-58', vendorId: 0x1234, productId: 0x5678 }
// }

// Print receipt
const result = await window.electron.printer.printReceipt({
  orderNumber: 'ORD-001',
  orderDate: '2025-12-21',
  items: [
    { name: 'Burger', quantity: 2, price: 99.99 },
    { name: 'Fries', quantity: 1, price: 49.99 }
  ],
  subtotal: 249.97,
  tax: 30.00,
  discount: 0,
  total: 279.97,
  paymentMethod: 'Cash',
  customerName: 'John Doe',
  verificationCode: '1234'
});

// Print test receipt
const testResult = await window.electron.printer.printTest();

// Print daily report
const reportResult = await window.electron.printer.printDailyReport({
  date: '2025-12-21',
  totalOrders: 45,
  totalSales: 12500.50,
  paymentBreakdown: {
    'Cash': 8500.00,
    'GCash': 4000.50
  },
  topItems: [
    { name: 'Burger', quantity: 120 },
    { name: 'Fries', quantity: 95 }
  ]
});

// Get available printers
const printers = await window.electron.printer.getAvailablePrinters();

// Set printer name
await window.electron.printer.setPrinterName('POS-58');
```

### Settings API

```javascript
// Get a setting
const printerName = await window.electron.settings.get('printerName');

// Set a setting
await window.electron.settings.set('serverUrl', 'https://api.goldenmunch.com');

// Get all settings
const allSettings = await window.electron.settings.getAll();
```

## Troubleshooting

### Printer Not Detected

**Problem**: Status shows "No USB printers detected"

**Solutions**:
1. Check USB connection
2. Verify printer is powered on
3. Install/reinstall printer drivers
4. Try different USB port
5. Check OS printer settings

### Permission Errors (Linux)

**Problem**: USB permission denied

**Solution**:
```bash
# Add your user to dialout group
sudo usermod -a -G dialout $USER

# Or create udev rule
sudo nano /etc/udev/rules.d/99-escpos.rules

# Add this line (replace VID and PID with your printer's):
SUBSYSTEM=="usb", ATTR{idVendor}=="0dd4", ATTR{idProduct}=="0205", MODE="0666"

# Reload rules
sudo udevadm control --reload-rules
sudo udevadm trigger
```

### Build Errors

**Problem**: Build fails with native module errors

**Solution**:
```bash
# Rebuild native modules
npm rebuild

# Or clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Connection to CashierAdmin Fails

**Problem**: App shows blank screen or connection error

**Solutions**:
1. Verify CashierAdmin is running at configured URL
2. Check firewall settings
3. Update `serverUrl` in settings
4. Check console for CORS errors

## Configuration

### Persistent Settings

Settings are stored in:
- **Windows**: `%APPDATA%/goldenmunch-cashieradmin-electron/config.json`
- **macOS**: `~/Library/Application Support/goldenmunch-cashieradmin-electron/config.json`
- **Linux**: `~/.config/goldenmunch-cashieradmin-electron/config.json`

Available settings:
- `serverUrl`: CashierAdmin web app URL
- `printerName`: Default printer name
- `windowWidth`: Window width (auto-saved)
- `windowHeight`: Window height (auto-saved)

## Development

### Adding New Printer Functions

1. Add IPC handler in `src/main.js`:
```javascript
ipcMain.handle('printer:myFunction', async (event, data) => {
  return await printer.myFunction(printerName, data);
});
```

2. Add function to `src/printer.js`:
```javascript
async function myFunction(printerName, data) {
  // Implementation
}

module.exports = {
  // ... existing exports
  myFunction,
};
```

3. Expose in `src/preload.js`:
```javascript
contextBridge.exposeInMainWorld('electron', {
  printer: {
    // ... existing methods
    myFunction: (data) => ipcRenderer.invoke('printer:myFunction', data),
  },
});
```

### Debug Logging

Enable verbose logging in development:
```javascript
// In src/main.js, add after imports:
process.env.DEBUG = 'escpos:*';
```

## Security Notes

- Context isolation is enabled for security
- Node integration is disabled in renderer
- Only specific APIs are exposed through preload script
- No remote code execution possible from web content

## License

ISC

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review printer documentation
3. Check GitHub issues
4. Contact GoldenMunch support

## Version History

### 1.0.0 (2025-12-21)
- Initial release
- POS-58 printer support
- Receipt and report printing
- Cross-platform builds
- Persistent settings
