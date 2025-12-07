#!/bin/bash

echo "=========================================="
echo "Electron Installation Check & Repair"
echo "=========================================="
echo ""

# Detect script location and navigate to Kiosk directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
KIOSK_DIR="$REPO_ROOT/client/Kiosk"

cd "$KIOSK_DIR" || exit 1

echo "Current directory: $(pwd)"
echo "Architecture: $(uname -m)"
echo "OS: $(uname -s)"
echo ""

echo "1. Checking if Electron binary exists..."
if [ -f "./node_modules/.bin/electron" ]; then
    echo "✓ Electron binary found"
    ls -lh ./node_modules/.bin/electron
else
    echo "✗ Electron binary NOT found"
fi
echo ""

echo "2. Checking Electron package..."
if [ -d "./node_modules/electron" ]; then
    echo "✓ Electron package installed"
    if [ -f "./node_modules/electron/package.json" ]; then
        ELECTRON_VERSION=$(node -p "require('./node_modules/electron/package.json').version" 2>/dev/null)
        echo "  Version: $ELECTRON_VERSION"
    fi
else
    echo "✗ Electron package NOT installed"
fi
echo ""

echo "3. Testing Electron..."
if [ -f "./node_modules/.bin/electron" ]; then
    echo "Attempting to run: ./node_modules/.bin/electron --version"
    ./node_modules/.bin/electron --version 2>&1 || echo "Failed to run Electron"
elif command -v npx &> /dev/null; then
    echo "Attempting to run: npx electron --version"
    npx electron --version 2>&1 || echo "Failed to run Electron via npx"
fi
echo ""

echo "=========================================="
echo "If Electron is not working, try these fixes:"
echo "=========================================="
echo ""
echo "Option 1: Rebuild Electron for your architecture"
echo "  cd $KIOSK_DIR"
echo "  npm rebuild electron"
echo ""
echo "Option 2: Reinstall Electron"
echo "  cd $KIOSK_DIR"
echo "  npm uninstall electron"
echo "  npm install electron --save-dev"
echo ""
echo "Option 3: Clear cache and reinstall everything"
echo "  cd $KIOSK_DIR"
echo "  rm -rf node_modules package-lock.json"
echo "  npm install"
echo ""
