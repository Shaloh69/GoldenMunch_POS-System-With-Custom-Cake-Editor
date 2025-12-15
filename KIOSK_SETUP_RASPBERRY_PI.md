# GoldenMunch Kiosk Setup Guide for Raspberry Pi

Complete setup instructions for running the GoldenMunch POS kiosk on Raspberry Pi with Wayland (rpd-labwc).

## System Requirements

- **Hardware**: Raspberry Pi 4/5 (tested on Pi 5)
- **OS**: Debian 13 (Trixie) or Raspberry Pi OS based on Debian 13
- **Architecture**: aarch64 (ARM64)
- **Desktop Environment**: rpd-labwc (Wayland compositor)
- **Node.js**: v18.17.0 or higher
- **npm**: v9.0.0 or higher

## Prerequisites

### 1. Verify Your System

Run these commands to verify your setup matches the requirements:

```bash
# Check OS version
cat /etc/os-release

# Check architecture
uname -m  # Should show: aarch64

# Check desktop session
echo $DESKTOP_SESSION  # Should show: rpd-labwc

# Check Node.js version
node --version  # Should be v18.17.0 or higher

# Check npm version
npm --version  # Should be v9.0.0 or higher
```

### 2. Install Node.js (if not installed)

If Node.js is not installed or version is too old:

```bash
# Install Node.js using nvm (recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Reload shell
source ~/.bashrc

# Install Node.js LTS
nvm install 18
nvm use 18
nvm alias default 18
```

### 3. Clone the Repository

```bash
# Navigate to home directory
cd ~

# Clone the repository
git clone https://github.com/Shaloh69/GoldenMunch_POS-System-With-Custom-Cake-Editor

# Navigate to the repository
cd GoldenMunch_POS-System-With-Custom-Cake-Editor
```

## Installation Steps

### 1. Install Dependencies

```bash
# Navigate to the Kiosk directory
cd ~/GoldenMunch_POS-System-With-Custom-Cake-Editor/client/Kiosk

# Install all dependencies
npm install

# Verify Electron installation
npx electron --version
```

**Note**: If you encounter network errors during installation, use the safe install script:

```bash
npm run install:safe
```

If Electron specifically fails to install:

```bash
npm run install:electron
```

### 2. Test the Application Manually

Before setting up autostart, test the application manually:

```bash
# Make sure you're in the Kiosk directory
cd ~/GoldenMunch_POS-System-With-Custom-Cake-Editor/client/Kiosk

# Run the development server
npm run electron:dev
```

The application should:
1. Start a Next.js dev server on http://localhost:3002
2. Open an Electron window displaying the kiosk interface
3. No graphics errors should appear in the console

**Troubleshooting**: If you see errors, check the console output and see the Troubleshooting section below.

### 3. Set Up Autostart Service

Once manual testing works, set up the systemd service for autostart:

```bash
# Create systemd user directory if it doesn't exist
mkdir -p ~/.config/systemd/user

# Copy the service file
cp ~/GoldenMunch_POS-System-With-Custom-Cake-Editor/scripts/kiosk-wayland.service ~/.config/systemd/user/

# Make the startup script executable
chmod +x ~/GoldenMunch_POS-System-With-Custom-Cake-Editor/scripts/start-kiosk-wayland.sh

# Reload systemd to recognize the new service
systemctl --user daemon-reload

# Enable the service to start on boot
systemctl --user enable kiosk-wayland.service

# Start the service now
systemctl --user start kiosk-wayland.service
```

### 4. Enable Systemd User Services on Boot

For the user service to start automatically at boot:

```bash
# Enable lingering for your user (allows user services to run without login)
sudo loginctl enable-linger $USER
```

## Monitoring and Control

### Check Service Status

```bash
# Check if the service is running
systemctl --user status kiosk-wayland.service

# View live logs
journalctl --user -u kiosk-wayland.service -f

# View logs from current boot
journalctl --user -u kiosk-wayland.service -b
```

### View Detailed Startup Logs

The startup script also creates a dedicated log file:

```bash
# View the kiosk startup log
tail -f ~/kiosk-startup.log

# View recent errors
grep -i error ~/kiosk-startup.log

# View graphics configuration
grep -A 5 "GRAPHICS CONFIGURATION" ~/kiosk-startup.log
```

