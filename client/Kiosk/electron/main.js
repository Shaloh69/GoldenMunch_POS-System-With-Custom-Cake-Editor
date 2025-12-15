const { app, BrowserWindow, screen, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const isDev = process.env.NODE_ENV !== 'production';
const ThermalPrinterService = require('./printer');

// CRITICAL: Allow running as root (needed for kiosk mode)
// This is safe in a controlled kiosk environment
if (process.getuid && process.getuid() === 0) {
  app.commandLine.appendSwitch('no-sandbox');
  console.log('Running as root: --no-sandbox flag enabled');
}

// CRITICAL: Comprehensive graphics configuration for Raspberry Pi Wayland compatibility
// These switches prevent DRM/GBM errors and force software rendering
console.log('=== GRAPHICS CONFIGURATION ===');

// Disable hardware acceleration completely
app.disableHardwareAcceleration();
console.log('Hardware acceleration: DISABLED');

// Force software rendering and disable all GPU features
app.commandLine.appendSwitch('disable-gpu');
app.commandLine.appendSwitch('disable-gpu-compositing');
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('disable-software-rasterizer', 'false'); // Enable software rasterizer
console.log('GPU features: DISABLED');

// CRITICAL: Completely disable OpenGL to prevent ANY DRM/GBM access
// This is more aggressive than swiftshader and prevents all GL initialization
app.commandLine.appendSwitch('use-gl', 'disabled');
app.commandLine.appendSwitch('disable-webgl');
app.commandLine.appendSwitch('disable-webgl2');
console.log('OpenGL/WebGL: COMPLETELY DISABLED');

// Disable ALL features that require GPU/DRM access
app.commandLine.appendSwitch('disable-features',
  'VizDisplayCompositor,UseChromeOSDirectVideoDecoder,UseSkiaRenderer,Vulkan');
app.commandLine.appendSwitch('disable-dev-shm-usage'); // Prevent shared memory issues
app.commandLine.appendSwitch('disable-accelerated-2d-canvas'); // Force software canvas
app.commandLine.appendSwitch('disable-accelerated-video-decode'); // No hardware video
app.commandLine.appendSwitch('disable-accelerated-mjpeg-decode'); // No hardware MJPEG
console.log('Display compositor and hardware features: DISABLED');

// Disable shared memory and DMA-BUF usage
app.commandLine.appendSwitch('disable-dev-shm-usage');
app.commandLine.appendSwitch('disable-features', 'SharedArrayBuffer');
console.log('Shared memory and DMA-BUF: DISABLED');

// For Wayland: Use X11 backend through XWayland to avoid native Wayland DRM issues
// This provides better compatibility with limited GPU access
if (process.env.WAYLAND_DISPLAY && !process.env.DISPLAY) {
  // If only Wayland is available, try to use it with minimal features
  app.commandLine.appendSwitch('ozone-platform', 'wayland');
  console.log('Display: Using Wayland with minimal features');
} else {
  // Prefer X11/XWayland if available
  console.log('Display: Using X11/XWayland backend');
}

console.log('=== END GRAPHICS CONFIGURATION ===');

let mainWindow;
let splashWindow;
let printerService = null;

function createSplashScreen() {
  console.log('Creating splash screen...');

  splashWindow = new BrowserWindow({
    width: 400,
    height: 500,
    center: true,
    transparent: false,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  splashWindow.loadFile(path.join(__dirname, 'splash.html'));

  console.log('Splash screen displayed');
}

function closeSplashScreen() {
  if (splashWindow && !splashWindow.isDestroyed()) {
    console.log('Closing splash screen...');
    splashWindow.close();
    splashWindow = null;
  }
}

function createWindow() {
  console.log('=== KIOSK INITIALIZATION ===');
  console.log('Environment:', isDev ? 'DEVELOPMENT' : 'PRODUCTION');

  // Get primary display dimensions
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;
  console.log('Display size:', { width, height });

  // Create the browser window
  mainWindow = new BrowserWindow({
    width: width,
    height: height,
    fullscreen: !isDev, // Fullscreen in production, windowed in development
    kiosk: !isDev, // Kiosk mode in production (prevents user from exiting)
    frame: isDev, // Show frame only in development
    autoHideMenuBar: true,
    show: false, // Don't show until ready
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js'),
      cache: false, // Disable HTTP cache to ensure fresh data
    },
  });

  console.log('Cache disabled:', true);
  console.log('HTTP caching:', 'DISABLED via webPreferences.cache = false');

  // Load the app
  const startUrl = isDev
    ? 'http://localhost:3002' // Next.js dev server
    : `file://${path.join(__dirname, '../out/index.html')}`; // Production build

  console.log('Loading URL:', startUrl);
  mainWindow.loadURL(startUrl).catch((error) => {
    console.error('=== FAILED TO LOAD URL ===');
    console.error('URL:', startUrl);
    console.error('Error:', error);
    console.error('Timestamp:', new Date().toISOString());
  });

  // Open DevTools in development
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  // Log when page finishes loading
  mainWindow.webContents.on('did-finish-load', () => {
    console.log('=== PAGE LOADED SUCCESSFULLY ===');
    console.log('Timestamp:', new Date().toISOString());

    // Close splash screen and show main window
    setTimeout(() => {
      closeSplashScreen();
      mainWindow.show();
      console.log('Main window displayed');
    }, 1000); // Brief delay for smooth transition
  });

  // Prevent navigation away from app
  mainWindow.webContents.on('will-navigate', (event, url) => {
    console.log('Navigation attempt to:', url);
    if (!url.startsWith(startUrl)) {
      console.log('Navigation blocked (external URL)');
      event.preventDefault();
    }
  });

  // Disable right-click menu in production
  if (!isDev) {
    mainWindow.webContents.on('context-menu', (e) => e.preventDefault());
  }

  // Monitor window events
  mainWindow.on('close', (event) => {
    console.log('=== WINDOW CLOSE EVENT ===');
    console.log('Timestamp:', new Date().toISOString());
    console.log('Prevented:', event.defaultPrevented);
  });

  mainWindow.on('closed', () => {
    console.log('=== KIOSK WINDOW CLOSED ===');
    console.log('Timestamp:', new Date().toISOString());
    mainWindow = null;
  });

  // Log if window crashes
  mainWindow.webContents.on('crashed', (event, killed) => {
    console.error('=== RENDERER PROCESS CRASHED ===');
    console.error('Killed:', killed);
    console.error('Timestamp:', new Date().toISOString());
  });

  mainWindow.webContents.on('render-process-gone', (event, details) => {
    console.error('=== RENDER PROCESS GONE ===');
    console.error('Reason:', details.reason);
    console.error('Exit code:', details.exitCode);
    console.error('Timestamp:', new Date().toISOString());
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
  console.log('=== ELECTRON READY ===');
  console.log('Timestamp:', new Date().toISOString());
  console.log('Electron version:', process.versions.electron);
  console.log('Chrome version:', process.versions.chrome);
  console.log('Node version:', process.versions.node);
  console.log('Platform:', process.platform);
  console.log('Architecture:', process.arch);
  console.log('Environment variables:');
  console.log('  WAYLAND_DISPLAY:', process.env.WAYLAND_DISPLAY);
  console.log('  DISPLAY:', process.env.DISPLAY);
  console.log('  XDG_SESSION_TYPE:', process.env.XDG_SESSION_TYPE);
  console.log('  XDG_RUNTIME_DIR:', process.env.XDG_RUNTIME_DIR);
  console.log('  DESKTOP_SESSION:', process.env.DESKTOP_SESSION);

  // Show splash screen first
  createSplashScreen();

  // Create main window after a brief delay
  setTimeout(() => {
    createWindow();
  }, 1500);

  // Initialize printer after a short delay
  setTimeout(() => {
    initializePrinter();
  }, 3000);

  app.on('activate', () => {
    // On macOS, re-create window when dock icon is clicked
    if (BrowserWindow.getAllWindows().length === 0) {
      createSplashScreen();
      setTimeout(() => {
        createWindow();
      }, 1500);
    }
  });
}).catch((error) => {
  console.error('=== ELECTRON FAILED TO START ===');
  console.error('Error:', error);
  console.error('Stack:', error.stack);
  console.error('Timestamp:', new Date().toISOString());
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
  console.error('=== UNCAUGHT EXCEPTION ===');
  console.error('Error:', error);
  console.error('Stack:', error.stack);
  console.error('Timestamp:', new Date().toISOString());
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('=== UNHANDLED REJECTION ===');
  console.error('Promise:', promise);
  console.error('Reason:', reason);
  console.error('Timestamp:', new Date().toISOString());
});

// Log when app is about to quit
app.on('will-quit', (event) => {
  console.log('=== APP WILL QUIT ===');
  console.log('Timestamp:', new Date().toISOString());
  console.log('Platform:', process.platform);
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
