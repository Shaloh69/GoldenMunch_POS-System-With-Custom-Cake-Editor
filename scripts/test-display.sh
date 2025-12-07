#!/bin/bash

echo "=========================================="
echo "Display & X Server Diagnostic"
echo "=========================================="
echo ""

echo "1. Current user: $USER"
echo "2. DISPLAY variable: $DISPLAY"
echo "3. XDG_SESSION_TYPE: $XDG_SESSION_TYPE"
echo ""

echo "4. Testing X server with xset..."
if xset q &>/dev/null; then
    echo "✓ X server is accessible"
    xset q | head -5
else
    echo "✗ X server is NOT accessible"
    echo "  This might be the problem!"
fi
echo ""

echo "5. Checking running X processes..."
ps aux | grep -i "X\|xorg" | grep -v grep
echo ""

echo "6. Checking DISPLAY permissions..."
xhost 2>&1 || echo "xhost not available or access denied"
echo ""

echo "7. Testing if we can open windows..."
if command -v xeyes &> /dev/null; then
    echo "Opening xeyes for 3 seconds as a test..."
    timeout 3 xeyes &
    sleep 3
    echo "If you saw the xeyes window, X is working!"
else
    echo "xeyes not installed, skipping visual test"
fi
echo ""

echo "8. Electron availability..."
if command -v electron &> /dev/null; then
    echo "✓ Electron found at: $(which electron)"
    electron --version
else
    echo "✗ Electron NOT found in PATH"
fi
echo ""

echo "9. Checking Electron permissions..."
ls -la "$HOME/GoldenMunch_POS-System-With-Custom-Cake-Editor/client/Kiosk/node_modules/.bin/electron" 2>/dev/null || echo "Electron binary not found in node_modules"
echo ""

echo "=========================================="
echo "Diagnostic complete!"
echo "=========================================="
