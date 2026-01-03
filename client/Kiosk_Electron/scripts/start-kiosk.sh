#!/bin/bash
# GoldenMunch Kiosk - Startup Script for Raspberry Pi 5
# This script starts the Chromium kiosk with portrait mode and touch calibration
# Optimized for Raspberry Pi 5 (aarch64) on Debian 13

# ============================================================================
# CONFIGURATION
# ============================================================================

# Auto-detect user home directory
USER_HOME="${HOME:-/home/$(whoami)}"

# Project paths
PROJECT_DIR="$USER_HOME/GoldenMunch_POS-System-With-Custom-Cake-Editor"
KIOSK_DIR="$PROJECT_DIR/client/Kiosk_Electron"
LOG_DIR="$USER_HOME/.goldenmunch-logs"

# Create log directory if it doesn't exist
mkdir -p "$LOG_DIR"

# Log files
KIOSK_LOG="$LOG_DIR/kiosk.log"
STARTUP_LOG="$LOG_DIR/startup.log"

# Environment
export NODE_ENV=production
export DISPLAY=:0
export XAUTHORITY="$USER_HOME/.Xauthority"

# CRITICAL: Force X11 to prevent Wayland errors
export ELECTRON_OZONE_PLATFORM_HINT=x11
export XDG_SESSION_TYPE=x11

# ============================================================================
# LOGGING FUNCTION
# ============================================================================

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$STARTUP_LOG"
}

# ============================================================================
# WAIT FOR X SERVER
# ============================================================================

log "=== GOLDENMUNCH KIOSK STARTUP ==="
log "Waiting for X server to be ready..."

# Wait up to 30 seconds for X server
for i in {1..30}; do
    if xset q &>/dev/null 2>&1; then
        log "X server is ready!"
        break
    fi
    log "Waiting for X server... ($i/30)"
    sleep 1
done

if ! xset q &>/dev/null 2>&1; then
    log "ERROR: X server not available after 30 seconds!"
    exit 1
fi

# ============================================================================
# WAIT FOR NETWORK
# ============================================================================

log "Waiting for network connectivity..."

# Wait up to 60 seconds for network
for i in {1..60}; do
    if ping -c 1 8.8.8.8 &>/dev/null 2>&1; then
        log "Network is ready!"
        break
    fi
    log "Waiting for network... ($i/60)"
    sleep 1
done

if ! ping -c 1 8.8.8.8 &>/dev/null 2>&1; then
    log "WARNING: No network connectivity detected!"
    log "Continuing anyway - kiosk may not load remote URL"
fi

# ============================================================================
# DISABLE SCREEN BLANKING
# ============================================================================

log "Disabling screen blanking and power management..."

xset s off 2>/dev/null || log "WARNING: Could not disable screen saver"
xset s noblank 2>/dev/null || log "WARNING: Could not disable screen blanking"
xset -dpms 2>/dev/null || log "WARNING: Could not disable DPMS"

log "Screen blanking disabled"

# ============================================================================
# CONFIGURE PORTRAIT MODE
# ============================================================================

log "Configuring display rotation..."

# Check if xrandr is available
if command -v xrandr &>/dev/null; then
    # Get primary display name
    DISPLAY_NAME=$(xrandr 2>/dev/null | grep " connected" | head -1 | awk '{print $1}')

    if [ -n "$DISPLAY_NAME" ]; then
        log "Found display: $DISPLAY_NAME"

        # Rotate to portrait (90° clockwise)
        # Change to --rotate normal for landscape mode
        xrandr --output "$DISPLAY_NAME" --rotate right 2>/dev/null
        log "Display rotated to portrait mode (90° clockwise)"

        # Wait for rotation to complete
        sleep 2
    else
        log "WARNING: Could not detect display name"
        DISPLAY_NAME="HDMI-1"  # Fallback default
    fi
else
    log "WARNING: xrandr not available, skipping display rotation"
    DISPLAY_NAME="HDMI-1"  # Fallback default
fi

