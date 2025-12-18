// ================================
// main.js – FIXED & KIOSK-SAFE VERSION
// ================================

const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const SettingsManager = require('./settings-manager');

const isDev = !app.isPackaged;
let mainWindow;
let settingsWindow;
let settingsManager;

// ================================
// STABLE KIOSK FLAGS (NO WAYLAND / NO GPU)
// ================================
app.commandLine.appendSwitch('disable-gpu');
app.commandLine.appendSwitch('disable-gpu-compositing');
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('disable-http-cache');

if (process.getuid?.() === 0) {
  // WARNING: Only acceptable in controlled kiosk environments
  app.commandLine.appendSwitch('no-sandbox');
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
    console.log('No app URL configured, opening settings...');
    openSettingsWindow();
    return;
  }

  // Clear cache explicitly (cache:false is NOT valid)
  mainWindow.webContents.session.clearCache().then(() => {
    console.log('Cache cleared');
    mainWindow.loadURL(startUrl).catch(console.error);
  });

  // ================================
  // AUTO-RECOVER FROM WHITE SCREEN
  // ================================
  mainWindow.webContents.on('render-process-gone', (event, details) => {
    console.error('Renderer crashed:', details);

    setTimeout(() => {
      if (!mainWindow.isDestroyed()) {
        console.log('Reloading after renderer crash...');
        mainWindow.reload();
      }
    }, 1000);
  });

  mainWindow.webContents.on('unresponsive', () => {
    console.warn('Renderer unresponsive – reloading');
    mainWindow.reload();
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

ipcMain.handle('save-settings', async (event, newSettings) => {
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
