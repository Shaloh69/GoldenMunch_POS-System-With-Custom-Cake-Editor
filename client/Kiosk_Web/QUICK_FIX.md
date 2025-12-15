# 🚀 Quick Fix - Get Running NOW!

You're experiencing OneDrive file locks and Electron download timeouts. Here's the fastest way to fix it.

## ⚡ Option 1: Use Emergency Fix Script (RECOMMENDED)

This PowerShell script handles everything automatically:

```powershell
# 1. Close ALL applications (VS Code, File Explorer, etc.)

# 2. Open PowerShell as Administrator
#    Right-click PowerShell → "Run as Administrator"

# 3. Navigate to Kiosk directory
cd C:\Users\Shaloh\OneDrive\Desktop\Projects\Thesis\GoldenMunchPOS\client\Kiosk

# 4. Run the emergency fix
.\emergency-fix.ps1
```

The script will:
- ✓ Pause OneDrive automatically
- ✓ Close file-locking applications
- ✓ Clean node_modules properly
- ✓ Set up Electron mirrors
- ✓ Install all dependencies
- ✓ Restart OneDrive when done

**If Electron still fails**, run with skip flag:
```powershell
.\emergency-fix.ps1 -SkipElectron
```

Then install Electron separately:
```powershell
npm run install:electron
```

## ⚡ Option 2: Manual Steps (If script doesn't work)

### Step 1: Close Everything & Pause OneDrive
```powershell
# Close VS Code, File Explorer, and any editors
# Right-click OneDrive icon in system tray → Pause syncing → 2 hours
```

### Step 2: Open PowerShell as Admin
```powershell
# Right-click PowerShell → Run as Administrator
cd C:\Users\Shaloh\OneDrive\Desktop\Projects\Thesis\GoldenMunchPOS\client\Kiosk
```

### Step 3: Force Clean (robocopy method - fastest!)
```powershell
# Create empty directory
mkdir empty_temp

# Mirror empty directory to node_modules (deletes everything)
robocopy empty_temp node_modules /MIR /R:0 /W:0

# Clean up
rmdir /s /q node_modules
rmdir /s /q empty_temp
del package-lock.json

# Clear npm cache
npm cache clean --force
```

### Step 4: Set Electron Mirror
```powershell
$env:ELECTRON_MIRROR="https://npmmirror.com/mirrors/electron/"
```

### Step 5: Install
```powershell
npm install --fetch-timeout=600000 --fetch-retries=10
```

## ⚡ Option 3: Move Out of OneDrive (BEST LONG-TERM FIX)

OneDrive sync constantly locks files. Moving your project is the most reliable solution:

```powershell
# 1. Create a local projects folder
mkdir C:\Projects

# 2. Move your project
# Either manually copy the folder, or:
Move-Item "C:\Users\Shaloh\OneDrive\Desktop\Projects\Thesis\GoldenMunchPOS" "C:\Projects\GoldenMunchPOS"

# 3. Navigate to new location
cd C:\Projects\GoldenMunchPOS\client\Kiosk

# 4. Install (will work smoothly without OneDrive)
npm install
```

## 🆘 If All Else Fails

### Last Resort: Skip Electron Entirely
```powershell
# Install everything except Electron
$env:ELECTRON_SKIP_BINARY_DOWNLOAD="1"
npm install --ignore-scripts

# Manually install Electron later (see ELECTRON_MANUAL_INSTALL.md)
```

### Network Issues?
```powershell
# Try mobile hotspot
# Connect your laptop to phone's internet and retry

# Or use VPN
# Some VPNs have better routes to download servers
```

## ✅ Verify Installation

After successful install:
```powershell
npm run verify
```

Should show:
```
✓ List of all packages
✓ Electron v34.x.x
```

## 📊 What's New in This Update?

The latest updates include:
- ✅ Fixed deprecation warnings (glob, rimraf, uuid, etc.)
- ✅ Added emergency fix script
- ✅ Increased timeouts to 600 seconds
- ✅ Added Electron mirrors
- ✅ Added 10 retry attempts
- ✅ Better OneDrive handling

## 🔍 Common Error Solutions

| Error | Quick Fix |
|-------|-----------|
| `EPERM: operation not permitted` | Run as Admin + pause OneDrive |
| `ETIMEDOUT` | Use `.\emergency-fix.ps1` or mobile hotspot |
| `Cannot find module 'electron'` | `npm run install:electron` |
| `npm cache verify failed` | `npm cache clean --force` |

## 📞 Need More Help?

- **Detailed troubleshooting**: See `NPM_TROUBLESHOOTING.md`
- **Manual Electron install**: See `ELECTRON_MANUAL_INSTALL.md`
- **Windows guide**: See `WINDOWS_INSTALL.md`

---

**TL;DR**: Run `.\emergency-fix.ps1` as Administrator. If that fails, move project out of OneDrive to `C:\Projects\`.
