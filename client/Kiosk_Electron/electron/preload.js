const { contextBridge, ipcRenderer } = require('electron');
const { ipcRenderer } = require('electron');

ipcRenderer.on('ping', () => {
  ipcRenderer.send('pong');
});
// Expose protected methods that allow the renderer process to use
// ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electron', {
  // Add any electron APIs you need to expose to the renderer
  // For security, only expose specific functions you need

  // Printer Functions
  printer: {
    // Print order receipt
    printReceipt: (orderData) => ipcRenderer.invoke('print-receipt', orderData),

    // Print test receipt
    printTest: () => ipcRenderer.invoke('print-test'),

    // Print daily report
    printDailyReport: (reportData) => ipcRenderer.invoke('print-daily-report', reportData),

    // Get printer status
    getStatus: () => ipcRenderer.invoke('printer-status'),
  },

  // App Functions
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),

  // Payment Functions (for future integration)
  openPayment: (paymentData) => ipcRenderer.invoke('open-payment', paymentData),
});

// Optional: Disable specific features
window.addEventListener('DOMContentLoaded', () => {
  // Disable text selection for kiosk mode
  document.body.style.userSelect = 'none';
  document.body.style.webkitUserSelect = 'none';

  // Disable drag and drop
  document.addEventListener('dragover', (e) => e.preventDefault());
  document.addEventListener('drop', (e) => e.preventDefault());
});
