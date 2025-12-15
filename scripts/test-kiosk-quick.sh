#!/bin/bash

echo "=========================================="
echo "GoldenMunch Kiosk - Quick Test"
echo "=========================================="

# CRITICAL: Set all environment variables to prevent DRM/GBM errors
export ELECTRON_OZONE_PLATFORM_HINT=x11
export DISPLAY="${DISPLAY:-:0}"
export ELECTRON_DISABLE_GPU=1
export LIBGL_ALWAYS_SOFTWARE=1
export GALLIUM_DRIVER=llvmpipe
export GBM_BACKEND=dummy
export MESA_LOADER_DRIVER_OVERRIDE=swrast
export __GLX_VENDOR_LIBRARY_NAME=mesa

echo "Environment Variables:"
echo "  DISPLAY: $DISPLAY"
echo "  ELECTRON_OZONE_PLATFORM_HINT: $ELECTRON_OZONE_PLATFORM_HINT"
echo "  ELECTRON_DISABLE_GPU: $ELECTRON_DISABLE_GPU"
echo "  LIBGL_ALWAYS_SOFTWARE: $LIBGL_ALWAYS_SOFTWARE"
echo "  GALLIUM_DRIVER: $GALLIUM_DRIVER"
echo "  GBM_BACKEND: $GBM_BACKEND"
echo "  MESA_LOADER_DRIVER_OVERRIDE: $MESA_LOADER_DRIVER_OVERRIDE"
echo ""

# Navigate to Kiosk directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
KIOSK_DIR="$REPO_ROOT/client/Kiosk"

echo "Navigating to: $KIOSK_DIR"
cd "$KIOSK_DIR" || exit 1

echo ""
echo "Node: $(node --version)"
echo "npm: $(npm --version)"
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "ERROR: node_modules not found!"
    echo "Please run: bash scripts/emergency-fix-kiosk.sh"
    exit 1
fi

# Check if Electron binary exists
if [ ! -f "node_modules/.bin/electron" ]; then
    echo "ERROR: Electron binary not found!"
    echo "Please run: bash scripts/emergency-fix-kiosk.sh"
    exit 1
fi

echo "✓ node_modules and electron binary found"
echo ""

echo "=========================================="
echo "Starting Electron with GPU disabled..."
echo "=========================================="
echo ""

# Start Next.js dev server in background
echo "Starting Next.js dev server..."
npm run dev &
NEXT_PID=$!
echo "Next.js PID: $NEXT_PID"

# Wait for Next.js to be ready
echo "Waiting for Next.js server on http://localhost:3002..."
npx wait-on http://localhost:3002 -t 30000

if [ $? -eq 0 ]; then
    echo "✓ Next.js server is ready"
    echo ""
    echo "Starting Electron..."
    echo ""

    # Start Electron
    npx electron .

    # Kill Next.js when done
    echo ""
    echo "Stopping Next.js server..."
    kill $NEXT_PID 2>/dev/null
else
    echo "ERROR: Next.js server failed to start"
    kill $NEXT_PID 2>/dev/null
    exit 1
fi
