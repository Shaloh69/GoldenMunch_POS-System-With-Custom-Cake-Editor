# Manual Electron Installation Guide

If automatic Electron installation keeps failing due to network timeouts, you can install Electron manually.

## Method 1: Install Dependencies Without Electron First

This is the **recommended approach** if you're experiencing network issues:

```powershell
# Run the emergency fix script with SkipElectron flag
.\emergency-fix.ps1 -SkipElectron

# After other dependencies are installed, try Electron separately
npm install electron@34.0.0 --save-dev --fetch-timeout=600000
```

## Method 2: Download Electron Manually

If Method 1 still fails, download Electron manually:

### Step 1: Download Electron

1. Go to: https://github.com/electron/electron/releases/tag/v34.0.0

2. Download the appropriate file for your system:
   - **Windows 64-bit**: `electron-v34.0.0-win32-x64.zip`
   - **Windows ARM**: `electron-v34.0.0-win32-arm64.zip`

### Step 2: Extract and Place in Cache

```powershell
# Create a temporary directory
$tempDir = "$env:TEMP\electron-manual"
New-Item -ItemType Directory -Path $tempDir -Force

# Extract the downloaded zip file to temp directory
# (Use Windows Explorer or 7-Zip to extract electron-v34.0.0-win32-x64.zip to $tempDir)

# Find your npm cache directory
$npmCache = npm config get cache
Write-Host "npm cache location: $npmCache"

# The Electron binary should go to a specific cache location
# Create the directory structure
$electronCacheDir = "$env:LOCALAPPDATA\electron\Cache"
New-Item -ItemType Directory -Path $electronCacheDir -Force

# Copy the electron.exe to the cache
# Copy-Item "$tempDir\electron.exe" "$electronCacheDir\" -Force
```

### Step 3: Install Electron Package Without Binary Download

```powershell
# Set environment variable to skip binary download
$env:ELECTRON_SKIP_BINARY_DOWNLOAD = "1"

# Install Electron package (without downloading binary)
npm install electron@34.0.0 --save-dev --ignore-scripts

# Manually copy electron to node_modules
$electronModulePath = ".\node_modules\electron\dist"
New-Item -ItemType Directory -Path $electronModulePath -Force

# Extract electron zip to node_modules\electron\dist
# Use Windows Explorer or PowerShell:
Expand-Archive -Path "$env:USERPROFILE\Downloads\electron-v34.0.0-win32-x64.zip" -DestinationPath $electronModulePath -Force
```

### Step 4: Verify Installation

```powershell
# Check if Electron is installed correctly
npx electron --version
# Should output: v34.0.0
```

## Method 3: Use Different Mirror

Try different Electron mirrors if the default one doesn't work:

### Option A: npmmirror.com (China mirror - often faster)
```powershell
$env:ELECTRON_MIRROR = "https://npmmirror.com/mirrors/electron/"
npm install electron@34.0.0 --save-dev
```

### Option B: Taobao mirror
```powershell
$env:ELECTRON_MIRROR = "https://cdn.npmmirror.com/binaries/electron/"
npm install electron@34.0.0 --save-dev
```

### Option C: Use corporate proxy
If you're behind a corporate firewall:

```powershell
# Set proxy
npm config set proxy http://proxy.company.com:8080
npm config set https-proxy http://proxy.company.com:8080

# Install Electron
npm install electron@34.0.0 --save-dev
```

## Method 4: Install on Different Network

Sometimes the issue is network-related:

1. **Use mobile hotspot**: Connect your laptop to your phone's hotspot
2. **Use home network**: Try installation at home instead of office
3. **Use VPN**: Some VPNs provide better routing to GitHub/Electron servers

```powershell
# After switching networks
npm cache clean --force
npm install electron@34.0.0 --save-dev --fetch-timeout=600000
```

## Method 5: Install Electron Globally First

Sometimes installing globally first helps:

```powershell
# Install globally
npm install -g electron@34.0.0

# Then link it locally
npm link electron
```

## Troubleshooting

### Check Electron Version
```powershell
npx electron --version
```

### Check if Electron Binary Exists
```powershell
Test-Path .\node_modules\electron\dist\electron.exe
# Should return: True
```

### List Electron Files
```powershell
Get-ChildItem .\node_modules\electron\dist\
# Should show electron.exe and other files
```

### Re-run Electron Install Script
If Electron package is installed but binary is missing:

```powershell
cd .\node_modules\electron
node install.js
```

## After Successful Installation

Once Electron is installed, install remaining dependencies:

```powershell
# If you used --ignore-scripts earlier, run:
npm install

# Verify everything
npm run verify
```

## Still Having Issues?

### Enable Verbose Logging
```powershell
npm install electron@34.0.0 --save-dev --loglevel=verbose 2>&1 | Tee-Object -FilePath electron-install.log
```

Review `electron-install.log` to see where the download is failing.

### Check Firewall/Antivirus
- Temporarily disable antivirus
- Check Windows Firewall settings
- Add exception for npm, node, and electron

### System Requirements
- **Windows 10/11** (64-bit)
- **Node.js**: >= 18.17.0
- **npm**: >= 9.0.0
- **Internet connection**: Required for initial download
- **Disk space**: ~200MB for Electron

## Quick Reference

| Issue | Solution |
|-------|----------|
| Network timeout | Use `.\emergency-fix.ps1` with increased timeout |
| Corporate firewall | Use VPN or configure proxy |
| OneDrive locking files | Pause OneDrive or move project |
| Download interrupted | Use `npm run install:electron` with retries |
| Binary not found | Manually extract to `node_modules\electron\dist` |

---

**Last Updated**: 2025-11-17
