#!/bin/bash
# Quick Touch Calibration Fix
# Run this script to quickly test and apply the correct calibration

echo "========================================="
echo "Quick Touch Calibration Diagnostic"
echo "========================================="
echo ""

# Detect touchscreen
TOUCH_ID=$(xinput list 2>/dev/null | grep -iE "touchscreen|touch|ILITEK" | grep -v -i "mouse" | grep -o 'id=[0-9]*' | head -1 | cut -d= -f2)

if [ -z "$TOUCH_ID" ]; then
    echo "❌ ERROR: No touchscreen detected!"
    exit 1
fi

DISPLAY_NAME=$(xrandr 2>/dev/null | grep " connected" | head -1 | awk '{print $1}')

echo "Touchscreen ID: $TOUCH_ID"
echo "Display: $DISPLAY_NAME"
echo ""

# Get current display rotation
ROTATION=$(xrandr 2>/dev/null | grep "$DISPLAY_NAME" | grep -oP '(normal|left|right|inverted)')
echo "Display rotation: ${ROTATION:-normal}"
echo ""

echo "Current touch behavior test:"
echo "========================================="
echo ""
echo "Please describe what happens when you touch:"
echo ""
echo "1. Touch TOP-LEFT corner - where does it register?"
echo "   a) Top-left (correct!)"
echo "   b) Top-right"
echo "   c) Bottom-left"
echo "   d) Bottom-right"
echo "   e) Somewhere else"
echo ""
echo "2. Touch TOP-RIGHT corner - where does it register?"
echo "   a) Top-right (correct!)"
echo "   b) Top-left"
echo "   c) Bottom-right"
echo "   d) Bottom-left"
echo "   e) Somewhere else"
echo ""
echo "Based on your display rotation (${ROTATION:-normal}) and touch behavior,"
echo "here are the recommended matrices:"
echo ""

if [ "$ROTATION" = "right" ] || [ "$ROTATION" = "left" ]; then
    echo "For PORTRAIT mode (display rotated):"
    echo ""
    echo "If touch is inverted (opposite corners):"
    echo "  Try Matrix 6: -1 0 1 0 -1 1 0 0 1"
    echo ""
    echo "If touch is swapped and inverted on Y:"
    echo "  Try Matrix 7: 0 1 0 -1 0 1 0 0 1"
    echo ""
    echo "If touch is swapped and inverted on X:"
    echo "  Try Matrix 5: 0 -1 1 1 0 0 0 0 1"
    echo ""
    echo "If touch is just swapped:"
    echo "  Try Matrix 4: 0 1 0 1 0 0 0 0 1"
    echo ""
else
    echo "For LANDSCAPE mode (display normal):"
    echo ""
    echo "If touch is inverted (opposite corners):"
    echo "  Try Matrix 6: -1 0 1 0 -1 1 0 0 1"
    echo ""
    echo "If touch is only inverted horizontally:"
    echo "  Try Matrix 2: -1 0 1 0 1 0 0 0 1"
    echo ""
    echo "If touch is only inverted vertically:"
    echo "  Try Matrix 3: 1 0 0 0 -1 1 0 0 1"
    echo ""
fi

echo ""
echo "========================================="
echo "Quick Test Commands:"
echo "========================================="
echo ""
echo "Test Matrix 7 (most common for portrait + right rotation):"
echo "  xinput map-to-output $TOUCH_ID $DISPLAY_NAME"
echo "  xinput set-prop $TOUCH_ID 'Coordinate Transformation Matrix' 0 1 0 -1 0 1 0 0 1"
echo ""
echo "Test Matrix 5 (alternative for portrait):"
echo "  xinput map-to-output $TOUCH_ID $DISPLAY_NAME"
echo "  xinput set-prop $TOUCH_ID 'Coordinate Transformation Matrix' 0 -1 1 1 0 0 0 0 1"
echo ""
echo "Test current Matrix 6 (what we're using now):"
echo "  xinput map-to-output $TOUCH_ID $DISPLAY_NAME"
echo "  xinput set-prop $TOUCH_ID 'Coordinate Transformation Matrix' -1 0 1 0 -1 1 0 0 1"
echo ""
echo "========================================="
echo ""
echo "For interactive testing, run:"
echo "  bash test-touch-matrices.sh"
echo ""
