const { app, BrowserWindow, screen, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const isDev = process.env.NODE_ENV !== 'production';
const ThermalPrinterService = require('./printer');

let mainWindow;
let printerService = null;

function createWindow() {
  // Get primary display dimensions
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;

  // Create the browser window
  mainWindow = new BrowserWindow({
    width: width,
    height: height,
    fullscreen: !isDev, // Fullscreen in production, windowed in development
    kiosk: !isDev, // Kiosk mode in production (prevents user from exiting)
    frame: isDev, // Show frame only in development
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  // Load the app
  const startUrl = isDev
    ? 'http://localhost:3002' // Next.js dev server
    : `file://${path.join(__dirname, '../out/index.html')}`; // Production build

  mainWindow.loadURL(startUrl);

  // Open DevTools in development
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  // Prevent navigation away from app
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith(startUrl)) {
      event.preventDefault();
    }
  });

  // Disable right-click menu in production
  if (!isDev) {
    mainWindow.webContents.on('context-menu', (e) => e.preventDefault());
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Auto-reload in development when Next.js rebuilds
  if (isDev) {
    const {
      default: installExtension,
      REACT_DEVELOPER_TOOLS,
    } = require('electron-devtools-installer');

    installExtension(REACT_DEVELOPER_TOOLS)
      .then((name) => console.log(`Added Extension: ${name}`))
      .catch((err) => console.log('An error occurred:', err));
  }
}

// This method will be called when Electron has finished initialization
app.whenReady().then(() => {
  createWindow();

  // Initialize printer after a short delay
  setTimeout(() => {
    initializePrinter();
  }, 2000);

  app.on('activate', () => {
    // On macOS, re-create window when dock icon is clicked
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed (except on macOS)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Security: Prevent new windows from being created
app.on('web-contents-created', (event, contents) => {
  contents.setWindowOpenHandler(() => {
    return { action: 'deny' };
  });
});

// Handle app-level errors
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

// Prevent app from sleeping/screen lock in kiosk mode
if (!isDev) {
  const { powerSaveBlocker } = require('electron');
  const id = powerSaveBlocker.start('prevent-display-sleep');
  console.log('Power save blocker started:', powerSaveBlocker.isStarted(id));
}

// ============================================================================
// PRINTER INTEGRATION
// ============================================================================

/**
 * Initialize printer service
 */
function initializePrinter() {
  try {
    // Load printer configuration
    const configPath = path.join(__dirname, 'printer-config.json');
    let config = {};

    if (fs.existsSync(configPath)) {
      const configData = fs.readFileSync(configPath, 'utf8');
      config = JSON.parse(configData);
      console.log('Printer config loaded:', config);
    } else {
      console.log('No printer config found, using defaults');
    }

    // Create printer service instance
    const printerConfig = {
      type: config.printerType || 'usb',
      vid: parseInt(config.usb?.vid || '0x0416', 16),
      pid: parseInt(config.usb?.pid || '0x5011', 16),
      address: config.network?.address || '192.168.1.100',
      port: config.network?.port || 9100,
      serialPath: config.serial?.path || '/dev/ttyUSB0',
      baudRate: config.serial?.baudRate || 9600,
      width: config.settings?.width || 48,
      encoding: config.settings?.encoding || 'GB18030'
    };

    printerService = new ThermalPrinterService(printerConfig);
    console.log('Printer service initialized');
  } catch (error) {
    console.error('Error initializing printer:', error);
    printerService = null;
  }
}

/**
 * IPC Handler: Print receipt
 */
ipcMain.handle('print-receipt', async (event, orderData) => {
  console.log('Print receipt requested:', orderData);

  try {
    if (!printerService) {
      initializePrinter();
    }

    if (!printerService) {
      throw new Error('Printer service not available');
    }

    await printerService.printReceipt(orderData);
    return { success: true, message: 'Receipt printed successfully' };
  } catch (error) {
    console.error('Error printing receipt:', error);
    return {
      success: false,
      error: error.message,
      suggestion: 'Check printer connection and configuration'
    };
  }
});

/**
 * IPC Handler: Print test receipt
 */
ipcMain.handle('print-test', async () => {
  console.log('Test print requested');

  try {
    if (!printerService) {
      initializePrinter();
    }

    if (!printerService) {
      throw new Error('Printer service not available');
    }

    await printerService.printTest();
    return { success: true, message: 'Test receipt printed' };
  } catch (error) {
    console.error('Error printing test:', error);
    return {
      success: false,
      error: error.message,
      suggestion: 'Check printer connection and configuration'
    };
  }
});

/**
 * IPC Handler: Print daily report
 */
ipcMain.handle('print-daily-report', async (event, reportData) => {
  console.log('Daily report print requested');

  try {
    if (!printerService) {
      initializePrinter();
    }

    if (!printerService) {
      throw new Error('Printer service not available');
    }

    await printerService.printDailyReport(reportData);
    return { success: true, message: 'Report printed successfully' };
  } catch (error) {
    console.error('Error printing report:', error);
    return {
      success: false,
      error: error.message
    };
  }
});

/**
 * IPC Handler: Get printer status
 */
ipcMain.handle('printer-status', async () => {
  return {
    available: printerService !== null,
    connected: printerService !== null,
    config: printerService ? printerService.config : null
  };
});


// Cleanup printer on quit
app.on('before-quit', () => {
  if (printerService) {
    printerService.disconnect();
  }
});
