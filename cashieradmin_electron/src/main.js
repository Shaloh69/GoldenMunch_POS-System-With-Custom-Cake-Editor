const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const Store = require('electron-store');
const printer = require('./printer');

// Initialize electron-store for persistent settings
const store = new Store();

let mainWindow;

// Default configuration
const DEFAULT_CONFIG = {
  serverUrl: 'https://goldenmunch-pos-cashieradmin.onrender.com',
  printerName: 'POS-58',
  windowWidth: 1400,
  windowHeight: 900,
};

function createWindow() {
  // Get saved window dimensions or use defaults
  const windowWidth = store.get('windowWidth', DEFAULT_CONFIG.windowWidth);
  const windowHeight = store.get('windowHeight', DEFAULT_CONFIG.windowHeight);
  const serverUrl = store.get('serverUrl', DEFAULT_CONFIG.serverUrl);

  mainWindow = new BrowserWindow({
    width: windowWidth,
    height: windowHeight,
    minWidth: 1200,
    minHeight: 700,
    icon: path.join(__dirname, '../assets/icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    backgroundColor: '#ffffff',
    show: false, // Don't show until ready
  });

  // Load the cashieradmin web app
  // In production, this should point to your deployed cashieradmin URL
  // In development, it points to localhost
  const appUrl = process.argv.includes('--dev')
    ? 'https://goldenmunch-pos-cashieradmin.onrender.com' // Development cashieradmin URL
    : serverUrl; // Production URL from settings

  mainWindow.loadURL(appUrl);

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Open DevTools in development mode
  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools();
  }

  // Save window dimensions when closing
  mainWindow.on('close', () => {
    const bounds = mainWindow.getBounds();
    store.set('windowWidth', bounds.width);
    store.set('windowHeight', bounds.height);
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Initialize Electron app
app.whenReady().then(() => {
  createWindow();
  setupIpcHandlers();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Set up IPC handlers for printer communication
function setupIpcHandlers() {
  // Get printer status
  ipcMain.handle('printer:getStatus', async () => {
    try {
      const printerName = store.get('printerName', DEFAULT_CONFIG.printerName);
      const status = await printer.getStatus(printerName);
      return status;
    } catch (error) {
      console.error('Error getting printer status:', error);
      return {
        available: false,
        connected: false,
        config: {
          error: error.message,
        },
      };
    }
  });

  // Print receipt
  ipcMain.handle('printer:printReceipt', async (event, receiptData) => {
    try {
      const printerName = store.get('printerName', DEFAULT_CONFIG.printerName);
      const result = await printer.printReceipt(printerName, receiptData);
      return result;
    } catch (error) {
      console.error('Error printing receipt:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  });

  // Print test receipt
  ipcMain.handle('printer:printTest', async () => {
    try {
      const printerName = store.get('printerName', DEFAULT_CONFIG.printerName);
      const result = await printer.printTest(printerName);
      return result;
    } catch (error) {
      console.error('Error printing test:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  });

  // Print daily report
  ipcMain.handle('printer:printDailyReport', async (event, reportData) => {
    try {
      const printerName = store.get('printerName', DEFAULT_CONFIG.printerName);
      const result = await printer.printDailyReport(printerName, reportData);
      return result;
    } catch (error) {
      console.error('Error printing report:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  });

  // Get available printers
  ipcMain.handle('printer:getAvailablePrinters', async () => {
    try {
      const printers = await printer.getAvailablePrinters();
      return printers;
    } catch (error) {
      console.error('Error getting available printers:', error);
      return [];
    }
  });

  // Set printer name
  ipcMain.handle('printer:setPrinterName', async (event, printerName) => {
    try {
      store.set('printerName', printerName);
      return { success: true };
    } catch (error) {
      console.error('Error setting printer name:', error);
      return { success: false, error: error.message };
    }
  });

  // Get settings
  ipcMain.handle('settings:get', async (event, key) => {
    return store.get(key);
  });

  // Set settings
  ipcMain.handle('settings:set', async (event, key, value) => {
    store.set(key, value);
    return { success: true };
  });

  // Get all settings
  ipcMain.handle('settings:getAll', async () => {
    return store.store;
  });
}

// Handle any uncaught errors
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (error) => {
  console.error('Unhandled Rejection:', error);
});
