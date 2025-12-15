#!/bin/bash

# Log file location
LOGFILE="$HOME/kiosk-startup.log"
exec > >(tee -a "$LOGFILE") 2>&1

echo "=========================================="
echo "GoldenMunch Kiosk Starting (Wayland)..."
echo "Time: $(date)"
echo "=========================================="

# Wait for Wayland session to be ready
echo "Waiting for Wayland session..."
MAX_WAIT=30
WAIT_COUNT=0
while [ -z "$WAYLAND_DISPLAY" ] && [ -z "$XDG_RUNTIME_DIR" ]; do
    echo "  Still waiting for Wayland session... ($WAIT_COUNT seconds)"
    sleep 1
    WAIT_COUNT=$((WAIT_COUNT + 1))
    if [ $WAIT_COUNT -gt $MAX_WAIT ]; then
        echo "WARNING: Wayland session variables not set, continuing anyway..."
        break
    fi
done
echo "✓ Session is ready"

# CRITICAL: Set environment variables to prevent DRM/GBM errors
# Force X11 usage even in Wayland sessions
export ELECTRON_OZONE_PLATFORM_HINT=x11
export DISPLAY="${DISPLAY:-:0}"  # Ensure DISPLAY is set for XWayland

# Disable hardware acceleration at environment level
export LIBGL_ALWAYS_SOFTWARE=1
export GALLIUM_DRIVER=llvmpipe

# CRITICAL: Disable GBM/DRM at system level
export GBM_BACKEND=dummy
export MESA_LOADER_DRIVER_OVERRIDE=swrast
export __GLX_VENDOR_LIBRARY_NAME=mesa
export ELECTRON_DISABLE_GPU=1

echo "Environment Configuration:"
echo "  DISPLAY: $DISPLAY"
echo "  WAYLAND_DISPLAY: $WAYLAND_DISPLAY"
echo "  ELECTRON_OZONE_PLATFORM_HINT: $ELECTRON_OZONE_PLATFORM_HINT"
echo "  ELECTRON_DISABLE_GPU: $ELECTRON_DISABLE_GPU"
echo "  LIBGL_ALWAYS_SOFTWARE: $LIBGL_ALWAYS_SOFTWARE"
echo "  GALLIUM_DRIVER: $GALLIUM_DRIVER"
echo "  GBM_BACKEND: $GBM_BACKEND"
echo "  MESA_LOADER_DRIVER_OVERRIDE: $MESA_LOADER_DRIVER_OVERRIDE"
echo "  XDG Runtime: $XDG_RUNTIME_DIR"
echo "  Desktop Session: $DESKTOP_SESSION"
echo "  User: $USER"
echo "  Home: $HOME"

# Detect script location and navigate to Kiosk directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
KIOSK_DIR="$REPO_ROOT/client/Kiosk"

echo "Script location: $SCRIPT_DIR"
echo "Repository root: $REPO_ROOT"
echo "Kiosk directory: $KIOSK_DIR"

if [ ! -d "$KIOSK_DIR" ]; then
    echo "ERROR: Directory not found: $KIOSK_DIR"
    exit 1
fi
cd "$KIOSK_DIR" || exit 1
echo "✓ Changed to Kiosk directory"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "WARNING: node_modules not found. Running npm install..."
    npm install
fi

# Check if npm is available
if ! command -v npm &> /dev/null; then
    echo "ERROR: npm command not found"
    echo "Attempting to load nvm..."
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
    if ! command -v npm &> /dev/null; then
        echo "ERROR: Still cannot find npm"
        exit 1
    fi
fi

echo "Node version: $(node --version)"
echo "npm version: $(npm --version)"

# Start the Electron app
echo "Starting Electron app..."
echo "Command: npm run electron:dev"
npm run electron:dev
