#!/bin/bash
# Touch Calibration Matrix Tester
# This script helps you find the correct calibration matrix for your touchscreen

echo "======================================"
echo "Touch Calibration Matrix Tester"
echo "======================================"
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

echo "✓ Touchscreen detected (ID: $TOUCH_ID)"

# Get device name
TOUCH_NAME=$(xinput list | grep "id=$TOUCH_ID" | sed 's/.*↳//' | sed 's/id=.*//' | xargs)
echo "  Device: $TOUCH_NAME"
echo ""

# Get display
DISPLAY_NAME=$(xrandr 2>/dev/null | grep " connected" | head -1 | awk '{print $1}')
echo "✓ Display: $DISPLAY_NAME"
echo ""

# Show current matrix
echo "Current Calibration Matrix:"
CURRENT_MATRIX=$(xinput list-props "$TOUCH_ID" 2>/dev/null | grep "Coordinate Transformation Matrix")
echo "  $CURRENT_MATRIX"
echo ""

echo "======================================"
echo "Available Calibration Matrices"
echo "======================================"
echo ""
echo "Matrix 1: Identity (No transformation)"
echo "  [ 1  0  0 ]     Normal orientation"
echo "  [ 0  1  0 ]"
echo "  [ 0  0  1 ]"
echo ""
echo "Matrix 2: Invert X (flip horizontally)"
echo "  [-1  0  1 ]     Left becomes right"
echo "  [ 0  1  0 ]"
echo "  [ 0  0  1 ]"
echo ""
echo "Matrix 3: Invert Y (flip vertically)"
echo "  [ 1  0  0 ]     Top becomes bottom"
echo "  [ 0 -1  1 ]"
echo "  [ 0  0  1 ]"
echo ""
echo "Matrix 4: Swap X and Y (90° rotation)"
echo "  [ 0  1  0 ]     Portrait to landscape"
echo "  [ 1  0  0 ]"
echo "  [ 0  0  1 ]"
echo ""
echo "Matrix 5: Swap X,Y + Invert X (270° rotation)"
echo "  [ 0 -1  1 ]     Rotate 270° counterclockwise"
echo "  [ 1  0  0 ]"
echo "  [ 0  0  1 ]"
echo ""
echo "Matrix 6: Invert both X and Y (180° rotation)"
echo "  [-1  0  1 ]     Upside down"
echo "  [ 0 -1  1 ]"
echo "  [ 0  0  1 ]"
echo ""
echo "Matrix 7: Swap X,Y + Invert Y (90° rotation)"
echo "  [ 0  1  0 ]     Rotate 90° clockwise"
echo "  [-1  0  1 ]"
echo "  [ 0  0  1 ]"
echo ""
echo "Matrix 8: Swap X,Y + Invert both (270° rotation)"
echo "  [ 0 -1  1 ]     Rotate 90° counterclockwise"
echo "  [-1  0  1 ]"
echo "  [ 0  0  1 ]"
echo ""

# Function to apply matrix
apply_matrix() {
    local matrix_num=$1
    local matrix_values=$2
    local description=$3

    echo "======================================"
    echo "Testing Matrix $matrix_num: $description"
    echo "======================================"
    echo "Values: $matrix_values"
    echo ""

    # Map to display first
    xinput map-to-output "$TOUCH_ID" "$DISPLAY_NAME" 2>/dev/null

    # Apply matrix
    xinput set-prop "$TOUCH_ID" "Coordinate Transformation Matrix" $matrix_values 2>/dev/null

    if [ $? -eq 0 ]; then
        echo "✓ Matrix applied successfully!"
        echo ""
        echo "TESTING INSTRUCTIONS:"
        echo "1. Touch the TOP-LEFT corner of the screen"
        echo "2. Touch the TOP-RIGHT corner"
        echo "3. Touch the BOTTOM-LEFT corner"
        echo "4. Touch the BOTTOM-RIGHT corner"
        echo "5. Touch the CENTER of the screen"
        echo ""
        echo "Does the touch work correctly?"
        echo ""

        # Verify applied
        VERIFIED=$(xinput list-props "$TOUCH_ID" 2>/dev/null | grep "Coordinate Transformation Matrix" | sed 's/.*:\s*//' | tr -d ',' | xargs)
        echo "Verified matrix: $VERIFIED"
        echo ""

        return 0
    else
        echo "❌ Failed to apply matrix!"
        return 1
    fi
}

