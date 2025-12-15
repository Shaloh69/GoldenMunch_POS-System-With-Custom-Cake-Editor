# GoldenMunch POS System - Client Applications

This directory contains the client-side applications for the GoldenMunch POS system.

---

## 📂 Project Structure

```
client/
├── Kiosk_Web/          # Next.js web application (UI)
├── Kiosk_Electron/     # Electron client (hardware wrapper)
├── Admin/              # Admin panel
└── README.md           # This file
```

---

## 🏗️ Architecture Overview

The GoldenMunch Kiosk system uses a **separated architecture** with two independent projects:

```
┌─────────────────────────────────────┐
│  ELECTRON CLIENT                    │
│  (Kiosk_Electron)                   │
│  ├─ Lightweight wrapper (~50MB)     │
│  ├─ Thermal printer integration     │
│  ├─ Kiosk mode (fullscreen)         │
│  ├─ Settings panel (Ctrl+Shift+C)  │
│  └─ Loads remote Next.js URL        │
└────────────┬────────────────────────┘
             │
             │ HTTPS
             ▼
┌─────────────────────────────────────┐
│  NEXT.JS WEB APP                    │
│  (Kiosk_Web)                        │
│  ├─ Full UI (~200MB node_modules)   │
│  ├─ Custom cake editor (3D)         │
│  ├─ Cart & order management         │
│  ├─ Deployed on Render.com          │
│  └─ Independent from Electron       │
└────────────┬────────────────────────┘
             │
             │ API Calls
             ▼
┌─────────────────────────────────────┐
│  BACKEND API (Separate Repo)       │
│  https://goldenmunch-pos-system... │
└─────────────────────────────────────┘
```

---

## 📦 Projects

### 1. Kiosk_Web (Next.js Web Application)

**Purpose**: Complete user interface for the kiosk system

**Technology Stack**:
- Next.js 15.3.1 (App Router)
- React 18.3.1
- TypeScript 5.6.3
- Tailwind CSS 4.1.11
- HeroUI components
- Three.js (3D cake editor)

**Features**:
- 🍰 Custom 3D cake editor
- 🛒 Shopping cart management
- 📋 Menu browsing
- 💳 Order processing
- 🎨 Dark/Light theme
- 📱 Responsive design

**Deployed to**: Render.com as standalone web app

**Quick Start**:
```bash
cd Kiosk_Web
npm install
npm run dev  # Visit http://localhost:3002
```

**Documentation**:
- `Kiosk_Web/README.md` - Complete guide
- `Kiosk_Web/DEPLOYMENT.md` - Render.com deployment
- `Kiosk_Web/DESIGN_GUIDE.md` - Design system

---

### 2. Kiosk_Electron (Electron Client)

**Purpose**: Hardware wrapper that loads the web application

**Technology Stack**:
- Electron 34.0.0
- Node.js (for hardware access)
- ESC/POS printer libraries

**Features**:
- 🖥️ Kiosk mode (fullscreen, prevents exit)
- 🖨️ Thermal printer integration
- ⚙️ Settings panel (Ctrl+Shift+C)
- 🔗 Configurable remote URL
- 💾 Persistent configuration
- 🔌 Hardware access (USB, Serial)

**Runs on**: Raspberry Pi, Windows PC, Linux, macOS

**Quick Start**:
```bash
cd Kiosk_Electron
npm install
npm run dev  # Opens settings panel to configure URL
```

**Documentation**:
- `Kiosk_Electron/README.md` - Complete guide
- `Kiosk_Electron/PRINTER_SETUP.md` - Printer configuration

---

## 🚀 Development Workflow

### Scenario 1: Develop Web UI Only

```bash
# Only work in Kiosk_Web
cd Kiosk_Web
npm run dev

# Test in browser at http://localhost:3002
# No need to run Electron
```

**Use case**: UI changes, new features, styling

---

### Scenario 2: Develop Electron Features

```bash
# Terminal 1: Run Next.js (in Kiosk_Web)
cd Kiosk_Web
npm run dev

# Terminal 2: Run Electron (in Kiosk_Electron)
cd Kiosk_Electron
npm run dev

# Electron loads from http://localhost:3002
# (configured via Ctrl+Shift+C settings panel)
```

**Use case**: Printer integration, kiosk mode, settings

---

### Scenario 3: Test Full Production Setup

```bash
# Terminal 1: Build and start Next.js (in Kiosk_Web)
cd Kiosk_Web
npm run build
npm run start  # Runs on http://localhost:3002

# Terminal 2: Run Electron (in Kiosk_Electron)
cd Kiosk_Electron
npm run dev

# Configure Electron to load http://localhost:3002
# Or point to Render URL for testing remote deployment
```

**Use case**: Integration testing, production simulation

---

## 📦 Deployment

### Deploy Web Application

**Target**: Render.com (or any Node.js hosting)

```bash
cd Kiosk_Web

# Option 1: Deploy to Render.com
# See Kiosk_Web/DEPLOYMENT.md for complete guide
# Result: https://goldenmunch-kiosk-web.onrender.com

# Option 2: Deploy to your own server
npm run build
npm run start  # Production server on port 3002
```

**See**: `Kiosk_Web/DEPLOYMENT.md`

---

### Deploy Electron Client

**Target**: Kiosk devices (Raspberry Pi, Windows PC, etc.)

```bash
cd Kiosk_Electron

# Build for target platform
npm run build:linux   # Linux/Raspberry Pi
npm run build:win     # Windows
npm run build:mac     # macOS
npm run build:rpi     # Raspberry Pi ARM

# Output: dist/goldenmunch-kiosk-electron-*.{deb,exe,dmg}
```

