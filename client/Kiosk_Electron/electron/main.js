// ================================
// main.js – FIXED, STABLE, NO RANDOM RELOADS (KIOSK SAFE)
// ================================

const { app, BrowserWindow, ipcMain, globalShortcut } = require('electron');
const path = require('path');
const SettingsManager = require('./settings-manager');

const isDev = !app.isPackaged;
let mainWindow;
let settingsWindow;
let settingsManager;
let lastReloadTime = 0;

// ================================
// STABLE KIOSK FLAGS (NO GPU / NO WAYLAND)
// ================================
app.commandLine.appendSwitch('disable-gpu');
app.commandLine.appendSwitch('disable-gpu-compositing');
app.commandLine.appendSwitch('disable-http-cache');

if (process.getuid?.() === 0) {
  // Acceptable ONLY in controlled kiosk environments
  app.commandLine.appendSwitch('no-sandbox');
}

// ================================
// SAFE RELOAD WITH COOLDOWN
// ================================
function safeReload() {
  const now = Date.now();
  if (now - lastReloadTime < 10000) {
    console.warn('Reload suppressed (cooldown)');
    return;
  }
  lastReloadTime = now;
  if (mainWindow && !mainWindow.isDestroyed()) {
    console.log('Reloading main window');
    mainWindow.reload();
  }
}

// ================================
// CREATE MAIN WINDOW
// ================================
function createMainWindow() {
  mainWindow = new BrowserWindow({
    fullscreen: true,
    kiosk: true,
    backgroundColor: '#000000',
    show: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  const startUrl = settingsManager.getAppUrl(isDev);

  if (!startUrl) {
    console.log('No app URL configured, opening settings');
    openSettingsWindow();
    return;
  }

  // Clear cache explicitly
  mainWindow.webContents.session.clearCache().then(() => {
    console.log('Cache cleared');
    mainWindow.loadURL(startUrl).catch(console.error);
  });

  // ================================
  // CRASH HANDLING (REAL CRASHES ONLY)
  // ================================
  mainWindow.webContents.on('render-process-gone', (_event, details) => {
    console.error('Renderer process gone:', details);

    if (details.reason === 'crashed' || details.reason === 'killed') {
      setTimeout(safeReload, 1500);
    }
  });

  // ================================
  // DO NOT RELOAD ON TEMP UNRESPONSIVE
  // ================================
  mainWindow.webContents.on('unresponsive', () => {
    console.warn('Renderer temporarily unresponsive');
  });

  mainWindow.webContents.on('responsive', () => {
    console.log('Renderer responsive again');
  });
}

// ================================
// SETTINGS WINDOW
// ================================
function openSettingsWindow() {
  if (settingsWindow && !settingsWindow.isDestroyed()) return;

  settingsWindow = new BrowserWindow({
    width: 900,
    height: 600,
    modal: true,
    parent: mainWindow,
    webPreferences: {
      preload: path.join(__dirname, 'settings-preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  settingsWindow.loadFile('settings.html');

  settingsWindow.on('closed', () => {
    settingsWindow = null;
  });
}

// ================================
// IPC HANDLERS
// ================================
ipcMain.handle('open-settings', () => {
  openSettingsWindow();
});

ipcMain.handle('get-settings', () => {
  return settingsManager.getSettings();
});

ipcMain.handle('save-settings', async (_event, newSettings) => {
  try {
    settingsManager.saveSettings(newSettings);
    return { success: true };
  } catch (err) {
    console.error('Save settings failed:', err);
    return { success: false, error: err.message };
  }
});

ipcMain.handle('get-app-version', () => {
  try {
    return { success: true, version: app.getVersion() };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('open-payment', async (_event, data) => {
  console.log('Payment requested:', data);
  return { success: false, message: 'Payment integration not implemented' };
});

ipcMain.on('close-settings', () => {
  console.log('Close settings requested');
  if (settingsWindow && !settingsWindow.isDestroyed()) {
    settingsWindow.close();
  }
});

ipcMain.on('reload-app', () => {
  console.log('Reload app requested');
  if (mainWindow && !mainWindow.isDestroyed()) {
    // Get updated URL from settings manager
    const newUrl = settingsManager.getAppUrl(isDev);
    console.log('Reloading app with URL:', newUrl);

    // Clear cache and reload with new URL
    mainWindow.webContents.session.clearCache().then(() => {
      mainWindow.loadURL(newUrl).catch(console.error);
    });
  }

  // Close settings window
  if (settingsWindow && !settingsWindow.isDestroyed()) {
    settingsWindow.close();
  }
});

// ================================
// APP LIFECYCLE
// ================================
app.whenReady().then(() => {
  settingsManager = new SettingsManager();
  createMainWindow();

  // Register global keyboard shortcuts
  // Ctrl+Shift+C - Open settings
  globalShortcut.register('CommandOrControl+Shift+C', () => {
    console.log('Settings shortcut triggered');
    openSettingsWindow();
  });

  // Ctrl+Shift+I - Open Developer Tools (for debugging)
  globalShortcut.register('CommandOrControl+Shift+I', () => {
    console.log('DevTools shortcut triggered');
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.toggleDevTools();
    }
  });

  // F12 - Open Developer Tools (alternative)
  globalShortcut.register('F12', () => {
    console.log('DevTools shortcut triggered (F12)');
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.toggleDevTools();
    }
  });

  // Alt+F4 - Exit kiosk (in case user needs to close)
  globalShortcut.register('Alt+F4', () => {
    console.log('Exit shortcut triggered');
    app.quit();
  });

  // Ctrl+Q - Exit kiosk (alternative)
  globalShortcut.register('CommandOrControl+Q', () => {
    console.log('Exit shortcut triggered');
    app.quit();
  });

  console.log('Global shortcuts registered:');
  console.log('  Ctrl+Shift+C - Open Settings Panel');
  console.log('  Ctrl+Shift+I or F12 - Open Developer Tools');
  console.log('  Alt+F4 - Exit Kiosk');
  console.log('  Ctrl+Q - Exit Kiosk');
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
});

app.on('will-quit', () => {
  // Unregister all shortcuts when app is about to quit
  globalShortcut.unregisterAll();
  console.log('Global shortcuts unregistered');
});