# Interactive testing
while true; do
    echo "======================================"
    echo "Choose a matrix to test (or 'q' to quit):"
    echo "======================================"
    echo "1) Identity (no change)"
    echo "2) Invert X (flip horizontal)"
    echo "3) Invert Y (flip vertical)"
    echo "4) Swap X,Y (90° basic)"
    echo "5) Swap + Invert X (270°)"
    echo "6) Invert both X,Y (180°) [CURRENT DEFAULT]"
    echo "7) Swap + Invert Y (90° clockwise)"
    echo "8) Swap + Invert both (90° counterclockwise)"
    echo "a) Auto-test all matrices (5 seconds each)"
    echo "q) Quit"
    echo ""
    read -p "Enter choice: " choice

    case $choice in
        1)
            apply_matrix 1 "1 0 0 0 1 0 0 0 1" "Identity"
            read -p "Press Enter to continue..."
            ;;
        2)
            apply_matrix 2 "-1 0 1 0 1 0 0 0 1" "Invert X"
            read -p "Press Enter to continue..."
            ;;
        3)
            apply_matrix 3 "1 0 0 0 -1 1 0 0 1" "Invert Y"
            read -p "Press Enter to continue..."
            ;;
        4)
            apply_matrix 4 "0 1 0 1 0 0 0 0 1" "Swap X,Y"
            read -p "Press Enter to continue..."
            ;;
        5)
            apply_matrix 5 "0 -1 1 1 0 0 0 0 1" "Swap + Invert X (270°)"
            read -p "Press Enter to continue..."
            ;;
        6)
            apply_matrix 6 "-1 0 1 0 -1 1 0 0 1" "Invert both X,Y (180°)"
            read -p "Press Enter to continue..."
            ;;
        7)
            apply_matrix 7 "0 1 0 -1 0 1 0 0 1" "Swap + Invert Y (90° CW)"
            read -p "Press Enter to continue..."
            ;;
        8)
            apply_matrix 8 "0 -1 1 -1 0 1 0 0 1" "Swap + Invert both (90° CCW)"
            read -p "Press Enter to continue..."
            ;;
        a|A)
            echo ""
            echo "Auto-testing all matrices (5 seconds each)..."
            echo "Test the touch in each configuration!"
            echo ""
            apply_matrix 1 "1 0 0 0 1 0 0 0 1" "Identity"
            sleep 5
            apply_matrix 2 "-1 0 1 0 1 0 0 0 1" "Invert X"
            sleep 5
            apply_matrix 3 "1 0 0 0 -1 1 0 0 1" "Invert Y"
            sleep 5
            apply_matrix 4 "0 1 0 1 0 0 0 0 1" "Swap X,Y"
            sleep 5
            apply_matrix 5 "0 -1 1 1 0 0 0 0 1" "Swap + Invert X"
            sleep 5
            apply_matrix 6 "-1 0 1 0 -1 1 0 0 1" "Invert both"
            sleep 5
            apply_matrix 7 "0 1 0 -1 0 1 0 0 1" "Swap + Invert Y"
            sleep 5
            apply_matrix 8 "0 -1 1 -1 0 1 0 0 1" "Swap + Invert both"
            sleep 5
            echo ""
            echo "Auto-test complete!"
            read -p "Press Enter to continue..."
            ;;
        q|Q)
            echo ""
            echo "Exiting..."
            exit 0
            ;;
        *)
            echo "Invalid choice!"
            ;;
    esac
done
