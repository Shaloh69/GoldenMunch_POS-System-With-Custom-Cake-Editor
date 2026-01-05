#!/bin/bash
# Systematic Matrix Tester for ILITEK Touchscreen
# Tests all 8 matrices one by one

export DISPLAY=:0
export XAUTHORITY=/home/saarasubiza/.Xauthority

TOUCH_ID=10
DISPLAY_NAME=$(xrandr | grep " connected" | head -1 | awk '{print $1}')

echo "========================================="
echo "SYSTEMATIC TOUCH MATRIX TESTER"
echo "========================================="
echo "Touch ID: $TOUCH_ID"
echo "Display: $DISPLAY_NAME"
echo ""
echo "Testing all 8 matrices..."
echo "After EACH test, tell me if touch works:"
echo "  - Test all 4 corners"
echo "  - Swipe down (should go down)"
echo "  - Swipe up (should go up)"
echo ""

# Function to test a matrix
test_matrix() {
    local num=$1
    local values=$2
    local desc=$3

    echo "========================================="
    echo "MATRIX $num: $desc"
    echo "Values: $values"
    echo "========================================="

    xinput map-to-output $TOUCH_ID $DISPLAY_NAME 2>/dev/null
    xinput set-prop $TOUCH_ID "Coordinate Transformation Matrix" $values 2>/dev/null

    if [ $? -eq 0 ]; then
        echo "✓ Applied successfully"
        echo ""
        echo "TEST NOW:"
        echo "  1. Touch all 4 corners"
        echo "  2. Swipe DOWN"
        echo "  3. Swipe UP"
        echo ""
        read -p "Does this matrix work? (y/n): " answer
        echo ""

        if [ "$answer" = "y" ] || [ "$answer" = "Y" ]; then
            echo ""
            echo "🎉🎉🎉 SUCCESS! 🎉🎉🎉"
            echo ""
            echo "Matrix $num is CORRECT!"
            echo "Values: $values"
            echo ""
            echo "Tell Claude: 'Matrix $num works!'"
            echo ""
            exit 0
        fi
    else
        echo "❌ Failed to apply"
        echo ""
    fi
}

# Test all 8 matrices
echo "Starting tests..."
echo ""
sleep 2

test_matrix 1 "1 0 0 0 1 0 0 0 1" "Identity (no transformation)"
test_matrix 2 "-1 0 1 0 1 0 0 0 1" "Invert X"
test_matrix 3 "1 0 0 0 -1 1 0 0 1" "Invert Y"
test_matrix 4 "0 1 0 1 0 0 0 0 1" "Swap X,Y"
test_matrix 5 "0 -1 1 1 0 0 0 0 1" "Swap X,Y + Invert X (current)"
test_matrix 6 "-1 0 1 0 -1 1 0 0 1" "Invert both X,Y"
test_matrix 7 "0 1 0 -1 0 1 0 0 1" "Swap X,Y + Invert Y"
test_matrix 8 "0 -1 1 -1 0 1 0 0 1" "Swap X,Y + Invert both"

echo ""
echo "========================================="
echo "NO MATRIX WORKED!"
echo "========================================="
echo ""
echo "This is unusual. Possible issues:"
echo "1. Wrong device being calibrated"
echo "2. Hardware/driver issue"
echo "3. Need custom matrix values"
echo ""
echo "Please share this with Claude for further investigation."
