const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

let mainWindow;
let heartbeatWindow;
let lastPong = Date.now();
let recovering = false;

// ⚠️ IMPORTANT: call BEFORE app.whenReady()
app.disableHardwareAcceleration();
app.commandLine.appendSwitch('enable-logging');

function createMainWindow() {
  mainWindow = new BrowserWindow({
    fullscreen: true,
    kiosk: true,
    frame: false,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    }
  });

  mainWindow.loadURL('YOUR_URL_HERE');

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // 🔁 Renderer crash recovery
  mainWindow.webContents.on('render-process-gone', (e, details) => {
    console.error('Renderer crashed:', details);
    recover('render-process-gone');
  });

  // ❌ Failed load recovery
  mainWindow.webContents.on('did-fail-load', (e, code, desc) => {
    console.error('Load failed:', code, desc);
    recover('did-fail-load');
  });

  // 🧊 Unresponsive recovery
  mainWindow.on('unresponsive', () => {
    console.error('Window unresponsive');
    recover('unresponsive');
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// 👁️ Hidden heartbeat overlay
function createHeartbeatWindow() {
  heartbeatWindow = new BrowserWindow({
    width: 1,
    height: 1,
    x: 0,
    y: 0,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    show: true,
    focusable: false,
    webPreferences: {
      contextIsolation: true,
    }
  });

  heartbeatWindow.loadURL(
    `data:text/html,
     <html>
       <body>
         <script>
           setInterval(() => {
             try { window.location.hash = Date.now(); } catch(e) {}
           }, 1000);
         </script>
       </body>
     </html>`
  );

  heartbeatWindow.on('unresponsive', () => {
    console.error('Heartbeat window frozen — relaunching app');
    relaunchApp();
  });
}

// 🔄 Unified recovery logic
function recover(reason) {
  if (recovering) return;
  recovering = true;

  console.error('Recovering from:', reason);

  setTimeout(() => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.reload();
    }
    recovering = false;
  }, 3000);
}

// 💓 Renderer heartbeat
ipcMain.on('pong', () => {
  lastPong = Date.now();
});

// Watchdog: reload if renderer freezes
setInterval(() => {
  if (Date.now() - lastPong > 60000) {
    console.error('Renderer heartbeat lost — reloading');
    recover('heartbeat-timeout');
  }

  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('ping');
  }
}, 30000);

// 🔁 Hard relaunch fallback
function relaunchApp() {
  app.relaunch();
  app.exit(0);
}

app.whenReady().then(() => {
  createMainWindow();
  createHeartbeatWindow();
});

app.on('window-all-closed', () => {
  // Kiosk app should stay alive
});
