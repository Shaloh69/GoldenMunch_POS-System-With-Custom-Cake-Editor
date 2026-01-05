# Touch Calibration Fix - January 2026

## Problem Statement
Touch calibration was not persisting reliably due to timing issues in the startup sequence. The calibration was being reset by display events and Chromium initialization.

## Root Causes Identified

### 1. Insufficient Settling Time
- **Original**: 10 seconds wait after Chromium launch
- **Issue**: Not enough time for all display events and Chromium initialization to settle
- **Impact**: Calibration could be reset immediately after application

### 2. Single-Apply Strategy
- **Original**: Calibration applied only once
- **Issue**: No verification or retry if the matrix didn't stick
- **Impact**: Fragile - one failure meant no calibration

### 3. Monitor Startup Delay
- **Original**: 5-second delay before monitor starts checking
- **Issue**: Gap between initial calibration and monitor protection
- **Impact**: Window where calibration could revert uncaught

### 4. Display Rotation Timing
- **Original**: 2-second wait after xrandr rotation
- **Issue**: X server may not have fully processed rotation events
- **Impact**: Subsequent operations could trigger calibration reset

## Solutions Implemented

### ✅ Fix 1: Increased Chromium Settling Time
**File**: `start-kiosk.sh:216`
```bash
# Before
sleep 10

# After
sleep 15  # Increased to 15s to ensure Chromium and all display events have settled
```

### ✅ Fix 2: Double-Apply with Verification
**File**: `start-kiosk.sh:229-266`
```bash
# FIRST APPLICATION (line 229-244)
- Map touchscreen to display
- Apply calibration matrix
- Log success/failure

# SECOND APPLICATION (line 246-266)
- Wait 2 seconds
- Re-map to display
- Re-apply calibration matrix
- VERIFY the matrix actually stuck
- Log the verified matrix value
```

### ✅ Fix 3: Reduced Monitor Initial Delay
**File**: `start-kiosk.sh:301`
```bash
# Before
sleep 5

# After
sleep 1  # Minimal delay - protection starts almost immediately
```

### ✅ Fix 4: Final Safety Calibration
**File**: `start-kiosk.sh:349-373`
```bash
# NEW: Apply calibration one final time AFTER monitor starts
# This ensures calibration is the absolute LAST thing applied
- Wait 2 seconds
- Re-detect touchscreen
- Map to display
- Apply calibration
- Verify and log final matrix
```

### ✅ Fix 5: Extended Display Rotation Wait
**File**: `start-kiosk.sh:118`
```bash
# Before
sleep 2

# After
sleep 3  # Increased to 3s to prevent calibration reset issues
```

## New Startup Timeline

```
┌─────────────────────────────────────────────────────────────┐
│ STARTUP SEQUENCE - TOUCH CALIBRATION FOCUS                 │
└─────────────────────────────────────────────────────────────┘

1. X Server Ready                    (wait up to 30s)
2. Network Ready                     (wait up to 60s)
3. Disable Screen Blanking           (xset commands)
4. Display Rotation                  (xrandr --rotate right)
   └─> Wait 3s (IMPROVED: was 2s)    ← X server settles
5. Touchscreen Detection             (xinput list + 2s wait)
6. Chromium Launches                 (kiosk mode)
7. Chromium Settling Time
   └─> Wait 15s (IMPROVED: was 10s)  ← All display events settle
8. CALIBRATION PHASE 1
   ├─> Map to display
   ├─> Apply Matrix 6
   └─> Log result
9. CALIBRATION PHASE 2               (NEW)
   ├─> Wait 2s
   ├─> Re-map to display
   ├─> Re-apply Matrix 6
   └─> VERIFY matrix stuck
10. Monitor Starts
    └─> Initial delay 1s (IMPROVED: was 5s)
11. FINAL SAFETY CALIBRATION         (NEW)
    ├─> Wait 2s
    ├─> Re-map to display
    ├─> Apply Matrix 6
    └─> Verify and log final state

┌─────────────────────────────────────────────────────────────┐
│ MONITOR PROTECTION (Background)                            │
│ - Force-applies Matrix 6 every 45 seconds                  │
│ - Starts 1 second after monitor launch                     │
│ - Ensures calibration never reverts                        │
└─────────────────────────────────────────────────────────────┘
```