### Service Control Commands

```bash
# Stop the kiosk
systemctl --user stop kiosk-wayland.service

# Start the kiosk
systemctl --user start kiosk-wayland.service

# Restart the kiosk
systemctl --user restart kiosk-wayland.service

# Disable autostart (but keep service installed)
systemctl --user disable kiosk-wayland.service

# Re-enable autostart
systemctl --user enable kiosk-wayland.service
```

## Development vs Production Mode

The kiosk can run in two modes controlled by the `NODE_ENV` environment variable:

### Development Mode (Default)

```bash
# In the service file, this is set to:
Environment="NODE_ENV=development"
```

Development mode features:
- Window is not fullscreen (can minimize/close)
- DevTools are open by default
- Frame and menu bar are visible
- Easier to debug and test

### Production Mode

To run in production (true kiosk) mode:

```bash
# Edit the service file
nano ~/.config/systemd/user/kiosk-wayland.service

# Change the NODE_ENV line to:
Environment="NODE_ENV=production"

# Save and reload
systemctl --user daemon-reload
systemctl --user restart kiosk-wayland.service
```

Production mode features:
- Fullscreen kiosk mode (cannot exit without special keys)
- No DevTools
- No frame or menu bar
- Right-click disabled
- Power saving disabled (screen won't sleep)

## Troubleshooting

### Issue: Graphics/DRM Errors

**Symptoms**: Errors like:
- `Failed to get fd for plane.: No such file or directory`
- `Failed to export buffer to dma_buf`
- `ERROR:gbm_wrapper.cc`

**Solution**: The latest code already includes comprehensive graphics configuration to prevent these errors. If you still see them:

1. Ensure you have the latest version of the code
2. Check that hardware acceleration is disabled in the logs:
   ```bash
   journalctl --user -u kiosk-wayland.service | grep "GRAPHICS CONFIGURATION" -A 10
   ```
3. Verify the command-line switches are applied

### Issue: Electron Exits Immediately

**Symptoms**: Service starts but Electron closes right away

**Possible causes**:

1. **Missing node_modules**: The startup script checks for this and runs `npm install` automatically, but ensure it completes successfully:
   ```bash
   cd ~/GoldenMunch_POS-System-With-Custom-Cake-Editor/client/Kiosk
   ls -la node_modules  # Should show directories
   ```

2. **Next.js dev server fails**: Check if port 3002 is already in use:
   ```bash
   lsof -i :3002
   # If something is using it, kill it:
   kill -9 <PID>
   ```

3. **Permission issues**: Ensure script is executable:
   ```bash
   ls -l ~/GoldenMunch_POS-System-With-Custom-Cake-Editor/scripts/start-kiosk-wayland.sh
   # Should show: -rwxr-xr-x
   ```

### Issue: Display Not Found

**Symptoms**:
- `ERROR: Cannot open display`
- Wayland session variables not set

**Solution**:
1. Verify you're running in a Wayland session:
   ```bash
   echo $WAYLAND_DISPLAY  # Should show something like "wayland-0"
   echo $XDG_RUNTIME_DIR  # Should show something like "/run/user/1000"
   ```

2. If running the service before login, ensure lingering is enabled:
   ```bash
   sudo loginctl enable-linger $USER
   ```

3. Check the service has access to display variables:
   ```bash
   systemctl --user show-environment
   ```

### Issue: Service Fails to Start After Reboot

**Symptoms**: Works manually but not after reboot

**Solutions**:

1. Enable lingering:
   ```bash
   sudo loginctl enable-linger $USER
   ```

2. Check if service is enabled:
   ```bash
   systemctl --user is-enabled kiosk-wayland.service
   # Should show: enabled
   ```

3. Increase the sleep delay in the service file:
   ```bash
   nano ~/.config/systemd/user/kiosk-wayland.service
   # Change: ExecStartPre=/bin/sleep 5
   # To: ExecStartPre=/bin/sleep 10
   ```

### Issue: Network Errors During npm install

**Symptoms**: Timeouts, connection refused, cannot resolve host

**Solutions**:

1. Check internet connection:
   ```bash
   ping -c 3 google.com
   ```

2. Check DNS resolution:
   ```bash
   nslookup github.com
   nslookup registry.npmjs.org
   ```

3. If DNS fails, configure DNS servers:
   ```bash
   # Add to /etc/resolv.conf
   sudo nano /etc/resolv.conf
   # Add these lines:
   nameserver 8.8.8.8
   nameserver 8.8.4.4
   ```

4. Use the safe install script with retries:
   ```bash
   cd ~/GoldenMunch_POS-System-With-Custom-Cake-Editor/client/Kiosk
   npm run install:safe
   ```

### Viewing All Logs Together

To see comprehensive diagnostics:

```bash
# Service logs
journalctl --user -u kiosk-wayland.service --since "10 minutes ago"

# Startup script logs
tail -100 ~/kiosk-startup.log

# Check process status
ps aux | grep electron
ps aux | grep node
```

## Advanced Configuration

### Customize Display Settings

Edit `client/Kiosk/electron/main.js` to customize window behavior:

```javascript
// Line ~63: Adjust window size
width: width,      // Full width
height: height,    // Full height
fullscreen: !isDev,  // Fullscreen in production

// Line ~66: Kiosk mode (prevents exit)
kiosk: !isDev,     // Enable kiosk lock in production
```

### Auto-Recovery from Crashes

The service is configured to restart automatically on failure. You can adjust this:

```bash
nano ~/.config/systemd/user/kiosk-wayland.service

# Modify these lines:
Restart=on-failure  # Options: no, on-success, on-failure, always
RestartSec=10       # Seconds to wait before restart
```

### Prevent Screen Blanking

The kiosk automatically prevents the screen from sleeping in production mode (see `client/Kiosk/electron/main.js:250`). For additional protection:

```bash
# Disable screen blanking in Wayland
gsettings set org.gnome.desktop.session idle-delay 0

# Or in raspi-config
sudo raspi-config
# Navigate to: Display Options > Screen Blanking > No
```

## Testing Checklist

Before considering the kiosk production-ready:

- [ ] Manual start works: `npm run electron:dev` from Kiosk directory
- [ ] Service starts: `systemctl --user start kiosk-wayland.service`
- [ ] Service status is active: `systemctl --user status kiosk-wayland.service`
- [ ] No graphics errors in logs: `journalctl --user -u kiosk-wayland.service`
- [ ] Window appears and shows UI correctly
- [ ] No crashes or restarts in first 5 minutes
- [ ] Autostart works after reboot
- [ ] Touch screen responds (if using touch display)
- [ ] QR code scanning works (if using camera)
- [ ] Printer works (if configured)

## Support

If you encounter issues not covered here:

1. Check logs: `journalctl --user -u kiosk-wayland.service -n 100`
2. Check startup log: `cat ~/kiosk-startup.log`
3. Verify dependencies: `cd ~/GoldenMunch_POS-System-With-Custom-Cake-Editor/client/Kiosk && npm ls`
4. Test Electron: `npx electron --version`

## Quick Reference Commands

```bash
# View service status
systemctl --user status kiosk-wayland.service

# View live logs
journalctl --user -u kiosk-wayland.service -f

# Restart service
systemctl --user restart kiosk-wayland.service

# Stop service
systemctl --user stop kiosk-wayland.service

# View startup log
tail -f ~/kiosk-startup.log

# Manual start (for testing)
cd ~/GoldenMunch_POS-System-With-Custom-Cake-Editor/client/Kiosk
npm run electron:dev
```

## Architecture Details

The kiosk setup consists of:

1. **systemd Service** (`kiosk-wayland.service`): Manages autostart and process lifecycle
2. **Startup Script** (`start-kiosk-wayland.sh`): Handles environment setup and launches app
3. **Electron Main Process** (`electron/main.js`): Configures Electron with Pi-compatible settings
4. **Next.js App** (running on port 3002): The actual kiosk UI
5. **Concurrently**: Coordinates running both Next.js dev server and Electron together

The flow is:
```
System Boot → Login → systemd starts service →
Startup script checks environment → npm install if needed →
Start Next.js dev server on :3002 →
Wait for server ready → Start Electron →
Electron loads http://localhost:3002 → Kiosk displays
```
