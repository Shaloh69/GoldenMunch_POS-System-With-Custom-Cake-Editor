#!/bin/bash
# GoldenMunch Kiosk - Startup Script for Raspberry Pi
# This script starts the Electron kiosk application with proper environment settings

# ============================================================================
# CONFIGURATION
# ============================================================================

# Project paths
PROJECT_DIR="/home/user/GoldenMunch_POS-System-With-Custom-Cake-Editor"
KIOSK_DIR="$PROJECT_DIR/client/Kiosk_Electron"
SERVER_DIR="$PROJECT_DIR/server"
LOG_DIR="/home/user/.goldenmunch-logs"

# Create log directory if it doesn't exist
mkdir -p "$LOG_DIR"

# Log files
KIOSK_LOG="$LOG_DIR/kiosk.log"
SERVER_LOG="$LOG_DIR/server.log"
STARTUP_LOG="$LOG_DIR/startup.log"

# Environment
export NODE_ENV=production
export DISPLAY=:0
export XAUTHORITY=/home/user/.Xauthority

# CRITICAL: Force X11 to prevent Wayland DRM/GBM errors
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
    if xset q &>/dev/null; then
        log "X server is ready!"
        break
    fi
    log "Waiting for X server... ($i/30)"
    sleep 1
done

if ! xset q &>/dev/null; then
    log "ERROR: X server not available after 30 seconds!"
    exit 1
fi

# ============================================================================
# WAIT FOR NETWORK
# ============================================================================

log "Waiting for network connectivity..."

# Wait up to 60 seconds for network
for i in {1..60}; do
    if ping -c 1 8.8.8.8 &>/dev/null; then
        log "Network is ready!"
        break
    fi
    log "Waiting for network... ($i/60)"
    sleep 1
done

if ! ping -c 1 8.8.8.8 &>/dev/null; then
    log "WARNING: No network connectivity detected!"
    log "Continuing anyway - kiosk may not load remote URL"
fi

# ============================================================================
# DISABLE SCREEN BLANKING
# ============================================================================

log "Disabling screen blanking and power management..."

xset s off         # Disable screen saver
xset s noblank     # Don't blank the screen
xset -dpms         # Disable power management

log "Screen blanking disabled"

# ============================================================================
# HIDE CURSOR (OPTIONAL)
# ============================================================================

# Uncomment to hide mouse cursor in kiosk mode
# log "Hiding mouse cursor..."
# unclutter -idle 0.01 -root &

# ============================================================================
# START BACKEND SERVER (OPTIONAL)
# ============================================================================

# Uncomment if you want to run the backend server on the same Raspberry Pi
# log "Starting backend server..."
# cd "$SERVER_DIR"
# npm start > "$SERVER_LOG" 2>&1 &
# SERVER_PID=$!
# log "Backend server started (PID: $SERVER_PID)"

# Wait for server to be ready
# log "Waiting for backend server..."
# sleep 10

# ============================================================================
# START KIOSK ELECTRON
# ============================================================================

log "Changing to kiosk directory: $KIOSK_DIR"
cd "$KIOSK_DIR" || {
    log "ERROR: Failed to change to kiosk directory!"
    exit 1
}

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    log "WARNING: node_modules not found!"
    log "Please run: cd $KIOSK_DIR && npm install"
    exit 1
fi

log "Starting GoldenMunch Kiosk..."
log "Log file: $KIOSK_LOG"

# Start Electron kiosk
npm start > "$KIOSK_LOG" 2>&1 &
KIOSK_PID=$!

log "Kiosk started (PID: $KIOSK_PID)"

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