**Installation**:
```bash
# Linux/Raspberry Pi
sudo dpkg -i dist/goldenmunch-kiosk-electron_1.0.0_amd64.deb

# Windows
# Run the .exe installer

# macOS
# Open the .dmg and drag to Applications
```

**Configuration**:
1. Launch the app
2. Press `Ctrl+Shift+C` to open settings
3. Enter Render URL: `https://goldenmunch-kiosk-web.onrender.com`
4. Click "Save & Reload"

**See**: `Kiosk_Electron/README.md`

---

## 🔄 Update Workflow

### Update Web UI (No Electron Rebuild Needed!)

```bash
# 1. Make changes to Kiosk_Web
cd Kiosk_Web
vim app/page.tsx

# 2. Test locally
npm run dev

# 3. Commit and push
git add .
git commit -m "Update homepage"
git push origin main

# 4. Render auto-deploys (5-10 minutes)
# 5. Kiosk devices automatically load new UI!
```

**Timeline**: 5-10 minutes from push to live

**No need to**:
- Rebuild Electron
- Update kiosk devices
- Redistribute installers

---

### Update Electron Client (UI Unaffected!)

```bash
# 1. Make changes to Kiosk_Electron
cd Kiosk_Electron
vim electron/main.js

# 2. Test locally
npm run dev

# 3. Build for distribution
npm run build:linux  # or appropriate platform

# 4. Distribute new installer
# 5. Install on kiosk devices
```

**Timeline**: Build time + distribution time

**UI continues to work** during Electron update

---

## 📊 Dependencies Summary

### Kiosk_Web Dependencies

**Runtime** (~200MB node_modules):
- Next.js, React, React DOM
- 40+ HeroUI UI components
- Three.js, React Three Fiber
- Axios, Framer Motion
- Tailwind CSS

**DevDependencies**:
- TypeScript, ESLint, Prettier
- Type definitions

**Total**: ~200MB

---

### Kiosk_Electron Dependencies

**Runtime** (~50MB node_modules):
- Electron
- ESC/POS printer libraries
- SerialPort, USB

**DevDependencies**:
- Electron Builder
- Electron DevTools Installer

**Total**: ~50MB

---

## 🎯 Benefits of Separation

### ✅ Smaller Bundles
- Electron: 50MB (vs 500MB previously)
- Web: Hosted remotely, not bundled

### ✅ Independent Deployments
- Update UI without rebuilding Electron
- Update Electron without touching UI
- Deploy UI instantly via Render

### ✅ Easier Development
- Test UI in browser (faster iteration)
- Test Electron separately
- Clear separation of concerns

### ✅ Better Scalability
- Web app scales with Render infrastructure
- Electron stays lightweight
- Multiple kiosks load same web app

### ✅ Simpler Testing
- Unit test UI components independently
- Integration test with mock Electron API
- E2E test full stack

---

## 🔐 Security

### Electron Security
✅ Context isolation enabled
✅ Node integration disabled in renderer
✅ Preload script for safe IPC
✅ No remote module
✅ Sandboxed renderer

### Web Application Security
✅ HTTPS via Render (free SSL)
✅ Environment variables (not in git)
✅ XSS protection (React auto-escapes)
✅ CORS configured on backend
✅ Input validation

---

## 🛠️ Troubleshooting

### Common Issues

**Issue**: Web app can't connect to API

**Solution**:
1. Check `NEXT_PUBLIC_API_URL` in Kiosk_Web/.env.local
2. Verify backend API is running
3. Check CORS settings on backend

---

**Issue**: Electron can't load web app

**Solution**:
1. Press `Ctrl+Shift+C` to open settings
2. Verify URL is correct
3. Check internet connection
4. Check Render deployment status

---

**Issue**: Printer not working

**Solution**:
1. Check `Kiosk_Electron/electron/printer-config.json`
2. Verify printer is connected (USB/Network)
3. See `Kiosk_Electron/PRINTER_SETUP.md`

---

## 📖 Documentation Index

### Kiosk_Web Documentation
- **README.md** - Quick start and features
- **DEPLOYMENT.md** - Deploy to Render.com
- **DESIGN_GUIDE.md** - Design system and guidelines
- **QUICK_FIX.md** - Common issues and solutions

### Kiosk_Electron Documentation
- **README.md** - Quick start and configuration
- **PRINTER_SETUP.md** - Printer setup guide

### Other
- **client/README.md** - This file (overview)

---

## 🆘 Support

**For Web Application Issues**:
- Check: `Kiosk_Web/README.md`
- Logs: Render Dashboard → Logs
- Test: http://localhost:3002

**For Electron Client Issues**:
- Check: `Kiosk_Electron/README.md`
- Logs: Terminal output
- Settings: Press `Ctrl+Shift+C`

**For API Issues**:
- Check backend logs on Render
- Verify API URL configuration
- Test API endpoint directly with curl

---

## 🎯 Quick Reference

### Start Development
```bash
# Web UI only
cd Kiosk_Web && npm run dev

# Full stack (Web + Electron)
cd Kiosk_Web && npm run dev &
cd Kiosk_Electron && npm run dev
```

### Build for Production
```bash
# Web (deploy to Render)
cd Kiosk_Web && npm run build

# Electron (distribute to kiosks)
cd Kiosk_Electron && npm run build:linux
```

### Deploy
```bash
# Web: Push to git (Render auto-deploys)
git push origin main

# Electron: Install on kiosk devices
sudo dpkg -i dist/*.deb
```

---

**🎉 The projects are now completely separated and independent!**
