#!/bin/bash
# GoldenMunch Kiosk - Autostart Installation Script
# This script installs the systemd service for autostart on boot

set -e  # Exit on error

echo "========================================="
echo "GoldenMunch Kiosk - Autostart Installer"
echo "========================================="
echo ""

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
KIOSK_DIR="$(dirname "$SCRIPT_DIR")"

echo "Kiosk directory: $KIOSK_DIR"
echo ""

# Check if running as user (not root)
if [ "$EUID" -eq 0 ]; then
    echo "ERROR: Do not run this script as root!"
    echo "Please run as normal user: ./scripts/install-autostart.sh"
    exit 1
fi

# Step 1: Make startup script executable
echo "Step 1: Making startup script executable..."
chmod +x "$SCRIPT_DIR/start-kiosk.sh"
echo "✓ Startup script is now executable"
echo ""

# Step 2: Update paths in service file
echo "Step 2: Updating paths in service file..."
SERVICE_FILE="$SCRIPT_DIR/goldenmunch-kiosk.service"
TMP_SERVICE="/tmp/goldenmunch-kiosk.service"

# Get current user
CURRENT_USER=$(whoami)
CURRENT_HOME=$HOME

# Replace placeholders in service file
sed "s|User=user|User=$CURRENT_USER|g" "$SERVICE_FILE" | \
sed "s|Group=user|Group=$CURRENT_USER|g" | \
sed "s|/home/user|$CURRENT_HOME|g" > "$TMP_SERVICE"

echo "✓ Service file updated with correct paths"
echo "  User: $CURRENT_USER"
echo "  Home: $CURRENT_HOME"
echo ""

# Step 3: Install systemd service
echo "Step 3: Installing systemd service..."
echo "This step requires sudo permissions."
echo ""

sudo cp "$TMP_SERVICE" /etc/systemd/system/goldenmunch-kiosk.service
sudo systemctl daemon-reload

echo "✓ Systemd service installed"
echo ""

# Step 4: Enable service
echo "Step 4: Enabling service (autostart on boot)..."
sudo systemctl enable goldenmunch-kiosk.service
echo "✓ Service enabled - will start on boot"
echo ""

# Step 5: Create log directory
echo "Step 5: Creating log directory..."
LOG_DIR="$HOME/.goldenmunch-logs"
mkdir -p "$LOG_DIR"
echo "✓ Log directory created: $LOG_DIR"
echo ""

# Step 6: Check if URL is configured
echo "Step 6: Checking kiosk configuration..."
CONFIG_DIR="$HOME/.config/goldenmunch-kiosk-electron"
CONFIG_FILE="$CONFIG_DIR/kiosk-config.json"

if [ -f "$CONFIG_FILE" ]; then
    echo "✓ Kiosk URL is already configured"
    APP_URL=$(cat "$CONFIG_FILE" | grep -o '"appUrl":"[^"]*"' | cut -d'"' -f4)
    echo "  URL: $APP_URL"
else
    echo "⚠ Kiosk URL not configured yet"
    echo ""
    echo "Please configure the URL using one of these methods:"
    echo "  1. Start kiosk and press Ctrl+Shift+C to open settings"
    echo "  2. Set environment variable: export KIOSK_APP_URL=https://your-url.com"
    echo "  3. Create config file manually:"
    echo "     mkdir -p $CONFIG_DIR"
    echo "     echo '{\"appUrl\":\"https://your-url.com\"}' > $CONFIG_FILE"
fi
echo ""

# Step 7: Summary
echo "========================================="
echo "Installation Complete!"
echo "========================================="
echo ""
echo "The kiosk is now configured to start automatically on boot."
echo ""
echo "Management Commands:"
echo "  Start now:   sudo systemctl start goldenmunch-kiosk.service"
echo "  Stop:        sudo systemctl stop goldenmunch-kiosk.service"
echo "  Restart:     sudo systemctl restart goldenmunch-kiosk.service"
echo "  Status:      sudo systemctl status goldenmunch-kiosk.service"
echo "  View logs:   journalctl -u goldenmunch-kiosk.service -f"
echo "  Disable:     sudo systemctl disable goldenmunch-kiosk.service"
echo ""
echo "Application logs:"
echo "  Startup: $LOG_DIR/startup.log"
echo "  Kiosk:   $LOG_DIR/kiosk.log"
echo ""
echo "Would you like to start the kiosk now? (y/n)"
read -r START_NOW

if [ "$START_NOW" = "y" ] || [ "$START_NOW" = "Y" ]; then
    echo ""
    echo "Starting kiosk..."
    sudo systemctl start goldenmunch-kiosk.service
    sleep 2
    echo ""
    echo "Checking status..."
    sudo systemctl status goldenmunch-kiosk.service --no-pager
    echo ""
    echo "Kiosk is starting! Check the display."
    echo "Press Ctrl+C to exit this status view, then run:"
    echo "  journalctl -u goldenmunch-kiosk.service -f"
    echo "to follow the logs."
else
    echo ""
    echo "Kiosk not started. To start manually, run:"
    echo "  sudo systemctl start goldenmunch-kiosk.service"
    echo ""
    echo "Or simply reboot to start automatically:"
    echo "  sudo reboot"
fi

echo ""
echo "Setup complete! 🎉"
