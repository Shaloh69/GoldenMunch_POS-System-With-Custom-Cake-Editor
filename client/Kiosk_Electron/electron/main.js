// main.js — improved kiosk-safe launcher
// - show window only after first paint
// - better load-failure handling
// - renderer crash handling + cooldown reload
// - safe minimal IPC stubs for preload calls

const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const SettingsManager = require('./settings-manager');

const isDev = !app.isPackaged;
let mainWindow;
let settingsWindow;
let settingsManager;
let lastReloadTime = 0;

// ================================
// RECOMMENDED (conservative) GPU FLAGS
// Avoid fully disabling GPU rendering which can cause white/black frames.
// If you have known broken drivers, you can change/remove these.
// ================================
app.commandLine.appendSwitch('disable-software-rasterizer'); // avoid falling back to some software rasterizers

// If your environment absolutely requires more flags you can experiment,
// but avoid 'disable-gpu' and 'disable-gpu-compositing' unless tested.

// If running as root in a controlled kiosk environment:
if (process.getuid?.() === 0) {
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
    try {
      mainWindow.webContents.reloadIgnoringCache();
    } catch (err) {
      console.error('Reload failed:', err);
    }
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
    show: false, // do not show until it's ready-to-show
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  // Optional: open devtools in development to see errors (helpful while debugging)
  if (isDev) {
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  }

  const startUrl = settingsManager.getAppUrl(isDev);

  if (!startUrl) {
    console.log('No app URL configured, opening settings');
    openSettingsWindow();
    return;
  }

  // Prefer loading straight away. Only clear cache in dev to avoid race conditions on slow networks.
  const load = () => {
    mainWindow.loadURL(startUrl).catch((err) => {
      console.error('loadURL() failed:', err);
    });
  };

  if (isDev) {
    mainWindow.webContents.session.clearCache()
      .then(() => {
        console.log('Cache cleared (dev)');
        load();
      })
      .catch(err => {
        console.warn('Cache clear failed (dev):', err);
        load();
      });
  } else {
    load();
  }

  // Show the window only after the renderer has painted its first frame.
  // 'ready-to-show' is the best event for this.
  mainWindow.once('ready-to-show', () => {
    try {
      mainWindow.show();
      console.log('Main window shown (ready-to-show)');
    } catch (err) {
      console.warn('Error showing main window:', err);
    }
  });

  // ================================
  // HANDLE LOAD FAILURES (network / DNS / SSL / CSP etc.)
  // ================================
  mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL, isMainFrame) => {
    console.error('did-fail-load:', { errorCode, errorDescription, validatedURL, isMainFrame });
    // If main frame failed, show a simple fallback with a retry control.
    if (isMainFrame) {
      const errorHtml = `
        <html>
          <meta name="viewport" content="width=device-width,initial-scale=1" />
          <body style="background:#000;color:#fff;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;">
            <div style="text-align:center;max-width:90%;">
              <h2>Load failed</h2>
              <p>${String(errorDescription) || 'Unknown error'}</p>
              <p><button onclick="location.reload()" style="padding:12px 20px;font-size:16px;">Retry</button></p>
            </div>
          </body>
        </html>`;
      // Load fallback as a data URL
      mainWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(errorHtml)}`).catch(err => {
        console.error('Failed to load fallback HTML:', err);
      });
    }
    // Attempt a safe reload after a short delay (subject to cooldown)
    setTimeout(safeReload, 3000);
  });

  // ================================
  // RENDERER CRASH / KILLED HANDLING
  // ================================
  mainWindow.webContents.on('render-process-gone', (_event, details) => {
    console.error('Renderer process gone:', details);
    // Only attempt a reload on real crashes/kills, not on normal exits.
    if (details.reason === 'crashed' || details.reason === 'killed') {
      setTimeout(safeReload, 1500);
    }
  });

  // ================================
  // UNRESPONSIVE / RESPONSIVE events (no auto reload)
  // ================================
  mainWindow.webContents.on('unresponsive', () => {
    console.warn('Renderer temporarily unresponsive');
    // Do not auto-reload — allow the process time to recover.
  });

  mainWindow.webContents.on('responsive', () => {
    console.log('Renderer responsive again');
  });

  // Optional: track console messages from the renderer for easier debugging
  mainWindow.webContents.on('console-message', (_e, level, message, line, sourceId) => {
    console.log(`Renderer console (${level}) ${sourceId}:${line} - ${message}`);
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

  settingsWindow.loadFile('settings.html').catch(err => {
    console.error('Failed to load settings.html:', err);
  });

  settingsWindow.on('closed', () => {
    settingsWindow = null;
  });
}

// ================================
// IPC HANDLERS (including printer stubs used by preload.js)
// ================================
ipcMain.handle('open-settings', () => {
  openSettingsWindow();
});

ipcMain.handle('get-settings', () => {
  try {
    return settingsManager.getSettings();
  } catch (err) {
    console.error('get-settings failed:', err);
    return null;
  }
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
    console.error('get-app-version failed:', err);
    return { success: false, error: err.message };
  }
});

ipcMain.handle('open-payment', async (_event, data) => {
  console.log('Payment requested (stub):', data);
  return { success: false, message: 'Payment integration not implemented' };
});

// ---------------- Printer IPC stubs to match preload.js ----------------
ipcMain.handle('print-receipt', async (_event, orderData) => {
  console.log('print-receipt called (stub):', orderData);
  // TODO: implement actual printing integration. For now return success:false
  return { success: false, error: 'Printer not configured' };
});

ipcMain.handle('print-test', async () => {
  console.log('print-test called (stub)');
  return { success: false, error: 'Printer not configured' };
});

ipcMain.handle('print-daily-report', async (_event, reportData) => {
  console.log('print-daily-report called (stub):', reportData);
  return { success: false, error: 'Printer not configured' };
});

ipcMain.handle('printer-status', async () => {
  console.log('printer-status requested (stub)');
  return { online: false, message: 'Printer not configured' };
});
// ---------------------------------------------------------------------

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
