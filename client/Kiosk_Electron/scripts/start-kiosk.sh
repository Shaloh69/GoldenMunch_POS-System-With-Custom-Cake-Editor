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
# DETECT TOUCHSCREEN (Configuration will happen AFTER Chromium loads)
# ============================================================================

log "Detecting touchscreen..."

# Wait for touchscreen to be ready
sleep 2

# Find touchscreen device ID
# Look for touchscreen devices, excluding "Mouse" devices (which are emulation layers)
# Priority: Touchscreen keyword, then common touch devices (ILITEK, eGalax, FT5406, etc.)
TOUCH_ID=$(xinput list 2>/dev/null | grep -iE "touchscreen|touch" | grep -v -i "mouse" | grep -o 'id=[0-9]*' | head -1 | cut -d= -f2)

# If not found, try ILITEK specifically (excluding Mouse)
if [ -z "$TOUCH_ID" ]; then
    TOUCH_ID=$(xinput list 2>/dev/null | grep -i "ILITEK" | grep -v -i "mouse" | grep -o 'id=[0-9]*' | head -1 | cut -d= -f2)
fi

# If still not found, try other common touchscreen names
if [ -z "$TOUCH_ID" ]; then
    TOUCH_ID=$(xinput list 2>/dev/null | grep -iE "eGalax|FT5406|Goodix|ADS7846|Capacitive" | grep -v -i "mouse" | grep -o 'id=[0-9]*' | head -1 | cut -d= -f2)
fi

if [ -n "$TOUCH_ID" ]; then
    log "Touchscreen detected (ID: $TOUCH_ID) - will configure after Chromium loads"
else
    log "WARNING: Touchscreen not found"
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
# CONFIGURE TOUCHSCREEN (AFTER Chromium loads)
# ============================================================================
# CRITICAL: Touch transformation gets reset when Chromium loads or display rotates
# Therefore, we apply it AFTER Chromium has fully initialized

log "Waiting for Chromium to fully initialize..."
sleep 10  # Wait for Chromium to complete initialization and rendering

if [ -n "$TOUCH_ID" ]; then
    log "Applying touch calibration (Matrix 6: inverts X and Y for ILITEK in portrait)..."

    # Re-verify touchscreen is still detected
    CURRENT_TOUCH_ID=$(xinput list 2>/dev/null | grep -iE "touchscreen|touch|ILITEK" | grep -v -i "mouse" | grep -o 'id=[0-9]*' | head -1 | cut -d= -f2)

    if [ -n "$CURRENT_TOUCH_ID" ]; then
        # Update TOUCH_ID in case it changed
        TOUCH_ID="$CURRENT_TOUCH_ID"
        log "Touchscreen verified (ID: $TOUCH_ID)"

        # Map touchscreen to the display
        if [ -n "$DISPLAY_NAME" ]; then
            xinput map-to-output "$TOUCH_ID" "$DISPLAY_NAME" 2>/dev/null
            log "Touchscreen mapped to display: $DISPLAY_NAME"
        fi

        # Apply transformation matrix (Matrix 6: -1 0 1 0 -1 1 0 0 1)
        # This inverts both X and Y coordinates for ILITEK touchscreen in portrait mode
        xinput set-prop "$TOUCH_ID" "Coordinate Transformation Matrix" -1 0 1 0 -1 1 0 0 1 2>/dev/null

        if [ $? -eq 0 ]; then
            log "✓ Touch calibration applied successfully!"
            log "  Matrix: -1 0 1 0 -1 1 0 0 1 (inverts X and Y)"
        else
            log "WARNING: Failed to apply touch transformation matrix"
        fi
    else
        log "WARNING: Touchscreen not found after Chromium load"
    fi
else
    log "Skipping touch calibration (no touchscreen detected earlier)"
fi

# ============================================================================
# START TOUCH CALIBRATION MONITOR (AUTO-RECOVERY)
# ============================================================================
# This background script continuously monitors and auto-corrects the touch
# calibration matrix, preventing it from reverting to inverted state

if [ -n "$TOUCH_ID" ]; then
    log "Starting touch calibration monitor (auto-recovery)..."

    # Launch monitor script in background
    MONITOR_SCRIPT="$KIOSK_DIR/scripts/monitor-touch-calibration.sh"

    if [ -f "$MONITOR_SCRIPT" ]; then
        bash "$MONITOR_SCRIPT" &
        MONITOR_PID=$!
        log "Touch calibration monitor started (PID: $MONITOR_PID)"
        log "Monitor will check every 30 seconds and auto-restore Matrix 6"
    else
        log "WARNING: Touch monitor script not found: $MONITOR_SCRIPT"
    fi
else
    log "Skipping touch monitor (no touchscreen detected)"
fi

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
