const fs = require('fs');
const path = require('path');
const { app } = require('electron');

/**
 * Settings Manager
 * Manages kiosk configuration settings (URL, etc.)
 */
class SettingsManager {
  constructor() {
    // Store settings in userData directory
    this.settingsPath = path.join(app.getPath('userData'), 'kiosk-config.json');
    this.settings = this.loadSettings();
  }

  /**
   * Load settings from file
   */
  loadSettings() {
    try {
      if (fs.existsSync(this.settingsPath)) {
        const data = fs.readFileSync(this.settingsPath, 'utf8');
        const settings = JSON.parse(data);
        console.log('Settings loaded:', settings);
        return settings;
      } else {
        console.log('No settings file found, using defaults');
        return this.getDefaultSettings();
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      return this.getDefaultSettings();
    }
  }

  /**
   * Get default settings
   */
  getDefaultSettings() {
    return {
      appUrl: null, // Will be configured via settings panel
      lastUpdated: new Date().toISOString(),
    };
  }

  /**
   * Save settings to file
   */
  saveSettings(newSettings) {
    try {
      // Merge with existing settings
      this.settings = {
        ...this.settings,
        ...newSettings,
        lastUpdated: new Date().toISOString(),
      };

      // Ensure userData directory exists
      const userDataDir = app.getPath('userData');
      if (!fs.existsSync(userDataDir)) {
        fs.mkdirSync(userDataDir, { recursive: true });
      }

      // Write to file
      fs.writeFileSync(
        this.settingsPath,
        JSON.stringify(this.settings, null, 2),
        'utf8'
      );

      console.log('Settings saved:', this.settings);
      return true;
    } catch (error) {
      console.error('Error saving settings:', error);
      throw error;
    }
  }

  /**
   * Get current settings
   */
  getSettings() {
    return { ...this.settings };
  }

  /**
   * Get the app URL to load
   * Priority: Configured URL > Environment variable > Development default
   */
  getAppUrl(isDev) {
    // 1. Check configured URL
    if (this.settings.appUrl) {
      console.log('Using configured URL:', this.settings.appUrl);
      return this.settings.appUrl;
    }

    // 2. Check environment variable
    if (process.env.KIOSK_APP_URL) {
      console.log('Using environment variable URL:', process.env.KIOSK_APP_URL);
      return process.env.KIOSK_APP_URL;
    }

    // 3. Development default
    if (isDev) {
      console.log('Using development URL: http://localhost:3002');
      return 'http://localhost:3002';
    }

    // 4. No URL configured
    console.warn('No app URL configured! Please set via Settings (Ctrl+Shift+C)');
    return null;
  }

  /**
   * Check if settings are valid
   */
  isConfigured() {
    return this.settings.appUrl !== null && this.settings.appUrl !== '';
  }
}

module.exports = SettingsManager;
