# App Icons

Place your application icons in this directory for building executables.

## Required Files

### Windows
- `icon.ico` - Windows application icon (256x256 recommended)

### macOS
- `icon.icns` - macOS application icon (512x512 recommended)

### Linux
- `icon.png` - Linux application icon (512x512 PNG)

## Creating Icons

### From PNG Source

If you have a PNG logo/icon:

1. **For Windows (.ico)**:
   - Use online converter: https://convertio.co/png-ico/
   - Or use ImageMagick: `convert icon.png -resize 256x256 icon.ico`

2. **For macOS (.icns)**:
   - Use online converter: https://cloudconvert.com/png-to-icns
   - Or use `iconutil` on macOS

3. **For Linux (.png)**:
   - Use any image editor to resize to 512x512
   - Save as PNG with transparency

## Default Behavior

If icons are not provided, Electron will use default icons. The app will still work, but won't have custom branding in:
- Taskbar/Dock
- Alt+Tab switcher
- Desktop shortcuts
- Start menu/Applications folder

## Note

The build process will look for these files. If missing, you may see warnings during build, but the app will still compile successfully.
