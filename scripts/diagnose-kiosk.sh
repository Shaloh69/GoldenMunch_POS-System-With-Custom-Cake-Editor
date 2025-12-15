#!/bin/bash

# GoldenMunch Kiosk Diagnostics Script
# This script checks the kiosk setup and reports any issues

echo "=================================================="
echo "GoldenMunch Kiosk Diagnostics"
echo "=================================================="
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check function
check_item() {
    local name="$1"
    local command="$2"
    local expected="$3"

    echo -n "Checking $name... "

    if eval "$command" > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC}"
        return 0
    else
        echo -e "${RED}✗${NC}"
        if [ -n "$expected" ]; then
            echo "  Expected: $expected"
        fi
        return 1
    fi
}

# Check function with output
check_item_output() {
    local name="$1"
    local command="$2"

    echo "$name:"
    eval "$command"
    echo ""
}

# System Information
echo "=== SYSTEM INFORMATION ==="
check_item_output "OS Version" "cat /etc/os-release | grep PRETTY_NAME"
check_item_output "Kernel" "uname -r"
check_item_output "Architecture" "uname -m"
check_item_output "Hostname" "hostname"

# Desktop Environment
echo "=== DESKTOP ENVIRONMENT ==="
check_item_output "Desktop Session" "echo \$DESKTOP_SESSION"
check_item_output "Wayland Display" "echo \$WAYLAND_DISPLAY"
check_item_output "XDG Runtime Dir" "echo \$XDG_RUNTIME_DIR"
check_item_output "XDG Session Type" "echo \$XDG_SESSION_TYPE"

# Node.js and npm
echo "=== NODE.JS ENVIRONMENT ==="
if command -v node > /dev/null 2>&1; then
    check_item_output "Node.js Version" "node --version"
else
    echo -e "${RED}✗${NC} Node.js not found"
fi

if command -v npm > /dev/null 2>&1; then
    check_item_output "npm Version" "npm --version"
else
    echo -e "${RED}✗${NC} npm not found"
fi

# Repository
echo "=== REPOSITORY STATUS ==="
REPO_ROOT="$HOME/GoldenMunch_POS-System-With-Custom-Cake-Editor"
KIOSK_DIR="$REPO_ROOT/client/Kiosk"

if [ -d "$REPO_ROOT" ]; then
    echo -e "${GREEN}✓${NC} Repository found at: $REPO_ROOT"

    if [ -d "$KIOSK_DIR" ]; then
        echo -e "${GREEN}✓${NC} Kiosk directory exists"

        if [ -d "$KIOSK_DIR/node_modules" ]; then
            echo -e "${GREEN}✓${NC} node_modules exists"

            # Check key packages
            if [ -d "$KIOSK_DIR/node_modules/electron" ]; then
                echo -e "${GREEN}✓${NC} Electron is installed"
                ELECTRON_VERSION=$(cat "$KIOSK_DIR/node_modules/electron/package.json" | grep '"version"' | head -1 | awk -F'"' '{print $4}')
                echo "  Version: $ELECTRON_VERSION"
            else
                echo -e "${RED}✗${NC} Electron not found in node_modules"
            fi

            if [ -d "$KIOSK_DIR/node_modules/next" ]; then
                echo -e "${GREEN}✓${NC} Next.js is installed"
                NEXT_VERSION=$(cat "$KIOSK_DIR/node_modules/next/package.json" | grep '"version"' | head -1 | awk -F'"' '{print $4}')
                echo "  Version: $NEXT_VERSION"
            else
                echo -e "${RED}✗${NC} Next.js not found in node_modules"
            fi
        else
            echo -e "${RED}✗${NC} node_modules not found"
            echo "  Run: cd $KIOSK_DIR && npm install"
        fi

        # Check package.json
        if [ -f "$KIOSK_DIR/package.json" ]; then
            echo -e "${GREEN}✓${NC} package.json exists"
        else
            echo -e "${RED}✗${NC} package.json not found"
        fi

        # Check electron/main.js
        if [ -f "$KIOSK_DIR/electron/main.js" ]; then
            echo -e "${GREEN}✓${NC} electron/main.js exists"

            # Check for critical configurations
            if grep -q "disableHardwareAcceleration" "$KIOSK_DIR/electron/main.js"; then
                echo -e "${GREEN}✓${NC} Hardware acceleration disabled"
            else
                echo -e "${YELLOW}!${NC} Hardware acceleration setting not found"
            fi

            if grep -q "disable-gpu" "$KIOSK_DIR/electron/main.js"; then
                echo -e "${GREEN}✓${NC} GPU disabled"
            else
                echo -e "${YELLOW}!${NC} GPU disable setting not found"
            fi
        else
            echo -e "${RED}✗${NC} electron/main.js not found"
        fi
    else
        echo -e "${RED}✗${NC} Kiosk directory not found"
    fi
