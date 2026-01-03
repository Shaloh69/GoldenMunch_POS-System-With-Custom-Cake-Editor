#!/bin/bash
# GoldenMunch Kiosk - Touch Calibration Monitor
# This script runs in the background and continuously monitors/re-applies touch calibration
# to prevent it from reverting to inverted state

# Configuration
LOG_DIR="${HOME}/.goldenmunch-logs"
LOG_FILE="$LOG_DIR/touch-calibration-monitor.log"
CHECK_INTERVAL=30  # Check every 30 seconds

# Create log directory
mkdir -p "$LOG_DIR"

# Matrix 6: Inverts both X and Y for ILITEK touchscreen in portrait mode
CALIBRATION_MATRIX="-1 0 1 0 -1 1 0 0 1"

# Logging function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

log "=== Touch Calibration Monitor Started ==="
log "Check interval: ${CHECK_INTERVAL}s"
log "Target matrix: $CALIBRATION_MATRIX"

# Function to apply calibration
apply_calibration() {
    # Find touchscreen device ID
    # Look for touchscreen devices, excluding "Mouse" devices
    TOUCH_ID=$(xinput list 2>/dev/null | grep -iE "touchscreen|touch|ILITEK" | grep -v -i "mouse" | grep -o 'id=[0-9]*' | head -1 | cut -d= -f2)

    if [ -z "$TOUCH_ID" ]; then
        # Try other common touchscreen names
        TOUCH_ID=$(xinput list 2>/dev/null | grep -iE "eGalax|FT5406|Goodix|ADS7846|Capacitive" | grep -v -i "mouse" | grep -o 'id=[0-9]*' | head -1 | cut -d= -f2)
    fi

    if [ -n "$TOUCH_ID" ]; then
        # Get current matrix
        CURRENT_MATRIX=$(xinput list-props "$TOUCH_ID" 2>/dev/null | grep "Coordinate Transformation Matrix" | sed 's/.*:\s*//' | tr -d ',' | xargs)

        # Compare with target matrix
        if [ "$CURRENT_MATRIX" != "$CALIBRATION_MATRIX" ]; then
            log "⚠ Matrix mismatch detected!"
            log "  Current: $CURRENT_MATRIX"
            log "  Target:  $CALIBRATION_MATRIX"
            log "  Reapplying calibration..."

            # Map to display first
            DISPLAY_NAME=$(xrandr 2>/dev/null | grep " connected" | head -1 | awk '{print $1}')
            if [ -n "$DISPLAY_NAME" ]; then
                xinput map-to-output "$TOUCH_ID" "$DISPLAY_NAME" 2>/dev/null
            fi

            # Apply calibration matrix
            xinput set-prop "$TOUCH_ID" "Coordinate Transformation Matrix" $CALIBRATION_MATRIX 2>/dev/null

            if [ $? -eq 0 ]; then
                log "  ✓ Calibration restored successfully!"
            else
                log "  ✗ Failed to apply calibration"
            fi
        fi
    else
        log "  WARNING: Touchscreen not detected"
    fi
}

# Initial calibration application
log "Applying initial calibration..."
sleep 2  # Brief delay to ensure X is ready
apply_calibration

# Continuous monitoring loop
log "Starting continuous monitoring..."
while true; do
    sleep "$CHECK_INTERVAL"
    apply_calibration
done
