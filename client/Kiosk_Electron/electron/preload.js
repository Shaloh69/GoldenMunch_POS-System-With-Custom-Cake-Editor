// preload.js — hardened, kiosk-safe

const { contextBridge, ipcRenderer } = require('electron');

// Helper: safe IPC invoke that never throws into the renderer
async function safeInvoke(channel, payload) {
  try {
    return await ipcRenderer.invoke(channel, payload);
  } catch (err) {
    console.error(`IPC invoke failed [${channel}]:`, err);
    return { success: false, error: err?.message || 'IPC failed' };
  }
}

contextBridge.exposeInMainWorld('electron', {
  // =========================
  // Printer API (safe stubs)
  // =========================
  printer: {
    printReceipt: (orderData) =>
      safeInvoke('print-receipt', orderData),

    printTest: () =>
      safeInvoke('print-test'),

    printDailyReport: (reportData) =>
      safeInvoke('print-daily-report', reportData),

    getStatus: () =>
      safeInvoke('printer-status'),
  },

  // =========================
  // App Info
  // =========================
  getAppVersion: () =>
    safeInvoke('get-app-version'),

  // =========================
  // Payment (future use)
  // =========================
  openPayment: (paymentData) =>
    safeInvoke('open-payment', paymentData),

  // =========================
  // Utility
  // =========================
  openSettings: () =>
    safeInvoke('open-settings'),
});

// =========================
// KIOSK HARDENING
// =========================
window.addEventListener('DOMContentLoaded', () => {
  try {
    // Disable text selection
    document.body.style.userSelect = 'none';
    document.body.style.webkitUserSelect = 'none';

    // Disable drag & drop
    document.addEventListener('dragover', e => e.preventDefault());
    document.addEventListener('drop', e => e.preventDefault());

    // Prevent context menu (right click)
    document.addEventListener('contextmenu', e => e.preventDefault());

  } catch (err) {
    console.warn('Preload DOMContentLoaded error:', err);
  }
});

// =========================
// OPTIONAL: renderer error logging
// =========================
window.addEventListener('error', (event) => {
  console.error('Renderer error:', event.message, event.filename, event.lineno);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});