# ============================================================================
# CONFIGURE TOUCHSCREEN
# ============================================================================

log "Configuring touchscreen..."

# Wait for touchscreen to be ready
sleep 2

# Find touchscreen device ID
# Look for common touchscreen names (including ILITEK for ILI Technology touchscreens)
TOUCH_ID=$(xinput list 2>/dev/null | grep -iE "touch|eGalax|FT5406|Goodix|ADS7846|Capacitive|ILITEK" | grep -o 'id=[0-9]*' | head -1 | cut -d= -f2)

if [ -n "$TOUCH_ID" ] && [ -n "$DISPLAY_NAME" ]; then
    log "Found touchscreen (ID: $TOUCH_ID)"

    # Map touchscreen to rotated display
    xinput map-to-output "$TOUCH_ID" "$DISPLAY_NAME" 2>/dev/null

    if [ $? -eq 0 ]; then
        log "Touchscreen mapped to display: $DISPLAY_NAME"
    else
        log "WARNING: Failed to map touchscreen to display"
    fi

    # FIX: Transform touch for portrait mode (90° rotation + possible inversion)
    # Try different transformation matrices - this one swaps and inverts for portrait
    # Matrix: 0 -1 1 1 0 0 0 0 1 (common for 90° right rotation)
    xinput set-prop "$TOUCH_ID" "Coordinate Transformation Matrix" 0 -1 1 1 0 0 0 0 1 2>/dev/null

    if [ $? -eq 0 ]; then
        log "Touch transformation applied for portrait mode"
    else
        log "WARNING: Could not apply touch transformation"
    fi
else
    if [ -z "$TOUCH_ID" ]; then
        log "WARNING: Touchscreen not found"
    fi
    if [ -z "$DISPLAY_NAME" ]; then
        log "WARNING: Display not detected"
    fi
fi

# ============================================================================
# HIDE MOUSE CURSOR (OPTIONAL)
# ============================================================================

# Uncomment to hide mouse cursor in kiosk mode
# log "Hiding mouse cursor..."
# unclutter -idle 0.01 -root &

# ============================================================================
# GET KIOSK URL
# ============================================================================

# Get kiosk URL from environment variable or use default
if [ -n "$KIOSK_APP_URL" ]; then
    KIOSK_URL="$KIOSK_APP_URL"
else
    # Default production URL
    KIOSK_URL="https://golden-munch-pos.vercel.app"
fi

log "Kiosk URL: $KIOSK_URL"

# ============================================================================
# START CHROMIUM KIOSK
# ============================================================================

log "Starting GoldenMunch Kiosk (Chromium)..."
log "Log file: $KIOSK_LOG"

# Check if Chromium is installed
if ! command -v chromium &>/dev/null; then
    log "ERROR: Chromium not installed!"
    log "Please install: sudo apt install -y chromium"
    exit 1
fi

# Start Chromium in kiosk mode
# Using MINIMAL flags for maximum speed (like normal Chromium)
chromium \
  --kiosk \
  --noerrdialogs \
  --disable-infobars \
  --no-first-run \
  --check-for-update-interval=31536000 \
  --user-data-dir="$USER_HOME/.goldenmunch-chromium" \
  "$KIOSK_URL" \
  > "$KIOSK_LOG" 2>&1 &

KIOSK_PID=$!

log "Chromium kiosk started (PID: $KIOSK_PID)"

# ============================================================================
# MONITOR PROCESS
# ============================================================================

# Let systemd handle restarts - no need for manual monitoring loop
# This prevents double-restart issues that cause black screen flashing

log "Kiosk is running. Systemd will handle restarts if needed."
log "To view logs: journalctl -u goldenmunch-kiosk -f"
log "To view kiosk output: tail -f $KIOSK_LOG"

# Wait for the kiosk process to exit naturally
wait $KIOSK_PID
EXIT_CODE=$?

log "Kiosk exited with code: $EXIT_CODE"

# Exit and let systemd decide whether to restart based on the service configuration
exit $EXIT_CODE
