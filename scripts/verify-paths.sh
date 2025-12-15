#!/bin/bash

# Path Verification Script
# Confirms that all scripts are pointing to the correct directories

echo "=================================================="
echo "GoldenMunch Kiosk - Path Verification"
echo "=================================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Detect script location
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
KIOSK_DIR="$REPO_ROOT/client/Kiosk"

echo -e "${BLUE}=== Path Detection ===${NC}"
echo "Current directory: $(pwd)"
echo "Script directory:  $SCRIPT_DIR"
echo "Repository root:   $REPO_ROOT"
echo "Kiosk directory:   $KIOSK_DIR"
echo ""

# Check directories exist
echo -e "${BLUE}=== Directory Checks ===${NC}"

if [ -d "$REPO_ROOT" ]; then
    echo -e "${GREEN}✓${NC} Repository root exists: $REPO_ROOT"
else
    echo -e "${RED}✗${NC} Repository root NOT found: $REPO_ROOT"
fi

if [ -d "$KIOSK_DIR" ]; then
    echo -e "${GREEN}✓${NC} Kiosk directory exists: $KIOSK_DIR"
else
    echo -e "${RED}✗${NC} Kiosk directory NOT found: $KIOSK_DIR"
    exit 1
fi

# Check for critical files
echo ""
echo -e "${BLUE}=== Critical Files ===${NC}"

FILES_TO_CHECK=(
    "$KIOSK_DIR/package.json"
    "$KIOSK_DIR/electron/main.js"
    "$KIOSK_DIR/next.config.mjs"
)

for file in "${FILES_TO_CHECK[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓${NC} Found: $file"
    else
        echo -e "${RED}✗${NC} Missing: $file"
    fi
done

# Check node_modules
echo ""
echo -e "${BLUE}=== node_modules Check ===${NC}"

if [ -d "$KIOSK_DIR/node_modules" ]; then
    echo -e "${GREEN}✓${NC} node_modules exists at: $KIOSK_DIR/node_modules"

    # Count packages
    PKG_COUNT=$(ls -1 "$KIOSK_DIR/node_modules" | wc -l)
    echo "  Packages installed: $PKG_COUNT"

    # Check critical packages
    CRITICAL_PACKAGES=("electron" "next" "react" "react-dom")
    echo ""
    echo "  Critical packages:"
    for pkg in "${CRITICAL_PACKAGES[@]}"; do
        if [ -d "$KIOSK_DIR/node_modules/$pkg" ]; then
            echo -e "    ${GREEN}✓${NC} $pkg"
        else
            echo -e "    ${RED}✗${NC} $pkg (MISSING)"
        fi
    done
else
    echo -e "${RED}✗${NC} node_modules NOT found at: $KIOSK_DIR/node_modules"
    echo ""
    echo -e "${YELLOW}ACTION REQUIRED:${NC}"
    echo "  Run: cd $KIOSK_DIR && npm install"
    echo "  Or:  bash $REPO_ROOT/scripts/emergency-fix-kiosk.sh"
fi

# Check if we're in the right directory for running npm
echo ""
echo -e "${BLUE}=== Working Directory Test ===${NC}"

cd "$KIOSK_DIR" || exit 1
echo "Changed to: $(pwd)"

if [ -f "package.json" ]; then
    echo -e "${GREEN}✓${NC} package.json is accessible from current directory"

    # Show npm scripts
    echo ""
    echo "Available npm scripts:"
    node -p "Object.keys(require('./package.json').scripts).join(', ')" 2>/dev/null || echo "  (Unable to read package.json)"
else
    echo -e "${RED}✗${NC} package.json NOT accessible"
fi

# Test Electron path
echo ""
echo -e "${BLUE}=== Electron Binary Check ===${NC}"

if [ -f "node_modules/.bin/electron" ]; then
    echo -e "${GREEN}✓${NC} Electron binary found at: $KIOSK_DIR/node_modules/.bin/electron"
elif [ -f "node_modules/electron/cli.js" ]; then
    echo -e "${GREEN}✓${NC} Electron CLI found at: $KIOSK_DIR/node_modules/electron/cli.js"
else
    echo -e "${RED}✗${NC} Electron binary NOT found"
    echo "  Expected location: $KIOSK_DIR/node_modules/.bin/electron"
fi

# Summary
echo ""
echo "=================================================="
echo -e "${BLUE}SUMMARY${NC}"
echo "=================================================="
echo ""

if [ -d "$KIOSK_DIR/node_modules" ]; then
    echo -e "${GREEN}✓ Paths are correctly configured${NC}"
    echo -e "${GREEN}✓ node_modules is installed in the correct location${NC}"
    echo ""
    echo "You can now run:"
    echo "  cd $KIOSK_DIR"
    echo "  npm run electron:dev"
else
    echo -e "${YELLOW}⚠ Paths are correct, but node_modules is missing${NC}"
    echo ""
    echo "To fix, run:"
    echo "  bash $REPO_ROOT/scripts/emergency-fix-kiosk.sh"
fi

echo ""
