#!/bin/bash

echo "=========================================="
echo "GoldenMunch Kiosk - Complete Reinstall"
echo "=========================================="
echo ""

# Detect script location and navigate to Kiosk directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
KIOSK_DIR="$REPO_ROOT/client/Kiosk"

cd "$KIOSK_DIR" || exit 1

echo "Current directory: $(pwd)"
echo ""

echo "Step 1: Cleaning old installation..."
echo "Removing node_modules and package-lock.json..."
rm -rf node_modules package-lock.json
echo "✓ Cleanup complete"
echo ""

echo "Step 2: Clearing npm cache..."
npm cache clean --force
echo "✓ Cache cleared"
echo ""

echo "Step 3: Installing dependencies (this will take a few minutes)..."
npm install
echo ""

if [ $? -eq 0 ]; then
    echo "✓ Installation successful!"
    echo ""

    echo "Step 4: Verifying Electron..."
    if [ -f "./node_modules/.bin/electron" ]; then
        echo "✓ Electron binary found"
        ./node_modules/.bin/electron --version 2>&1 || echo "! Electron version check failed (this is OK)"
    else
        echo "! Electron binary not found, but might work with npx"
    fi
    echo ""

    echo "=========================================="
    echo "Installation Complete!"
    echo "=========================================="
    echo ""
    echo "You can now start the kiosk with:"
    echo "  bash $REPO_ROOT/scripts/start-kiosk-npx.sh"
    echo ""
else
    echo "✗ Installation failed!"
    echo "Check the errors above."
    exit 1
fi
