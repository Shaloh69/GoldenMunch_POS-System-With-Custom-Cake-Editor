const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electron', {
  // Printer API
  printer: {
    /**
     * Get printer status
     * @returns {Promise<{available: boolean, connected: boolean, config: any}>}
     */
    getStatus: () => ipcRenderer.invoke('printer:getStatus'),

    /**
     * Print order receipt
     * @param {Object} receiptData - Receipt data
     * @returns {Promise<{success: boolean, message?: string, error?: string}>}
     */
    printReceipt: (receiptData) =>
      ipcRenderer.invoke('printer:printReceipt', receiptData),

    /**
     * Print test receipt
     * @returns {Promise<{success: boolean, message?: string, error?: string}>}
     */
    printTest: () => ipcRenderer.invoke('printer:printTest'),

    /**
     * Print daily sales report
     * @param {Object} reportData - Report data
     * @returns {Promise<{success: boolean, message?: string, error?: string}>}
     */
    printDailyReport: (reportData) =>
      ipcRenderer.invoke('printer:printDailyReport', reportData),

    /**
     * Get list of available printers
     * @returns {Promise<Array<string>>}
     */
    getAvailablePrinters: () =>
      ipcRenderer.invoke('printer:getAvailablePrinters'),

    /**
     * Set printer name to use
     * @param {string} printerName - Printer name
     * @returns {Promise<{success: boolean, error?: string}>}
     */
    setPrinterName: (printerName) =>
      ipcRenderer.invoke('printer:setPrinterName', printerName),
  },

  // Settings API
  settings: {
    /**
     * Get a setting value
     * @param {string} key - Setting key
     * @returns {Promise<any>}
     */
    get: (key) => ipcRenderer.invoke('settings:get', key),

    /**
     * Set a setting value
     * @param {string} key - Setting key
     * @param {any} value - Setting value
     * @returns {Promise<{success: boolean}>}
     */
    set: (key, value) => ipcRenderer.invoke('settings:set', key, value),

    /**
     * Get all settings
     * @returns {Promise<Object>}
     */
    getAll: () => ipcRenderer.invoke('settings:getAll'),
  },
});

// Log when preload script is loaded
console.log('Preload script loaded - Electron API exposed to renderer');
