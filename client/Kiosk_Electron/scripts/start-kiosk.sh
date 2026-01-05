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

        # Wait for rotation to fully complete and X server to settle
        # Increased to 3s to prevent calibration reset issues
        sleep 3
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
# CRITICAL: For ILITEK, the device with "Mouse" in the name IS the correct device to calibrate
# Priority: ILITEK Mouse device, then touchscreen keyword, then other common devices
TOUCH_ID=$(xinput list 2>/dev/null | grep -i "ILITEK.*Mouse" | grep -o 'id=[0-9]*' | head -1 | cut -d= -f2)

# If not found, try general touchscreen (but keep Mouse devices - they may be the calibration target)
if [ -z "$TOUCH_ID" ]; then
    TOUCH_ID=$(xinput list 2>/dev/null | grep -iE "touchscreen|touch" | grep -o 'id=[0-9]*' | head -1 | cut -d= -f2)
fi

# If still not found, try ILITEK without Mouse requirement
if [ -z "$TOUCH_ID" ]; then
    TOUCH_ID=$(xinput list 2>/dev/null | grep -i "ILITEK" | grep -o 'id=[0-9]*' | head -1 | cut -d= -f2)
fi

# Last resort: try other common touchscreen names
if [ -z "$TOUCH_ID" ]; then
    TOUCH_ID=$(xinput list 2>/dev/null | grep -iE "eGalax|FT5406|Goodix|ADS7846|Capacitive" | grep -o 'id=[0-9]*' | head -1 | cut -d= -f2)
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
# Therefore, we apply it AFTER Chromium has fully initialized AND settled

log "Waiting for Chromium to fully initialize and settle..."
sleep 15  # Increased to 15s to ensure Chromium and all display events have settled

if [ -n "$TOUCH_ID" ]; then
    log "Applying touch calibration (Matrix 6: invert both X,Y for ILITEK in portrait)..."

    # Re-verify touchscreen is still detected
    # CRITICAL: Prioritize ILITEK Mouse device (ID 10) - this IS the correct calibration target
    CURRENT_TOUCH_ID=$(xinput list 2>/dev/null | grep -i "ILITEK.*Mouse" | grep -o 'id=[0-9]*' | head -1 | cut -d= -f2)

    # Fallback: try general touchscreen/ILITEK
    if [ -z "$CURRENT_TOUCH_ID" ]; then
        CURRENT_TOUCH_ID=$(xinput list 2>/dev/null | grep -iE "touchscreen|touch|ILITEK" | grep -o 'id=[0-9]*' | head -1 | cut -d= -f2)
    fi

    if [ -n "$CURRENT_TOUCH_ID" ]; then
        # Update TOUCH_ID in case it changed
        TOUCH_ID="$CURRENT_TOUCH_ID"
        log "Touchscreen verified (ID: $TOUCH_ID)"

        # FIRST APPLICATION: Map and calibrate
        if [ -n "$DISPLAY_NAME" ]; then
            xinput map-to-output "$TOUCH_ID" "$DISPLAY_NAME" 2>/dev/null
            log "Touchscreen mapped to display: $DISPLAY_NAME"
        fi

        # Apply transformation matrix (Matrix 6: -1 0 1 0 -1 1 0 0 1)
        # This inverts both X and Y for ILITEK touchscreen in portrait mode (90° CW rotation)
        xinput set-prop "$TOUCH_ID" "Coordinate Transformation Matrix" -1 0 1 0 -1 1 0 0 1 2>/dev/null

        if [ $? -eq 0 ]; then
            log "✓ Touch calibration applied (first pass)"
            log "  Matrix: -1 0 1 0 -1 1 0 0 1 (invert both X,Y)"
        else
            log "WARNING: Failed to apply touch transformation matrix (first pass)"
        fi

        # SECOND APPLICATION: Verify and re-apply to ensure it sticks
        log "Verifying calibration and re-applying..."
        sleep 2

        # Re-map to display
        if [ -n "$DISPLAY_NAME" ]; then
            xinput map-to-output "$TOUCH_ID" "$DISPLAY_NAME" 2>/dev/null
        fi

        # Re-apply transformation matrix
        xinput set-prop "$TOUCH_ID" "Coordinate Transformation Matrix" -1 0 1 0 -1 1 0 0 1 2>/dev/null

        if [ $? -eq 0 ]; then
            log "✓ Touch calibration re-applied successfully (second pass)"

            # Verify the matrix actually stuck
            APPLIED_MATRIX=$(xinput list-props "$TOUCH_ID" 2>/dev/null | grep "Coordinate Transformation Matrix" | sed 's/.*:\s*//' | tr -d ',' | xargs)
            log "  Verified Matrix: $APPLIED_MATRIX"
        else
            log "WARNING: Failed to re-apply touch transformation matrix (second pass)"
        fi
    else
        log "WARNING: Touchscreen not found after Chromium load"
    fi
else
    log "Skipping touch calibration (no touchscreen detected earlier)"
fi

# ============================================================================
# START TOUCH CALIBRATION MONITOR (AUTO-RECOVERY) - INTEGRATED
# ============================================================================
# This background function continuously monitors and auto-corrects the touch
# calibration matrix, preventing it from reverting to inverted state

