#!/bin/bash
# GoldenMunch Kiosk - Touch Calibration Installation Script
# This script installs the persistent X11 touch calibration configuration

echo "================================"
echo "GoldenMunch Touch Calibration"
echo "Installation Script"
echo "================================"
echo ""

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    echo "❌ ERROR: Do not run this script as root!"
    echo "   Run with: bash install-touch-calibration.sh"
    echo "   It will prompt for sudo password when needed."
    exit 1
fi

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_FILE="$SCRIPT_DIR/99-touchscreen-calibration.conf"

# Check if config file exists
if [ ! -f "$CONFIG_FILE" ]; then
    echo "❌ ERROR: Configuration file not found!"
    echo "   Expected: $CONFIG_FILE"
    exit 1
fi

echo "📋 Configuration file found: $CONFIG_FILE"
echo ""

# Create X11 xorg.conf.d directory if it doesn't exist
echo "📁 Creating /etc/X11/xorg.conf.d/ directory..."
sudo mkdir -p /etc/X11/xorg.conf.d/

# Copy configuration file
echo "📝 Installing touchscreen calibration configuration..."
sudo cp "$CONFIG_FILE" /etc/X11/xorg.conf.d/99-touchscreen-calibration.conf

if [ $? -eq 0 ]; then
    echo "✅ Configuration installed successfully!"
    echo ""
    echo "📍 Location: /etc/X11/xorg.conf.d/99-touchscreen-calibration.conf"
    echo ""
    echo "This configuration will:"
    echo "  • Persist touch calibration across reboots"
    echo "  • Apply Matrix 6 (-1 0 1 0 -1 1 0 0 1)"
    echo "  • Work with ILITEK and other touchscreens"
    echo ""
    echo "⚠  IMPORTANT: Reboot required for X11 config to take effect"
    echo "   However, the monitoring script will apply it immediately on next kiosk start."
    echo ""
    echo "To apply now without reboot, restart the kiosk service:"
    echo "   sudo systemctl restart goldenmunch-kiosk.service"
    echo ""
else
    echo "❌ Failed to install configuration!"
    exit 1
fi
