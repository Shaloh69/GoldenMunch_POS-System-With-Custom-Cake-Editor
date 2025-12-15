#!/bin/bash

# GoldenMunch Kiosk - Emergency Fix Script
# This script fixes the missing node_modules and installs all dependencies

set -e  # Exit on error

echo "=================================================="
echo "GoldenMunch Kiosk - Emergency Fix"
echo "=================================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Detect script location
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
KIOSK_DIR="$REPO_ROOT/client/Kiosk"

echo -e "${BLUE}Repository root: $REPO_ROOT${NC}"
echo -e "${BLUE}Kiosk directory: $KIOSK_DIR${NC}"
echo ""

# Navigate to Kiosk directory
if [ ! -d "$KIOSK_DIR" ]; then
    echo -e "${RED}ERROR: Kiosk directory not found: $KIOSK_DIR${NC}"
    exit 1
fi

cd "$KIOSK_DIR" || exit 1
echo -e "${GREEN}✓ Changed to Kiosk directory${NC}"
echo ""

# Check Node.js and npm
echo "=== Checking Environment ==="
if ! command -v node &> /dev/null; then
    echo -e "${RED}✗ Node.js not found${NC}"
    echo "Please install Node.js first"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo -e "${RED}✗ npm not found${NC}"
    echo "Please install npm first"
    exit 1
fi

echo -e "${GREEN}✓ Node.js version: $(node --version)${NC}"
echo -e "${GREEN}✓ npm version: $(npm --version)${NC}"
echo ""

# Clean old installations if they exist
echo "=== Cleaning Old Installation ==="
if [ -d "node_modules" ]; then
    echo -e "${YELLOW}! Removing old node_modules...${NC}"
    rm -rf node_modules
    echo -e "${GREEN}✓ Removed node_modules${NC}"
fi

if [ -f "package-lock.json" ]; then
    echo -e "${YELLOW}! Removing old package-lock.json...${NC}"
    rm -f package-lock.json
    echo -e "${GREEN}✓ Removed package-lock.json${NC}"
fi

# Clear npm cache
echo -e "${BLUE}Clearing npm cache...${NC}"
npm cache clean --force
echo -e "${GREEN}✓ Cache cleared${NC}"
echo ""

# Install dependencies
echo "=== Installing Dependencies ==="
echo -e "${BLUE}This may take 5-10 minutes...${NC}"
echo ""

# Use extended timeout and retries
npm install \
    --fetch-timeout=600000 \
    --fetch-retries=10 \
    --loglevel=verbose

if [ $? -ne 0 ]; then
    echo ""
    echo -e "${RED}✗ npm install failed!${NC}"
    echo ""
    echo "Troubleshooting steps:"
    echo "1. Check your internet connection"
    echo "2. Try running: npm install --legacy-peer-deps"
    echo "3. Check if port 443 is blocked"
    echo "4. Try with a different DNS (e.g., 8.8.8.8)"
    exit 1
fi

echo ""
echo -e "${GREEN}✓ Dependencies installed successfully!${NC}"
echo ""

# Verify critical packages
echo "=== Verifying Installation ==="
PACKAGES_TO_CHECK=("electron" "next" "react" "react-dom")
ALL_INSTALLED=true

for pkg in "${PACKAGES_TO_CHECK[@]}"; do
    if [ -d "node_modules/$pkg" ]; then
        VERSION=$(node -p "require('./node_modules/$pkg/package.json').version" 2>/dev/null || echo "unknown")
        echo -e "${GREEN}✓ $pkg ($VERSION)${NC}"
    else
        echo -e "${RED}✗ $pkg NOT FOUND${NC}"
        ALL_INSTALLED=false
    fi
done

echo ""

if [ "$ALL_INSTALLED" = false ]; then
    echo -e "${RED}✗ Some critical packages are missing!${NC}"
    echo "Try running: npm install again"
    exit 1
fi

# Check if Electron binary exists
if [ -f "node_modules/.bin/electron" ] || [ -f "node_modules/electron/cli.js" ]; then
    echo -e "${GREEN}✓ Electron binary found${NC}"
else
    echo -e "${YELLOW}! Electron binary not found, reinstalling...${NC}"
    npm install electron --save-dev --fetch-timeout=600000
fi

echo ""
echo "=================================================="
echo -e "${GREEN}SUCCESS! Installation Complete${NC}"
echo "=================================================="
echo ""
echo "Next steps:"
echo ""
echo "1. Test the kiosk manually:"
echo "   cd $KIOSK_DIR"
echo "   npm run electron:dev"
echo ""
echo "2. If manual test works, install the systemd service:"
echo "   mkdir -p ~/.config/systemd/user"
echo "   cp $REPO_ROOT/scripts/kiosk-wayland.service ~/.config/systemd/user/"
echo "   systemctl --user daemon-reload"
echo "   systemctl --user enable kiosk-wayland.service"
echo ""
echo "3. Enable user lingering (for auto-start):"
echo "   sudo loginctl enable-linger \$USER"
echo ""
echo "4. Start the service:"
echo "   systemctl --user start kiosk-wayland.service"
echo ""
echo -e "${BLUE}For more details, see: $REPO_ROOT/KIOSK_FIX_INSTRUCTIONS.md${NC}"
echo ""
