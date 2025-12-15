# GoldenMunch Kiosk Issues - Root Cause Analysis

**Date**: 2025-12-15
**System**: Raspberry Pi with Debian GNU/Linux 13 (Trixie)
**Desktop**: rpd-labwc (Wayland)
**Kernel**: 6.12.47+rpt-rpi-2712

---

## Overview

The kiosk application is experiencing multiple critical failures preventing it from running properly on the Raspberry Pi. This document provides a comprehensive analysis of the root causes and solutions.

---

## Critical Issues Identified

### 1. GBM/DRM Graphics Errors ⚠️ **HIGH PRIORITY**

#### Symptoms
```
ERROR:gbm_wrapper.cc(79)] Failed to get fd for plane.: No such file or directory (2)
ERROR:gbm_wrapper.cc(262)] Failed to export buffer to dma_buf: No such file or directory (2)
```

These errors repeat hundreds of times, flooding the console.

#### Root Cause
Despite comprehensive GPU disabling in `electron/main.js`:
- Hardware acceleration disabled (`app.disableHardwareAcceleration()`)
- GPU features disabled (`--disable-gpu`, `--disable-gpu-compositing`)
- Software rendering enabled

**Electron on Wayland STILL attempts to initialize DRM/GBM** for compositor integration. This happens because:
1. Wayland's architecture requires compositor access
2. Chromium (Electron's base) tries to use native Wayland protocols
3. The Raspberry Pi's DRM/GBM drivers are not accessible in the current environment

#### Impact
- Console spam making debugging difficult
- Potential performance degradation from repeated failed DRM access attempts
- Risk of application crashes

#### Solution Required
Add additional Electron flags to force pure software rendering without ANY DRM/GBM access:
```javascript
app.commandLine.appendSwitch('disable-features', 'VizDisplayCompositor,UseChromeOSDirectVideoDecoder');
app.commandLine.appendSwitch('use-gl', 'swiftshader'); // Force SwiftShader software renderer
app.commandLine.appendSwitch('enable-unsafe-swiftshader');
```

---

### 2. Next.js Package Not Found Error ⚠️ **CRITICAL**

#### Symptoms
```
FATAL: An unexpected Turbopack error occurred
[Error [TurbopackInternalError]: Next.js package not found
- Execution of get_entrypoints_with_issues_operation failed
- Execution of EntrypointOperation::new failed
- Execution of Project::entrypoints failed
- Next.js package not found
npm run dev exited with code 0
```

#### Root Cause
**Missing `node_modules` directory** - verified by directory listing showing no node_modules in `/home/user/GoldenMunch_POS-System-With-Custom-Cake-Editor/client/Kiosk/`.

This is happening because:
1. The startup script checks for node_modules existence
2. If missing, it SHOULD run `npm install`
3. However, the service might be failing before reaching that point, OR
4. npm install is failing silently

#### Secondary Issue: Turbopack
The `package.json` script uses:
```json
"dev": "next dev --turbopack -p 3002"
```

Turbopack is still experimental and may have issues with:
- Electron integration
- Wayland environment
- File system access on Raspberry Pi

#### Impact
- Application cannot start at all
- Development server fails to launch
- No UI is displayed

#### Solution Required
1. **Immediate**: Install dependencies manually
2. **Short-term**: Remove `--turbopack` flag to use stable webpack
3. **Long-term**: Ensure npm install runs successfully in service startup

---

### 3. Service Configuration Mismatches ⚠️ **HIGH PRIORITY**

#### Issue 3.1: Dual Service Files
Two systemd service files exist:
- `scripts/kiosk.service` - Configured for **X11**
- `scripts/kiosk-wayland.service` - Configured for **Wayland**

**Current System**: Running Wayland (rpd-labwc)
**Problem**: Confusion about which service is active

#### Issue 3.2: User Mismatch
`kiosk.service` configuration:
```ini
User=pi
Group=pi
WorkingDirectory=/home/pi/GoldenMunch_POS-System-With-Custom-Cake-Editor/client/Kiosk
```

**Actual user running the system**: `saarasubiza` (from screenshots)
**Impact**: Service will fail because user 'pi' may not exist or paths are wrong

#### Issue 3.3: User Lingering Not Enabled
From diagnostics screenshot:
```
! User lingering is not enabled
This means the service won't start until you log in
Run: sudo loginctl enable-linger saarasubiza
```

**Impact**: Kiosk won't auto-start on boot

#### Solution Required
1. Standardize on `kiosk-wayland.service`
2. Update user to `saarasubiza` (or use `%u` for current user)
3. Enable user lingering
4. Remove or rename old `kiosk.service`

---

### 4. Environment Configuration Issues

#### Issue 4.1: NODE_ENV Setting
`kiosk-wayland.service` sets:
```ini
Environment="NODE_ENV=development"
```

**Problems**:
1. Development mode requires Next.js dev server to rebuild
2. Turbopack in dev mode is unstable
3. Slower performance
4. Not suitable for production kiosk

**Should be**: `NODE_ENV=production` with pre-built static files

#### Issue 4.2: Missing Wayland Environment Variables
While the service uses `PassEnvironment`, it doesn't explicitly set fallbacks if variables are missing.

---

## Recommended Fix Priority

### Priority 1: Get It Running (Immediate)
1. Install node_modules: `cd ~/GoldenMunch_POS-System-With-Custom-Cake-Editor/client/Kiosk && npm install`
2. Fix user in service file to match actual user
3. Remove Turbopack flag temporarily

### Priority 2: Stop DRM Errors (Same Session)
4. Add additional Electron flags to prevent DRM/GBM access
5. Test with software rendering flags

### Priority 3: Production Readiness (Next Session)
6. Switch to production mode
7. Enable user lingering for auto-start
8. Build static export instead of dev server
9. Create systemd service that uses built files

---

## Files Requiring Changes

1. `client/Kiosk/electron/main.js` - Add DRM prevention flags
2. `client/Kiosk/package.json` - Remove --turbopack from dev script
3. `scripts/kiosk-wayland.service` - Fix user configuration
4. `scripts/start-kiosk-wayland.sh` - Add better error handling for npm install

---

## Testing Checklist

After fixes:
- [ ] No GBM/DRM errors in logs
- [ ] Next.js dev server starts successfully
- [ ] Electron window opens and displays UI
- [ ] No "package not found" errors
- [ ] Service can start/stop cleanly
- [ ] Service survives reboot (after lingering enabled)

---

## Additional Notes

### System Specs from Diagnostics
- Electron: v34.5.8
- Next.js: v15.3.1
- Node.js: (version shown in diagnostic screenshot)
- Desktop Session: rpd-labwc (Wayland compositor)
- XDG Session Type: wayland

### Recent Commits Show Previous Fix Attempts
```
9a966db fix: Resolve DRM/GBM graphics errors in Raspberry Pi kiosk mode
d59fbcd fix: Resolve Electron startup exit issues in kiosk mode
4040fd4 fix: Change kiosk service to development mode
fe05214 feat: Add comprehensive error logging for kiosk crashes
```

This indicates ongoing work on these issues. The DRM/GBM errors persist despite previous attempts, suggesting more aggressive rendering flags are needed.
