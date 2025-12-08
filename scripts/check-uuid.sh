#!/bin/bash

echo "=========================================="
echo "UUID Installation Diagnostic"
echo "=========================================="
echo ""

cd ~/GoldenMunch_POS-System-With-Custom-Cake-Editor/client/Kiosk

echo "1. Checking package.json override..."
grep -A 5 "overrides" package.json
echo ""

echo "2. Checking installed uuid version in node_modules..."
if [ -f "node_modules/uuid/package.json" ]; then
    UUID_VERSION=$(node -p "require('./node_modules/uuid/package.json').version" 2>/dev/null)
    echo "Installed uuid version: $UUID_VERSION"
    echo ""

    echo "3. Checking uuid exports..."
    node -p "require('./node_modules/uuid/package.json').exports" 2>/dev/null || echo "No exports field"
    echo ""

    echo "4. Testing uuid import styles..."
    echo "Testing: require('uuid')"
    node -e "const uuid = require('uuid'); console.log('✓ Works');" 2>&1

    echo "Testing: require('uuid/v4')"
    node -e "const v4 = require('uuid/v4'); console.log('✓ Works');" 2>&1

else
    echo "✗ uuid not found in node_modules!"
fi
echo ""

echo "5. Checking package-lock.json uuid version..."
if [ -f "package-lock.json" ]; then
    grep -A 3 '"uuid"' package-lock.json | head -20
else
    echo "No package-lock.json found"
fi
echo ""

echo "=========================================="
echo "Diagnostic complete!"
echo "=========================================="
