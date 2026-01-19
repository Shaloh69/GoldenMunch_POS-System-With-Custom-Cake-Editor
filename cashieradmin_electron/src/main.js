const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const Store = require('electron-store');
const printer = require('./printer');

console.log('╔════════════════════════════════════════════════════════════════╗');
console.log('║           GOLDENMUNCH ELECTRON CASHIER ADMIN                   ║');
console.log('╚════════════════════════════════════════════════════════════════╝');
console.log('🚀 Starting Electron Application...');
console.log('📂 Working Directory:', process.cwd());
console.log('🖥️  Platform:', process.platform);
console.log('📦 Electron Version:', process.versions.electron);
console.log('⚙️  Node Version:', process.versions.node);
console.log('🌐 Chrome Version:', process.versions.chrome);

// Initialize electron-store for persistent settings
console.log('💾 Initializing electron-store...');
const store = new Store();
console.log('✅ Electron-store initialized');

let mainWindow;

// Default configuration
const DEFAULT_CONFIG = {
  serverUrl: 'https://goldenmunchcashieradmin.onrender.com',
  printerName: 'POS-58',
  windowWidth: 1400,
  windowHeight: 900,
};

console.log('📋 Default Configuration:', DEFAULT_CONFIG);

function createWindow() {
  console.log('\n🪟 Creating Browser Window...');

  // Get saved window dimensions or use defaults
  const windowWidth = store.get('windowWidth', DEFAULT_CONFIG.windowWidth);
  const windowHeight = store.get('windowHeight', DEFAULT_CONFIG.windowHeight);
  const serverUrl = store.get('serverUrl', DEFAULT_CONFIG.serverUrl);
  const savedPrinterName = store.get('printerName', DEFAULT_CONFIG.printerName);

  console.log('📐 Window Dimensions:', { width: windowWidth, height: windowHeight });
  console.log('🌐 Server URL:', serverUrl);
  console.log('🖨️  Configured Printer:', savedPrinterName);

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

  console.log('✅ Browser Window created (ID:', mainWindow.id + ')');

  // Load the cashieradmin web app
  // In production, this should point to your deployed cashieradmin URL
  // In development, it points to localhost
  const appUrl = process.argv.includes('--dev')
    ? 'https://goldenmunchcashieradmin.onrender.com' // Development cashieradmin URL
    : serverUrl; // Production URL from settings

  console.log('🌐 Loading URL:', appUrl);
  console.log('🔧 Development Mode:', process.argv.includes('--dev') ? 'YES' : 'NO');

  mainWindow.loadURL(appUrl);

  // Track loading progress
  mainWindow.webContents.on('did-start-loading', () => {
    console.log('⏳ Started loading web content...');
  });

  mainWindow.webContents.on('did-finish-load', () => {
    console.log('✅ Web content loaded successfully');
  });

  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('❌ Failed to load web content:', errorCode, errorDescription);
  });

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    console.log('👁️  Window ready to show - displaying to user');
    mainWindow.show();
    console.log('✨ Application fully initialized and visible');
  });

  // Open DevTools in development mode
  if (process.argv.includes('--dev')) {
    console.log('🔍 Opening DevTools (Development Mode)');
    mainWindow.webContents.openDevTools();
  }

  // Save window dimensions when closing
  mainWindow.on('close', () => {
    const bounds = mainWindow.getBounds();
    console.log('💾 Saving window dimensions:', bounds.width, 'x', bounds.height);
    store.set('windowWidth', bounds.width);
    store.set('windowHeight', bounds.height);
  });

  mainWindow.on('closed', () => {
    console.log('🚪 Main window closed');
    mainWindow = null;
  });
}

