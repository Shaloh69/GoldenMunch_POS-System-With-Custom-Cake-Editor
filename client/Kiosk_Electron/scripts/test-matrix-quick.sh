#!/bin/bash
# Quick Touch Matrix Test
# Run this to test different calibration matrices

# Set up X display access
export DISPLAY=:0
export XAUTHORITY="${HOME}/.Xauthority"

echo "========================================="
echo "Touch Calibration Matrix Quick Test"
echo "========================================="
echo ""

# Check X server access
if ! xset q &>/dev/null 2>&1; then
    echo "❌ ERROR: Cannot connect to X server!"
    echo ""
    echo "Try these fixes:"
    echo "1. Make sure X is running: ps aux | grep X"
    echo "2. Run as the user who started X"
    echo "3. Check DISPLAY: echo \$DISPLAY"
    echo "4. Check XAUTHORITY: ls -la ~/.Xauthority"
    echo ""
    exit 1
fi

echo "✓ X server connected!"
echo ""

# Detect touchscreen
TOUCH_ID=$(xinput list 2>/dev/null | grep -iE "touchscreen|touch|ILITEK" | grep -v -i "mouse" | grep -o 'id=[0-9]*' | head -1 | cut -d= -f2)

if [ -z "$TOUCH_ID" ]; then
    echo "❌ ERROR: No touchscreen detected!"
    echo ""
    echo "Available input devices:"
    xinput list
    exit 1
fi

# Get touch device name
TOUCH_NAME=$(xinput list | grep "id=$TOUCH_ID" | sed 's/.*↳//' | sed 's/id=.*//' | xargs)

echo "✓ Touchscreen detected!"
echo "  ID: $TOUCH_ID"
echo "  Name: $TOUCH_NAME"
echo ""

# Get display
DISPLAY_NAME=$(xrandr 2>/dev/null | grep " connected" | head -1 | awk '{print $1}')

if [ -z "$DISPLAY_NAME" ]; then
    echo "❌ ERROR: No display detected!"
    exit 1
fi

echo "✓ Display: $DISPLAY_NAME"
echo ""

# Get display rotation
ROTATION=$(xrandr 2>/dev/null | grep "$DISPLAY_NAME" | grep -oP '\b(normal|left|right|inverted)\b')
echo "✓ Display rotation: ${ROTATION:-normal}"
echo ""

# Show current matrix
echo "Current touch matrix:"
CURRENT_MATRIX=$(xinput list-props "$TOUCH_ID" 2>/dev/null | grep "Coordinate Transformation Matrix")
echo "  $CURRENT_MATRIX"
echo ""

echo "========================================="
echo "Matrix Tests for Portrait (90° CW)"
echo "========================================="
echo ""

# Test Matrix 7
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Testing Matrix 7: Swap X,Y + Invert Y"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Matrix values: 0 1 0 -1 0 1 0 0 1"
echo ""
xinput map-to-output "$TOUCH_ID" "$DISPLAY_NAME" 2>/dev/null
xinput set-prop "$TOUCH_ID" "Coordinate Transformation Matrix" 0 1 0 -1 0 1 0 0 1 2>/dev/null

if [ $? -eq 0 ]; then
    echo "✓ Matrix 7 applied!"
    echo ""
    echo "TEST INSTRUCTIONS:"
    echo "1. Touch TOP-LEFT corner"
    echo "2. Touch TOP-RIGHT corner"
    echo "3. Touch BOTTOM-LEFT corner"
    echo "4. Touch BOTTOM-RIGHT corner"
    echo "5. Touch CENTER"
    echo ""

    # Verify
    APPLIED=$(xinput list-props "$TOUCH_ID" 2>/dev/null | grep "Coordinate Transformation Matrix" | sed 's/.*:\s*//' | tr -d ',' | xargs)
    echo "Verified: $APPLIED"
    echo ""

    read -p "Does Matrix 7 work perfectly? (y/n): " answer

    if [ "$answer" = "y" ] || [ "$answer" = "Y" ]; then
        echo ""
        echo "🎉 SUCCESS! Matrix 7 is the correct calibration!"
        echo ""
        echo "Correct matrix values: 0 1 0 -1 0 1 0 0 1"
        echo ""
        echo "Tell Claude: 'Matrix 7 works!'"
        exit 0
    fi
else
    echo "❌ Failed to apply Matrix 7"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Testing Matrix 5: Swap X,Y + Invert X"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Matrix values: 0 -1 1 1 0 0 0 0 1"
echo ""
xinput map-to-output "$TOUCH_ID" "$DISPLAY_NAME" 2>/dev/null
xinput set-prop "$TOUCH_ID" "Coordinate Transformation Matrix" 0 -1 1 1 0 0 0 0 1 2>/dev/null

if [ $? -eq 0 ]; then
    echo "✓ Matrix 5 applied!"
    echo ""
    echo "TEST INSTRUCTIONS:"
    echo "Touch all four corners and center again..."
    echo ""

    # Verify
    APPLIED=$(xinput list-props "$TOUCH_ID" 2>/dev/null | grep "Coordinate Transformation Matrix" | sed 's/.*:\s*//' | tr -d ',' | xargs)
    echo "Verified: $APPLIED"
    echo ""

    read -p "Does Matrix 5 work perfectly? (y/n): " answer

    if [ "$answer" = "y" ] || [ "$answer" = "Y" ]; then
        echo ""
        echo "🎉 SUCCESS! Matrix 5 is the correct calibration!"
        echo ""
        echo "Correct matrix values: 0 -1 1 1 0 0 0 0 1"
        echo ""
        echo "Tell Claude: 'Matrix 5 works!'"
        exit 0
    fi
else
    echo "❌ Failed to apply Matrix 5"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Testing Matrix 3: Invert Y only"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Matrix values: 1 0 0 0 -1 1 0 0 1"
echo ""
xinput map-to-output "$TOUCH_ID" "$DISPLAY_NAME" 2>/dev/null
xinput set-prop "$TOUCH_ID" "Coordinate Transformation Matrix" 1 0 0 0 -1 1 0 0 1 2>/dev/null

if [ $? -eq 0 ]; then
    echo "✓ Matrix 3 applied!"
    echo ""
    echo "TEST INSTRUCTIONS:"
    echo "Touch all four corners and center again..."
    echo ""

    # Verify
    APPLIED=$(xinput list-props "$TOUCH_ID" 2>/dev/null | grep "Coordinate Transformation Matrix" | sed 's/.*:\s*//' | tr -d ',' | xargs)
    echo "Verified: $APPLIED"
    echo ""

    read -p "Does Matrix 3 work perfectly? (y/n): " answer

    if [ "$answer" = "y" ] || [ "$answer" = "Y" ]; then
        echo ""
        echo "🎉 SUCCESS! Matrix 3 is the correct calibration!"
        echo ""
        echo "Correct matrix values: 1 0 0 0 -1 1 0 0 1"
        echo ""
        echo "Tell Claude: 'Matrix 3 works!'"
        exit 0
    fi
else
    echo "❌ Failed to apply Matrix 3"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "None of the common matrices worked!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Please run the full interactive tester:"
echo "  bash test-touch-matrices.sh"
echo ""
echo "Or describe the touch behavior to Claude:"
echo "  - When touching top-left, where does it register?"
echo "  - When touching top-right, where does it register?"
echo ""
