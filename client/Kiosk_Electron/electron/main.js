// ================================
// main.js – FIXED, STABLE, NO RANDOM RELOADS (KIOSK SAFE)
// ================================

const { app, BrowserWindow, ipcMain } = require('electron');
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
  // CRASH HANDLING (IMPROVED - NO AGGRESSIVE RELOADS)
  // ================================
  mainWindow.webContents.on('render-process-gone', (_event, details) => {
    console.error('Renderer process gone:', details);

    // Only reload on actual crashes, not on clean exits
    // Let systemd handle full app restarts
    if (details.reason === 'crashed') {
      console.log('Renderer crashed - letting systemd handle restart');
      console.log('Exiting app to trigger clean restart...');
      app.quit(); // Let systemd restart the entire app cleanly
    } else if (details.reason === 'killed') {
      console.log('Renderer killed (likely OOM) - exiting for clean restart');
      app.quit(); // Let systemd restart
    } else {
      console.log(`Renderer exited (${details.reason}) - monitoring for issues`);
    }
  });

  // ================================
  // DO NOT RELOAD ON TEMP UNRESPONSIVE
  // ================================
  mainWindow.webContents.on('unresponsive', () => {
    console.warn('Renderer temporarily unresponsive - waiting for recovery');
    // Don't do anything - let it recover naturally
  });

  mainWindow.webContents.on('responsive', () => {
    console.log('Renderer responsive again - recovered successfully');
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

// ================================
// APP LIFECYCLE
// ================================
app.whenReady().then(() => {
  settingsManager = new SettingsManager();
  createMainWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
});
