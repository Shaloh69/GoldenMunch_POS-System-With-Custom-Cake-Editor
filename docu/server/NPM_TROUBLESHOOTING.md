# NPM Installation Troubleshooting Guide

This guide addresses common npm installation issues, specifically for the GoldenMunch POS system.

## Recent Updates (2025-11-17)

### ✅ Deprecated Dependencies Fixed

The following deprecated dependencies have been addressed via npm overrides in `package.json`:

- **glob**: Updated from v7.x/v8.x to v11.x
- **rimraf**: Updated from v3.x to v6.x
- **uuid**: Updated from v3.x to v11.x
- **request**: Replaced with no-op package (deprecated, not needed)
- **are-we-there-yet**: Replaced with no-op package (no longer supported)
- **gauge**: Replaced with no-op package (no longer supported)
- **boolean**: Replaced with no-op package (no longer supported)

## Common Issues and Solutions

### 1. Windows Permission Errors (EPERM)

**Symptoms:**
```
npm warn cleanup Failed to remove some directories
Error: EPERM: operation not permitted, rmdir
```

**Solutions:**

#### Option A: Run as Administrator
1. Close all applications that might be using the files (VS Code, file explorers, etc.)
2. Open Command Prompt or PowerShell **as Administrator**
3. Navigate to the Kiosk directory
4. Run the installation commands

#### Option B: Use Windows-Specific Clean Script
```bash
npm run fresh-install:win
```

#### Option C: Manual Cleanup
If the above doesn't work:

1. **Close all applications** (especially VS Code, editors, file explorers)
2. **Restart your computer** (this releases all file locks)
3. **Delete node_modules manually:**
   ```powershell
   # In PowerShell (as Administrator)
   cd C:\Users\Shaloh\OneDrive\Desktop\Projects\Thesis\GoldenMunchPOS\client\Kiosk
   Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
   Remove-Item -Force package-lock.json -ErrorAction SilentlyContinue
   ```
4. **Install again:**
   ```bash
   npm install
   ```

#### Option D: Use npm cache clean
```bash
npm cache clean --force
npm install
```

### 2. Electron Download Timeout

**Symptoms:**
```
npm error RequestError
npm error AggregateError [ETIMEDOUT]
```

**Solutions:**

#### Option A: Use Electron Mirror (Recommended)
The `.npmrc` file in the Kiosk directory now includes Electron mirror configuration. If you're still having issues:

```bash
# Set environment variable for Electron mirror
set ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/
npm install
```

Or for PowerShell:
```powershell
$env:ELECTRON_MIRROR="https://npmmirror.com/mirrors/electron/"
npm install
```

#### Option B: Install Electron Separately
```bash
# Install Electron separately with increased timeout
npm install electron --save-dev --fetch-timeout=600000 --fetch-retries=10

# Then install the rest
npm install
```

#### Option C: Use a VPN or Different Network
Sometimes corporate firewalls or network restrictions block Electron downloads. Try:
- Switching to a different network (mobile hotspot, home network)
- Using a VPN
- Asking your IT department to whitelist Electron download URLs

#### Option D: Download Electron Manually
1. Download Electron manually from: https://github.com/electron/electron/releases
2. Place it in npm cache:
   ```bash
   # Find your cache directory
   npm config get cache

   # Place the downloaded file in:
   # %LOCALAPPDATA%\npm-cache\_cacache\
   ```

### 3. Network Issues in General

**Solutions:**

```bash
# Use increased timeouts (already configured in .npmrc)
npm install --fetch-timeout=300000 --fetch-retries=5

# Or clear cache and retry
npm cache clean --force
npm install
```

### 4. OneDrive Sync Issues

**Symptom:** Your project is in OneDrive and files are being locked or synced during installation.

**Solutions:**

#### Option A: Pause OneDrive Sync
1. Right-click OneDrive icon in system tray
2. Click "Pause syncing" → "2 hours"
3. Run npm install
4. Resume syncing after installation

#### Option B: Move Project Out of OneDrive
```bash
# Move project to a local directory (not in OneDrive)
# For example: C:\Projects\GoldenMunchPOS
```

Add `node_modules` to OneDrive exclusions if keeping project in OneDrive:
1. OneDrive Settings → Backup → Manage backup
2. Exclude `node_modules` folders

### 5. Path Too Long Error (Windows)

**Symptom:**
```
Error: EPERM: path too long
```

**Solutions:**

#### Option A: Enable Long Paths in Windows 10/11
1. Open Registry Editor (regedit)
2. Navigate to: `HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\Control\FileSystem`
3. Set `LongPathsEnabled` to `1`
4. Restart your computer

#### Option B: Move Project Closer to Root
```bash
# Move project to C:\Projects instead of deeply nested paths
```

## Installation Steps (Recommended Order)

### For First-Time Setup:

1. **Close all applications** (VS Code, editors, file explorers)

2. **Navigate to Kiosk directory:**
   ```bash
   cd client/Kiosk
   ```

3. **Clean previous installations (Windows):**
   ```bash
   npm run clean:win
   ```

4. **Install with verbose output:**
   ```bash
   npm install --verbose
   ```

### For Server:

1. **Navigate to server directory:**
   ```bash
   cd server
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

## Verification

After successful installation:

```bash
# Verify Electron installation
cd client/Kiosk
npx electron --version

# Verify TypeScript compilation
cd server
npm run build
```

## Still Having Issues?

### Enable Verbose Logging

```bash
npm install --loglevel=verbose 2>&1 | Tee-Object -FilePath npm-install.log
```

This creates a log file you can review or share for troubleshooting.

### Check Node/NPM Versions

```bash
node --version   # Should be >= 18.17.0
npm --version    # Should be >= 9.0.0
```

Update if needed:
```bash
# Update npm
npm install -g npm@latest

# Update Node.js - download from https://nodejs.org/
```

### System Requirements

- **Node.js**: >= 18.17.0
- **NPM**: >= 9.0.0
- **Operating System**: Windows 10/11, macOS, or Linux
- **Internet**: Required for initial package downloads
- **Disk Space**: ~2GB free for node_modules

## Prevention Tips

1. **Always close editors** before running npm install
2. **Don't run multiple npm commands** simultaneously
3. **Use npm ci** for clean installs in CI/CD: `npm ci`
4. **Keep npm and Node.js updated**
5. **Add node_modules to antivirus exclusions** if using Windows Defender
6. **Use npm workspaces** for mono-repo management (future consideration)

## Additional Resources

- [npm Documentation](https://docs.npmjs.com/)
- [Electron Installation Guide](https://www.electronjs.org/docs/latest/tutorial/installation)
- [Node.js Download](https://nodejs.org/)
- [Windows Long Path Fix](https://learn.microsoft.com/en-us/windows/win32/fileio/maximum-file-path-limitation)

---

**Last Updated**: 2025-11-17
**Version**: 1.0.0