## Benefits

### 🎯 Reliability
- **3 calibration applications** ensure it sticks (first, second, final)
- **2 verification checks** confirm matrix is correct
- **Extended settling times** prevent race conditions

### 🛡️ Protection
- **Faster monitor startup** (1s vs 5s) - minimal gap in protection
- **Final safety calibration** - absolute last application before kiosk runs
- **Continuous monitoring** - 45-second force-apply maintains calibration

### 📊 Visibility
- **Enhanced logging** shows all calibration attempts
- **Matrix verification** confirms what was actually applied
- **Timestamp tracking** helps debug timing issues

## Testing Recommendations

### On Raspberry Pi with Touch Display:

1. **Clean Boot Test**
   ```bash
   sudo reboot
   # After reboot, check logs:
   tail -f ~/.goldenmunch-logs/startup.log
   tail -f ~/.goldenmunch-logs/touch-calibration-monitor.log
   ```

2. **Verify Calibration Persists**
   ```bash
   # Check current matrix
   xinput list-props <TOUCH_ID> | grep "Coordinate Transformation Matrix"
   # Should show: -1.000000, 0.000000, 1.000000, 0.000000, -1.000000, 1.000000, 0.000000, 0.000000, 1.000000
   ```

3. **Test Touch Accuracy**
   - Tap all four corners of the screen
   - Tap should register exactly where you touch
   - No inverted or offset behavior

4. **Monitor Logs**
   ```bash
   # Watch for force-apply messages every 45 seconds
   tail -f ~/.goldenmunch-logs/touch-calibration-monitor.log
   ```

## Rollback Instructions

If issues occur, revert to previous version:
```bash
cd ~/GoldenMunch_POS-System-With-Custom-Cake-Editor
git checkout HEAD~1 client/Kiosk_Electron/scripts/start-kiosk.sh
sudo systemctl restart goldenmunch-kiosk
```

## Additional Notes

### X11 Persistent Configuration
The file `/etc/X11/xorg.conf.d/99-touchscreen-calibration.conf` should also be installed for X-server level persistence:

```bash
cd ~/GoldenMunch_POS-System-With-Custom-Cake-Editor/client/Kiosk_Electron/scripts
bash install-touch-calibration.sh
```

This provides an additional layer of protection at the X server level.

## Change Summary

| Component | Old Value | New Value | Reason |
|-----------|-----------|-----------|--------|
| Chromium wait | 10s | 15s | More settling time |
| Calibration applies | 1x | 3x (first, second, final) | Ensure it sticks |
| Monitor delay | 5s | 1s | Faster protection |
| Display rotation wait | 2s | 3s | X server settling |
| Verification | None | 2x checks | Confirm matrix |
| **Calibration Matrix** | **Initially tested Matrix 5** | **Matrix 6** (`-1 0 1 0 -1 1 0 0 1`) | **Correct for 90° CW rotation** |

---

## Matrix Discovery Process (Critical Fix)

**Date**: 2026-01-05

### Initial Attempt (WRONG)
- **Issue**: Initially changed to Matrix 5 based on incomplete testing
- **Problem**: Matrix 5 (`0 -1 1 1 0 0 0 0 1`) did NOT work correctly
- **Symptom**: Sideways swipe would scroll upward instead of correct behavior

### User Testing Discovery (CORRECT)
- **User confirmed**: Matrix 6 (`-1 0 1 0 -1 1 0 0 1`) works perfectly when applied manually
- **Root cause**: Matrix 6 was being overridden by scripts that were force-applying Matrix 5
- **Symptom**: "Matrix 6 works but disappears immediately"

### Final Solution - Matrix 6
**Matrix 6 Values**: `-1 0 1 0 -1 1 0 0 1`
- Inverts both X and Y coordinates
- **CONFIRMED WORKING** by user testing
- Correct for ILITEK touchscreen with 90° clockwise (right) display rotation
- Device: ILITEK ILITEK-TP Mouse (ID 10)

---

**Author**: Claude AI
**Date**: 2026-01-05
**Issue**: Touch calibration testing process - Matrix 6 confirmed as correct
**Status**: ✅ **FIXED - Matrix 6 Confirmed Working by User**