else
    echo -e "${RED}✗${NC} Repository not found at: $REPO_ROOT"
fi

# Startup Script
echo ""
echo "=== STARTUP SCRIPT ==="
STARTUP_SCRIPT="$REPO_ROOT/scripts/start-kiosk-wayland.sh"
if [ -f "$STARTUP_SCRIPT" ]; then
    echo -e "${GREEN}✓${NC} Startup script exists"

    if [ -x "$STARTUP_SCRIPT" ]; then
        echo -e "${GREEN}✓${NC} Startup script is executable"
    else
        echo -e "${RED}✗${NC} Startup script is not executable"
        echo "  Run: chmod +x $STARTUP_SCRIPT"
    fi
else
    echo -e "${RED}✗${NC} Startup script not found"
fi

# Systemd Service
echo ""
echo "=== SYSTEMD SERVICE ==="
SERVICE_FILE="$HOME/.config/systemd/user/kiosk-wayland.service"
if [ -f "$SERVICE_FILE" ]; then
    echo -e "${GREEN}✓${NC} Service file exists"

    # Check if service is enabled
    if systemctl --user is-enabled kiosk-wayland.service > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} Service is enabled"
    else
        echo -e "${YELLOW}!${NC} Service is not enabled"
        echo "  Run: systemctl --user enable kiosk-wayland.service"
    fi

    # Check if service is active
    if systemctl --user is-active kiosk-wayland.service > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} Service is running"

        # Show recent logs
        echo ""
        echo "Recent service logs (last 10 lines):"
        journalctl --user -u kiosk-wayland.service -n 10 --no-pager
    else
        echo -e "${YELLOW}!${NC} Service is not running"
        echo "  Run: systemctl --user start kiosk-wayland.service"
    fi
else
    echo -e "${RED}✗${NC} Service file not found"
    echo "  Expected location: $SERVICE_FILE"
    echo "  Run: cp $REPO_ROOT/scripts/kiosk-wayland.service ~/.config/systemd/user/"
fi

# Check lingering
echo ""
echo "=== USER LINGERING ==="
if loginctl show-user "$USER" | grep -q "Linger=yes"; then
    echo -e "${GREEN}✓${NC} User lingering is enabled"
else
    echo -e "${YELLOW}!${NC} User lingering is not enabled"
    echo "  This means the service won't start until you log in"
    echo "  Run: sudo loginctl enable-linger $USER"
fi

# Network Connectivity
echo ""
echo "=== NETWORK CONNECTIVITY ==="
if ping -c 1 google.com > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Internet connectivity"
else
    echo -e "${RED}✗${NC} No internet connection"
fi

if ping -c 1 registry.npmjs.org > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Can reach npm registry"
else
    echo -e "${YELLOW}!${NC} Cannot reach npm registry"
fi

if ping -c 1 github.com > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Can reach GitHub"
else
    echo -e "${YELLOW}!${NC} Cannot reach GitHub"
fi

# Port Availability
echo ""
echo "=== PORT AVAILABILITY ==="
if lsof -i :3002 > /dev/null 2>&1; then
    echo -e "${YELLOW}!${NC} Port 3002 is in use"
    echo "  Process using port 3002:"
    lsof -i :3002
else
    echo -e "${GREEN}✓${NC} Port 3002 is available"
fi

# Startup Log
echo ""
echo "=== STARTUP LOG ==="
if [ -f "$HOME/kiosk-startup.log" ]; then
    echo -e "${GREEN}✓${NC} Startup log exists"
    echo ""
    echo "Last 20 lines of startup log:"
    tail -20 "$HOME/kiosk-startup.log"
else
    echo -e "${YELLOW}!${NC} Startup log not found (service hasn't run yet)"
fi

# Summary
echo ""
echo "=================================================="
echo "DIAGNOSTIC SUMMARY"
echo "=================================================="
echo ""
echo "If you see any ${RED}✗${NC} marks above, those need to be fixed."
echo "Items marked with ${YELLOW}!${NC} are warnings that may or may not be issues."
echo ""
echo "Common fixes:"
echo "  1. Install dependencies: cd $KIOSK_DIR && npm install"
echo "  2. Make script executable: chmod +x $STARTUP_SCRIPT"
echo "  3. Install service: cp $REPO_ROOT/scripts/kiosk-wayland.service ~/.config/systemd/user/"
echo "  4. Enable service: systemctl --user enable kiosk-wayland.service"
echo "  5. Enable lingering: sudo loginctl enable-linger $USER"
echo ""
echo "For detailed setup instructions, see: $REPO_ROOT/KIOSK_SETUP_RASPBERRY_PI.md"
echo ""