if [ -n "$TOUCH_ID" ]; then
    log "Starting integrated touch calibration monitor (auto-recovery)..."

    # Configuration
    MONITOR_LOG="$LOG_DIR/touch-calibration-monitor.log"
    CHECK_INTERVAL=45  # Force-apply every 45 seconds
    CALIBRATION_MATRIX="-1 0 1 0 -1 1 0 0 1"

    # Background monitoring function
    monitor_touch_calibration() {
        # Logging function for monitor
        monitor_log() {
            echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$MONITOR_LOG"
        }

        monitor_log "=== Touch Calibration Monitor Started ==="
        monitor_log "Force-apply interval: ${CHECK_INTERVAL}s"
        monitor_log "Calibration matrix: $CALIBRATION_MATRIX"
        monitor_log "Mode: FORCE (no comparison, always apply)"

        # Minimal initial delay - protection starts almost immediately
        sleep 1

        # Continuous force-apply loop
        monitor_log "Starting continuous force-apply loop (reduced 1s initial delay)..."
        while true; do
            # Find touchscreen device ID (may change, so re-detect each time)
            # CRITICAL: Prioritize ILITEK Mouse device (ID 10) - this IS the correct calibration target
            CURRENT_TOUCH_ID=$(xinput list 2>/dev/null | grep -i "ILITEK.*Mouse" | grep -o 'id=[0-9]*' | head -1 | cut -d= -f2)

            if [ -z "$CURRENT_TOUCH_ID" ]; then
                # Fallback: try general touchscreen/ILITEK
                CURRENT_TOUCH_ID=$(xinput list 2>/dev/null | grep -iE "touchscreen|touch|ILITEK" | grep -o 'id=[0-9]*' | head -1 | cut -d= -f2)
            fi

            if [ -z "$CURRENT_TOUCH_ID" ]; then
                # Last resort: try other common touchscreen names
                CURRENT_TOUCH_ID=$(xinput list 2>/dev/null | grep -iE "eGalax|FT5406|Goodix|ADS7846|Capacitive" | grep -o 'id=[0-9]*' | head -1 | cut -d= -f2)
            fi

            if [ -n "$CURRENT_TOUCH_ID" ]; then
                monitor_log "🔄 Force-applying calibration..."
                monitor_log "  Touch ID: $CURRENT_TOUCH_ID"

                # Map to display first
                CURRENT_DISPLAY=$(xrandr 2>/dev/null | grep " connected" | head -1 | awk '{print $1}')
                if [ -n "$CURRENT_DISPLAY" ]; then
                    xinput map-to-output "$CURRENT_TOUCH_ID" "$CURRENT_DISPLAY" 2>/dev/null
                    monitor_log "  Mapped to display: $CURRENT_DISPLAY"
                fi

                # Apply calibration matrix (always, no comparison)
                xinput set-prop "$CURRENT_TOUCH_ID" "Coordinate Transformation Matrix" $CALIBRATION_MATRIX 2>/dev/null

                if [ $? -eq 0 ]; then
                    monitor_log "  ✓ Calibration applied successfully!"
                else
                    monitor_log "  ✗ Failed to apply calibration"
                fi
            else
                monitor_log "  ⚠ Touchscreen not detected, skipping this cycle"
            fi

            # Wait before next force-apply
            sleep "$CHECK_INTERVAL"
        done
    }

    # Start monitor in background
    monitor_touch_calibration &
    MONITOR_PID=$!
    log "Touch calibration monitor started (PID: $MONITOR_PID)"
    log "Monitor will FORCE-APPLY Matrix 6 every 45 seconds (no comparison)"
    log "Monitor log: $MONITOR_LOG"

    # FINAL SAFETY CALIBRATION: Apply one more time AFTER monitor starts
    # This ensures calibration is the absolute LAST thing applied before kiosk runs
    log "Applying final safety calibration (LAST APPLICATION)..."
    sleep 2

    # Re-verify touchscreen one last time
    # CRITICAL: Prioritize ILITEK Mouse device (ID 10)
    FINAL_TOUCH_ID=$(xinput list 2>/dev/null | grep -i "ILITEK.*Mouse" | grep -o 'id=[0-9]*' | head -1 | cut -d= -f2)

    # Fallback: try general touchscreen/ILITEK
    if [ -z "$FINAL_TOUCH_ID" ]; then
        FINAL_TOUCH_ID=$(xinput list 2>/dev/null | grep -iE "touchscreen|touch|ILITEK" | grep -o 'id=[0-9]*' | head -1 | cut -d= -f2)
    fi

    if [ -n "$FINAL_TOUCH_ID" ]; then
        # Final mapping to display
        if [ -n "$DISPLAY_NAME" ]; then
            xinput map-to-output "$FINAL_TOUCH_ID" "$DISPLAY_NAME" 2>/dev/null
        fi

        # Final calibration apply
        xinput set-prop "$FINAL_TOUCH_ID" "Coordinate Transformation Matrix" -1 0 1 0 -1 1 0 0 1 2>/dev/null

        if [ $? -eq 0 ]; then
            log "✓ FINAL calibration applied successfully - touch is now ready!"
            FINAL_MATRIX=$(xinput list-props "$FINAL_TOUCH_ID" 2>/dev/null | grep "Coordinate Transformation Matrix" | sed 's/.*:\s*//' | tr -d ',' | xargs)
            log "  Final verified matrix: $FINAL_MATRIX"
        else
            log "WARNING: Final calibration apply failed (monitor will correct it)"
        fi
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
