const { contextBridge, ipcRenderer } = require('electron');

/**
 * Preload script for settings window
 * Exposes safe IPC methods to the settings UI
 */
contextBridge.exposeInMainWorld('electronSettings', {
  /**
   * Get current settings
   */
  getSettings: () => ipcRenderer.invoke('get-settings'),

  /**
   * Save settings
   */
  saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),

  /**
   * Close settings window
   */
  closeSettings: () => ipcRenderer.send('close-settings'),

  /**
   * Reload the main application
   */
  reloadApp: () => ipcRenderer.send('reload-app'),
});
