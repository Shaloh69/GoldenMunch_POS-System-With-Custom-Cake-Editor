#!/bin/bash

echo "=========================================="
echo "Direct Electron Test (No Rebuild)"
echo "=========================================="
echo ""

cd ~/GoldenMunch_POS-System-With-Custom-Cake-Editor/client/Kiosk

echo "Node version: $(node --version)"
echo "npm version: $(npm --version)"
echo "Architecture: $(uname -m)"
echo ""

echo "Starting Next.js dev server..."
npm run dev &
NEXT_PID=$!

echo "Waiting 15 seconds for Next.js to start..."
sleep 15

echo ""
echo "Testing if Next.js is ready..."
curl -s http://localhost:3002 > /dev/null && echo "✓ Next.js is ready" || echo "✗ Next.js not ready yet"

echo ""
echo "Starting Electron with npx (bypasses binary issues)..."
DISPLAY=:0 npx electron .

echo ""
echo "Stopping Next.js..."
kill $NEXT_PID 2>/dev/null
