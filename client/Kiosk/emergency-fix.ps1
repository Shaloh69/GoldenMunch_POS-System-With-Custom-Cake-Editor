# Emergency Fix Script for Windows Installation Issues
# Run this in PowerShell as Administrator

param(
    [switch]$SkipElectron = $false,
    [switch]$UseManualElectron = $false
)

Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "GoldenMunch POS - Emergency Installation Fix" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "ERROR: This script must be run as Administrator!" -ForegroundColor Red
    Write-Host "Right-click PowerShell and select 'Run as Administrator'" -ForegroundColor Yellow
    exit 1
}

Write-Host "✓ Running as Administrator" -ForegroundColor Green
Write-Host ""

# Step 1: Pause OneDrive if running
Write-Host "Step 1: Pausing OneDrive sync..." -ForegroundColor Yellow
$oneDriveProcess = Get-Process OneDrive -ErrorAction SilentlyContinue
if ($oneDriveProcess) {
    Write-Host "  OneDrive is running. Attempting to pause sync..." -ForegroundColor Gray
    # Try to stop OneDrive gracefully
    Stop-Process -Name OneDrive -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
    Write-Host "  ✓ OneDrive paused" -ForegroundColor Green
} else {
    Write-Host "  ✓ OneDrive not running" -ForegroundColor Green
}
Write-Host ""

# Step 2: Kill any processes that might lock files
Write-Host "Step 2: Closing applications that might lock files..." -ForegroundColor Yellow
$processesToKill = @('Code', 'node', 'electron')
foreach ($proc in $processesToKill) {
    $running = Get-Process $proc -ErrorAction SilentlyContinue
    if ($running) {
        Write-Host "  Stopping $proc..." -ForegroundColor Gray
        Stop-Process -Name $proc -Force -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 1
    }
}
Write-Host "  ✓ Processes closed" -ForegroundColor Green
Write-Host ""

# Step 3: Clean node_modules
Write-Host "Step 3: Cleaning node_modules..." -ForegroundColor Yellow
$nodeModulesPath = ".\node_modules"
$packageLockPath = ".\package-lock.json"

if (Test-Path $nodeModulesPath) {
    Write-Host "  Removing node_modules (this may take a while)..." -ForegroundColor Gray

    # Method 1: Try normal removal
    try {
        Remove-Item -Path $nodeModulesPath -Recurse -Force -ErrorAction Stop
        Write-Host "  ✓ node_modules removed successfully" -ForegroundColor Green
    } catch {
        Write-Host "  Normal removal failed. Trying robocopy method..." -ForegroundColor Yellow

        # Method 2: Use robocopy to mirror an empty directory (fastest way to delete on Windows)
        $emptyDir = ".\empty_temp_dir"
        New-Item -ItemType Directory -Path $emptyDir -Force | Out-Null
        robocopy $emptyDir $nodeModulesPath /MIR /R:0 /W:0 /NFL /NDL /NJH /NJS /NC /NS /NP | Out-Null
        Remove-Item -Path $nodeModulesPath -Force -ErrorAction SilentlyContinue
        Remove-Item -Path $emptyDir -Force -ErrorAction SilentlyContinue

        if (Test-Path $nodeModulesPath) {
            Write-Host "  ⚠ Some files couldn't be removed. Continuing anyway..." -ForegroundColor Yellow
        } else {
            Write-Host "  ✓ node_modules removed using robocopy" -ForegroundColor Green
        }
    }
} else {
    Write-Host "  ✓ node_modules doesn't exist" -ForegroundColor Green
}

if (Test-Path $packageLockPath) {
    Remove-Item -Path $packageLockPath -Force -ErrorAction SilentlyContinue
    Write-Host "  ✓ package-lock.json removed" -ForegroundColor Green
}
Write-Host ""

# Step 4: Clear npm cache
Write-Host "Step 4: Clearing npm cache..." -ForegroundColor Yellow
npm cache clean --force
Write-Host "  ✓ npm cache cleared" -ForegroundColor Green
Write-Host ""

# Step 5: Set Electron environment variables
Write-Host "Step 5: Configuring Electron download..." -ForegroundColor Yellow
$env:ELECTRON_MIRROR = "https://npmmirror.com/mirrors/electron/"
$env:ELECTRON_CUSTOM_DIR = "{{ version }}"
$env:ELECTRON_SKIP_BINARY_DOWNLOAD = if ($SkipElectron) { "1" } else { "" }
Write-Host "  ✓ Electron mirror set to: $env:ELECTRON_MIRROR" -ForegroundColor Green
Write-Host ""

# Step 6: Install dependencies
Write-Host "Step 6: Installing dependencies..." -ForegroundColor Yellow
Write-Host ""

if ($SkipElectron) {
    Write-Host "  Installing without Electron (you'll need to install it later)..." -ForegroundColor Yellow
    npm install --ignore-scripts
} elseif ($UseManualElectron) {
    Write-Host "  Skipping Electron download. You need to install it manually." -ForegroundColor Yellow
    npm install --ignore-scripts
} else {
    Write-Host "  Installing all dependencies (this may take 5-10 minutes)..." -ForegroundColor Yellow
    npm install --fetch-timeout=600000 --fetch-retries=10 --loglevel=info
}

$installExitCode = $LASTEXITCODE

Write-Host ""

if ($installExitCode -eq 0) {
    Write-Host "===============================================" -ForegroundColor Green
    Write-Host "✓ Installation completed successfully!" -ForegroundColor Green
    Write-Host "===============================================" -ForegroundColor Green
    Write-Host ""

    # Restart OneDrive if it was running
    if ($oneDriveProcess) {
        Write-Host "Restarting OneDrive..." -ForegroundColor Yellow
        Start-Process "$env:LOCALAPPDATA\Microsoft\OneDrive\OneDrive.exe"
        Write-Host "✓ OneDrive restarted" -ForegroundColor Green
    }

    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "1. Verify installation: npm run verify" -ForegroundColor White
    Write-Host "2. Start development: npm run dev" -ForegroundColor White

} else {
    Write-Host "===============================================" -ForegroundColor Red
    Write-Host "✗ Installation failed" -ForegroundColor Red
    Write-Host "===============================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Troubleshooting options:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "1. If Electron download failed, try installing without it:" -ForegroundColor White
    Write-Host "   .\emergency-fix.ps1 -SkipElectron" -ForegroundColor Cyan
    Write-Host "   Then install Electron separately:" -ForegroundColor White
    Write-Host "   npm run install:electron" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "2. Check your network connection and try again" -ForegroundColor White
    Write-Host ""
    Write-Host "3. Try using a VPN or different network" -ForegroundColor White
    Write-Host ""
    Write-Host "4. Move the project out of OneDrive:" -ForegroundColor White
    Write-Host "   - Copy project to C:\Projects\" -ForegroundColor Cyan
    Write-Host "   - Run this script again from the new location" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "5. See NPM_TROUBLESHOOTING.md for more solutions" -ForegroundColor White

    # Restart OneDrive even on failure
    if ($oneDriveProcess) {
        Write-Host ""
        Write-Host "Restarting OneDrive..." -ForegroundColor Yellow
        Start-Process "$env:LOCALAPPDATA\Microsoft\OneDrive\OneDrive.exe"
    }
}

Write-Host ""
