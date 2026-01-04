#!/bin/bash
# GoldenMunch Touch Calibration Diagnostics Collection Script
# This script collects all relevant information for troubleshooting touch issues

echo "================================"
echo "GoldenMunch Touch Diagnostics"
echo "================================"
echo "Generated: $(date)"
echo "Hostname: $(hostname)"
echo "User: $(whoami)"
echo ""

echo "--- 1. System Information ---"
uname -a
echo ""

echo "--- 2. Display Environment ---"
echo "DISPLAY: $DISPLAY"
echo "XDG_SESSION_TYPE: $XDG_SESSION_TYPE"
echo "WAYLAND_DISPLAY: $WAYLAND_DISPLAY"
echo ""

echo "--- 3. Touchscreen Detection ---"
echo "xinput list:"
xinput list 2>/dev/null || echo "ERROR: xinput not available"
echo ""

echo "--- 4. Touch Device Details ---"
TOUCH_ID=$(xinput list 2>/dev/null | grep -iE "touchscreen|touch|ILITEK" | grep -v -i "mouse" | grep -o 'id=[0-9]*' | head -1 | cut -d= -f2)
if [ -n "$TOUCH_ID" ]; then
    echo "Touch Device ID: $TOUCH_ID"
    echo ""
    echo "Current Coordinate Transformation Matrix:"
    xinput list-props "$TOUCH_ID" 2>/dev/null | grep "Coordinate Transformation Matrix" || echo "ERROR: Could not get matrix"
else
    echo "ERROR: No touchscreen detected"
fi
echo ""

echo "--- 5. Input Devices in /dev ---"
ls -l /dev/input/by-id/ 2>/dev/null | grep -i touch || echo "No touch devices in /dev/input/by-id/"
echo ""

echo "--- 6. X11 Configuration ---"
if [ -f "/etc/X11/xorg.conf.d/99-touchscreen-calibration.conf" ]; then
    echo "✓ X11 config exists"
    echo ""
    cat /etc/X11/xorg.conf.d/99-touchscreen-calibration.conf
else
    echo "✗ X11 config NOT FOUND at /etc/X11/xorg.conf.d/99-touchscreen-calibration.conf"
fi
echo ""

echo "--- 7. Monitor Script Status ---"
echo "Process check:"
ps aux | grep monitor-touch-calibration | grep -v grep || echo "✗ Monitor script NOT running"
echo ""

echo "--- 8. Systemd Service Status ---"
if systemctl list-unit-files | grep -q touch-monitor.service; then
    echo "Service exists:"
    systemctl status touch-monitor.service --no-pager
else
    echo "✗ touch-monitor.service NOT created"
fi
echo ""

echo "--- 9. Monitor Script Logs ---"
if [ -f "$HOME/.goldenmunch-logs/touch-calibration-monitor.log" ]; then
    echo "Last 20 lines of monitor log:"
    tail -20 "$HOME/.goldenmunch-logs/touch-calibration-monitor.log"
else
    echo "✗ No monitor logs found at ~/.goldenmunch-logs/touch-calibration-monitor.log"
fi
echo ""

echo "--- 10. Kiosk Startup Logs ---"
if [ -f "$HOME/.goldenmunch-logs/startup.log" ]; then
    echo "Last 20 lines of startup log:"
    tail -20 "$HOME/.goldenmunch-logs/startup.log"
else
    echo "✗ No startup logs found"
fi
echo ""

echo "--- 11. Display Information ---"
echo "xrandr output:"
xrandr 2>/dev/null || echo "ERROR: xrandr not available"
echo ""

echo "--- 12. Competing Services Check ---"
echo "Services with 'touch' or 'input' in name:"
systemctl list-units --all | grep -iE "touch|input" || echo "None found"
echo ""

echo "--- 13. Autostart Files ---"
echo "~/.config/autostart/:"
ls -la ~/.config/autostart/ 2>/dev/null || echo "Directory not found"
echo ""
echo "LXDE autostart:"
cat ~/.config/lxsession/LXDE-pi/autostart 2>/dev/null || echo "File not found"
echo ""

echo "--- 14. X11 Server Logs ---"
echo "Recent X11 errors related to input:"
grep -i "input\|touch" /var/log/Xorg.0.log 2>/dev/null | tail -20 || echo "Cannot access X11 logs"
echo ""

echo "--- 15. Script Files Check ---"
PROJECT_DIR="$HOME/GoldenMunch_POS-System-With-Custom-Cake-Editor/client/Kiosk_Electron"
echo "Script directory: $PROJECT_DIR/scripts"
ls -la "$PROJECT_DIR/scripts/"*.sh 2>/dev/null || echo "Scripts directory not found"
echo ""

echo "================================"
echo "Diagnostics Collection Complete"
echo "================================"
echo ""
echo "To save this output to a file:"
echo "  bash $0 > ~/touch-diagnostics-$(date +%Y%m%d-%H%M%S).txt"
echo ""