// Initialize Electron app
app.whenReady().then(() => {
  console.log('\n✅ Electron App Ready!');
  console.log('═══════════════════════════════════════════════════════════════');

  createWindow();
  setupIpcHandlers();

  console.log('═══════════════════════════════════════════════════════════════\n');

  app.on('activate', () => {
    console.log('🔄 App activated');
    if (BrowserWindow.getAllWindows().length === 0) {
      console.log('📱 No windows open - creating new window');
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  console.log('🚪 All windows closed');
  if (process.platform !== 'darwin') {
    console.log('👋 Quitting application (non-macOS)');
    app.quit();
  } else {
    console.log('🍎 Keeping app running (macOS)');
  }
});

// Set up IPC handlers for printer communication
function setupIpcHandlers() {
  console.log('🔌 Setting up IPC handlers...');

  // Get printer status
  ipcMain.handle('printer:getStatus', async () => {
    console.log('\n📞 IPC: printer:getStatus called');
    try {
      const printerName = store.get('printerName', DEFAULT_CONFIG.printerName);
      console.log('🖨️  Checking status for printer:', printerName);
      const status = await printer.getStatus(printerName);
      console.log('✅ Printer status retrieved:', {
        available: status.available,
        connected: status.connected,
        printerName: status.config?.printerName
      });
      return status;
    } catch (error) {
      console.error('❌ Error getting printer status:', error);
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
    console.log('\n📞 IPC: printer:printReceipt called');
    console.log('📋 Receipt Data:', {
      orderNumber: receiptData.orderNumber,
      total: receiptData.total,
      itemCount: receiptData.items?.length
    });
    try {
      const printerName = store.get('printerName', DEFAULT_CONFIG.printerName);
      console.log('🖨️  Printing to:', printerName);
      const result = await printer.printReceipt(printerName, receiptData);
      console.log(result.success ? '✅ Receipt printed successfully' : '❌ Print failed');
      return result;
    } catch (error) {
      console.error('❌ Error printing receipt:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  });

  // Print test receipt
  ipcMain.handle('printer:printTest', async () => {
    console.log('\n📞 IPC: printer:printTest called');
    try {
      const printerName = store.get('printerName', DEFAULT_CONFIG.printerName);
      console.log('🖨️  Printing test receipt to:', printerName);
      const result = await printer.printTest(printerName);
      console.log(result.success ? '✅ Test receipt printed' : '❌ Test print failed');
      return result;
    } catch (error) {
      console.error('❌ Error printing test:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  });

  // Print daily report
  ipcMain.handle('printer:printDailyReport', async (event, reportData) => {
    console.log('\n📞 IPC: printer:printDailyReport called');
    console.log('📊 Report Date:', reportData.date);
    try {
      const printerName = store.get('printerName', DEFAULT_CONFIG.printerName);
      console.log('🖨️  Printing report to:', printerName);
      const result = await printer.printDailyReport(printerName, reportData);
      console.log(result.success ? '✅ Report printed successfully' : '❌ Report print failed');
      return result;
    } catch (error) {
      console.error('❌ Error printing report:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  });

  // Get available printers
  ipcMain.handle('printer:getAvailablePrinters', async () => {
    console.log('\n📞 IPC: printer:getAvailablePrinters called');
    try {
      const printers = await printer.getAvailablePrinters();
      console.log('✅ Found', printers.length, 'printer(s):', printers.join(', ') || 'none');
      return printers;
    } catch (error) {
      console.error('❌ IPC Error getting available printers:', error);
      return [];
    }
  });

  // Set printer name
  ipcMain.handle('printer:setPrinterName', async (event, printerName) => {
    console.log('\n📞 IPC: printer:setPrinterName called');
    console.log('🖨️  New printer name:', printerName);
    try {
      store.set('printerName', printerName);
      console.log('✅ Printer name saved to config');
      return { success: true };
    } catch (error) {
      console.error('❌ Error setting printer name:', error);
      return { success: false, error: error.message };
    }
  });

  // Get settings
  ipcMain.handle('settings:get', async (event, key) => {
    console.log('📞 IPC: settings:get -', key);
    const value = store.get(key);
    console.log('📤 Returning:', value);
    return value;
  });

  // Set settings
  ipcMain.handle('settings:set', async (event, key, value) => {
    console.log('📞 IPC: settings:set -', key, '=', value);
    store.set(key, value);
    console.log('✅ Setting saved');
    return { success: true };
  });

  // Get all settings
  ipcMain.handle('settings:getAll', async () => {
    console.log('📞 IPC: settings:getAll called');
    const allSettings = store.store;
    console.log('📤 Returning all settings:', Object.keys(allSettings));
    return allSettings;
  });

  console.log('✅ IPC handlers registered successfully');
}

// Handle any uncaught errors
process.on('uncaughtException', (error) => {
  console.error('\n❌❌❌ UNCAUGHT EXCEPTION ❌❌❌');
  console.error('Error:', error.message);
  console.error('Stack:', error.stack);
  console.error('════════════════════════════════════════════════════════════════\n');
});

process.on('unhandledRejection', (error) => {
  console.error('\n⚠️⚠️⚠️ UNHANDLED PROMISE REJECTION ⚠️⚠️⚠️');
  console.error('Error:', error);
  console.error('════════════════════════════════════════════════════════════════\n');
});
