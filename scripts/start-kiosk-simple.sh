#!/bin/bash

echo "=========================================="
echo "Simplified Kiosk Startup (for testing)"
echo "=========================================="
echo ""

# Log file location
LOGFILE="$HOME/kiosk-startup-simple.log"
exec > >(tee -a "$LOGFILE") 2>&1

echo "Time: $(date)"

# Detect script location and navigate to Kiosk directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
KIOSK_DIR="$REPO_ROOT/client/Kiosk"

echo "Repository root: $REPO_ROOT"
echo "Kiosk directory: $KIOSK_DIR"
echo "User: $USER"
echo "Display: $DISPLAY"

cd "$KIOSK_DIR" || exit 1

echo ""
echo "Step 1: Starting Next.js dev server in background..."
npm run dev &
NEXT_PID=$!
echo "Next.js PID: $NEXT_PID"

echo ""
echo "Step 2: Waiting for Next.js to be ready..."
sleep 10

echo ""
echo "Step 3: Checking if Next.js is running..."
if curl -s http://localhost:3002 > /dev/null; then
    echo "✓ Next.js is responding on http://localhost:3002"
else
    echo "✗ Next.js is NOT responding"
fi

echo ""
echo "Step 4: Starting Electron..."
echo "DISPLAY=$DISPLAY"

# Use npx to find electron in node_modules or use the direct path
echo "Using software rendering (no GPU for Raspberry Pi compatibility)"
if [ -f "./node_modules/.bin/electron" ]; then
    echo "Using local electron from node_modules"
    echo "Command: ./node_modules/.bin/electron . --disable-gpu --no-sandbox"
    DISPLAY=:0 ./node_modules/.bin/electron . --disable-gpu --no-sandbox
elif command -v npx &> /dev/null; then
    echo "Using npx to run electron"
    echo "Command: npx electron . --disable-gpu --no-sandbox"
    DISPLAY=:0 npx electron . --disable-gpu --no-sandbox
else
    echo "ERROR: Electron not found!"
    echo "Please run: npm install"
    exit 1
fi

echo ""
echo "Electron exited. Stopping Next.js..."
kill $NEXT_PID 2>/dev/null
