# Windows Installation Quick Guide

## Quick Fix for Current Issues

If you're seeing permission errors and Electron timeout issues, follow these steps:

### Step 1: Close Everything
- Close VS Code, file explorers, and any other applications
- This releases file locks on node_modules

### Step 2: Open PowerShell as Administrator
```powershell
# Right-click PowerShell and select "Run as Administrator"
```

### Step 3: Navigate to Kiosk Directory
```powershell
cd "C:\Users\Shaloh\OneDrive\Desktop\Projects\Thesis\GoldenMunchPOS\client\Kiosk"
```

### Step 4: Clean Installation
```powershell
# If OneDrive is syncing, pause it first
# Right-click OneDrive icon → Pause syncing → 2 hours

# Clean old installation
npm run clean:win

# Install with safe settings
npm run install:safe
```

### If Electron Still Fails

```powershell
# Set Electron mirror
$env:ELECTRON_MIRROR="https://npmmirror.com/mirrors/electron/"

# Install Electron separately
npm run install:electron

# Then install the rest
npm install
```

## Alternative: Move Project Out of OneDrive

OneDrive sync can interfere with npm installations. Consider moving your project:

```powershell
# Create a local projects folder
mkdir C:\Projects

# Move your project (or create a new clone)
# This avoids OneDrive sync conflicts
```

## Common Commands Reference

```bash
# Clean and fresh install (Windows)
npm run fresh-install:win

# Install with increased timeouts
npm run install:safe

# Install Electron separately
npm run install:electron

# Verify installation
npm run verify

# Check for issues
npm run troubleshoot
```

## Server Installation

```powershell
cd ..\..\server
npm install
```

The server has fewer dependencies and should install without issues.

## Verify Everything Works

```powershell
# In Kiosk directory
npm run verify

# Should show:
# - List of installed packages
# - Electron version number
```

## Still Having Issues?

See the detailed [NPM_TROUBLESHOOTING.md](./NPM_TROUBLESHOOTING.md) guide for comprehensive solutions.

### Quick Diagnostics

```powershell
# Check Node and npm versions
node --version   # Should be >= 18.17.0
npm --version    # Should be >= 9.0.0

# Check npm cache
npm cache verify

# View detailed logs
npm install --loglevel=verbose 2>&1 | Tee-Object -FilePath npm-install.log
```

## What Changed?

The package.json files now include:
- ✅ **Updated deprecated dependencies** via npm overrides
- ✅ **Electron mirror configuration** in .npmrc
- ✅ **Increased timeouts** for network operations
- ✅ **Helper scripts** for easier installation

These changes address:
- Deprecated glob, rimraf, uuid packages
- Electron download timeouts
- Windows permission issues

---

**Need Help?** Check NPM_TROUBLESHOOTING.md for detailed troubleshooting steps.
