# 🏗️ Kiosk Architecture - Separated Design

## Overview

The GoldenMunch Kiosk has been refactored from a **monolithic Electron+Next.js bundle** to a **separated client-server architecture**.

---

## Before vs After

### ❌ Before (Tightly Coupled)

```
┌──────────────────────────────────────┐
│  ELECTRON APP (Kiosk Device)         │
│  ├─ Bundles entire Next.js app       │
│  ├─ Static export (out/ folder)      │
│  ├─ 500MB+ bundle size                │
│  ├─ Requires rebuilding for UI       │
│  │  changes                           │
│  └─ Loads from: file://out/index.html│
└──────────────────────────────────────┘
```

**Problems:**
- ❌ Large bundle size (500MB+ with Next.js)
- ❌ UI updates require rebuilding & redistributing Electron
- ❌ Static export limitations (no SSR, API routes)
- ❌ Difficult to test separately
- ❌ Tight coupling between UI and client

---

### ✅ After (Separated & Decoupled)

```
┌─────────────────────────────────────────┐
│  ELECTRON CLIENT (~50MB)                │
│  ├─ Lightweight wrapper                 │
│  ├─ Printer integration                 │
│  ├─ Kiosk mode                          │
│  ├─ Settings panel (Ctrl+Shift+C)      │
│  └─ Loads remote URL                    │
└────────────┬────────────────────────────┘
             │
             │ HTTPS Request
             ▼
┌─────────────────────────────────────────┐
│  NEXT.JS WEB APP (Render.com)           │
│  ├─ Full SSR/Dynamic rendering          │
│  ├─ Independent deployment              │
│  ├─ Hot updates (no Electron rebuild)   │
│  ├─ Standard Next.js features           │
│  └─ URL: goldenmunch-kiosk.onrender.com │
└────────────┬────────────────────────────┘
             │
             │ API Calls
             ▼
┌─────────────────────────────────────────┐
│  BACKEND API (Render.com)               │
│  └─ goldenmunch-pos-system-server...    │
└─────────────────────────────────────────┘
```

**Benefits:**
- ✅ **Smaller Electron bundle** (~50MB vs 500MB)
- ✅ **Independent deployments** (UI changes don't affect Electron)
- ✅ **Hot updates** (Render deploys, kiosk reloads)
- ✅ **Full Next.js features** (SSR, API routes, dynamic imports)
- ✅ **Easier testing** (test UI in browser, Electron separately)
- ✅ **Configurable** (change URL without rebuilding)

---

## Component Responsibilities

### 1. Electron Client (Kiosk Device)

**Purpose:** Hardware interface & kiosk shell

**Responsibilities:**
- Load remote Next.js app via URL
- Thermal printer integration (USB/Network/Serial)
- Kiosk mode (fullscreen, prevent exit)
- Settings management (URL configuration)
- Power management (prevent sleep)
- Hardware-specific features

**Does NOT:**
- Render UI (delegated to Next.js)
- Handle business logic (delegated to backend)
- Store application state (delegated to Next.js/Backend)

**Technologies:**
- Electron 34.0.0
- IPC for printer communication
- Global keyboard shortcuts
- Local settings storage

**Key Files:**
- `electron/main.js` - Main process, window management
- `electron/settings-manager.js` - URL configuration
- `electron/printer.js` - Thermal printer service
- `electron/preload.js` - IPC bridge for printer
- `electron/settings-preload.js` - IPC bridge for settings

---

### 2. Next.js Web App (Render.com)

**Purpose:** User interface & frontend logic

**Responsibilities:**
- Render all UI components (Menu, Cart, Cake Editor)
- Client-side state management (Cart Context)
- API communication with backend
- 3D rendering (Three.js, React Three Fiber)
- Responsive design (portrait 21-inch optimized)
- Theme management (dark/light mode)

**Does NOT:**
- Access local hardware (delegated to Electron)
- Run on kiosk device (runs on Render)
- Handle printer communication (delegated to Electron)

**Technologies:**
- Next.js 15.3.1 (App Router)
- React 18.3.1
- HeroUI components
- Tailwind CSS 4.1.11
- Three.js for 3D cake editor
- Framer Motion for animations

**Key Features:**
- SSR/Dynamic rendering (no static export)
- API calls to backend
- WebSocket support (future: real-time updates)
- Progressive Web App (future enhancement)

**Deployment:**
- Platform: Render.com
- Build: `npm run build`
- Start: `npm run start`
- Auto-deploy on git push

---

### 3. Backend API (Render.com)

**Purpose:** Business logic & data management

**Responsibilities:**
- Menu management (items, categories, promotions)
- Order processing
- Custom cake sessions (QR code, mobile editor sync)
- Database operations
- Authentication (future)
- Payment processing (future)

**Does NOT:**
- Render UI (delegated to Next.js)
- Print receipts (delegated to Electron)

**API Endpoint:**
```
https://goldenmunch-pos-system-server.onrender.com/api
```

**Used By:**
- Next.js app (API calls via Axios)
- Mobile app (future: custom cake editor)

---

## Data Flow Examples

### Example 1: User Adds Item to Cart

```
1. User clicks "Add to Cart" button
   └─ Next.js (client/Kiosk/app/page.tsx)

2. Cart Context updates state
   └─ Next.js (contexts/CartContext.tsx)

3. State persisted to localStorage
   └─ Next.js (browser storage)

4. UI updates automatically
   └─ Next.js (React re-render)
```

**No Electron or Backend involved** - Pure client-side

---

### Example 2: User Submits Order

```
1. User clicks "Place Order" button
   └─ Next.js (app/cart/page.tsx)

2. API call to create order
   └─ Next.js (services/order.service.ts)
   └─ POST /kiosk/orders

3. Backend processes order
   └─ Backend API (creates DB record)

4. Backend returns order code
   └─ Backend API (response: { code: "A001" })

5. Next.js displays order confirmation
   └─ Next.js (app/cart/page.tsx)

6. Trigger printer (via window.electron.printer)
   └─ Electron IPC (main.js ← preload.js)

7. Electron prints receipt
   └─ Electron (printer.js → thermal printer)
```

**Involves:** Next.js → Backend → Electron

---

### Example 3: Admin Changes URL

```
1. Admin presses Ctrl+Shift+C
   └─ Electron (globalShortcut listener in main.js)

2. Settings window opens
   └─ Electron (settings.html loaded)

3. Admin enters new URL
   └─ Electron (settings.html form)

4. Settings saved via IPC
   └─ Electron (settings-preload.js → main.js)

5. Settings written to disk
   └─ Electron (settings-manager.js)
   └─ File: ~/.config/goldenmunch-kiosk/kiosk-config.json

6. Main window reloads new URL
   └─ Electron (mainWindow.loadURL(newUrl))

7. Next.js app loads from new location
   └─ Next.js (served from new Render URL)
```

**Only Electron involved** - No Next.js or Backend

---

## Communication Protocols

### 1. Electron ↔ Next.js

**Protocol:** HTTPS (web request)

**Flow:**
```
Electron BrowserWindow.loadURL(url)
    ↓
HTTPS GET https://goldenmunch-kiosk.onrender.com
    ↓
Next.js server responds with HTML
    ↓
Electron renders in webview
```

**No direct IPC** - Electron treats Next.js as a web page

---

### 2. Next.js ↔ Electron (Printer Only)

**Protocol:** IPC (Inter-Process Communication)

**Flow:**
```javascript
// Next.js calls
window.electron.printer.printReceipt(orderData)
    ↓
// Preload script exposes IPC
ipcRenderer.invoke('print-receipt', orderData)
    ↓
// Main process handles
ipcMain.handle('print-receipt', async (event, orderData) => {
  await printerService.printReceipt(orderData);
})
    ↓
// Printer service prints
ThermalPrinter → USB/Network/Serial → Thermal Printer
```

**Exposed APIs:**
- `window.electron.printer.printReceipt(orderData)`
- `window.electron.printer.printTest()`
- `window.electron.printer.printDailyReport(reportData)`
- `window.electron.printer.getStatus()`

---

### 3. Next.js ↔ Backend API

**Protocol:** HTTPS (REST API)

**Flow:**
```javascript
// Next.js calls
import { orderService } from '@/services/order.service';
const order = await orderService.createOrder(orderData);
    ↓
// Service makes API call
axios.post('/kiosk/orders', orderData)
    ↓
// Backend processes
Backend API (Express/NestJS) → Database → Response
    ↓
// Next.js receives response
{ success: true, code: "A001", order: {...} }
```

**API Client:** Axios (config/api.ts)

---

## Configuration Management

### Electron Settings

**Location:**
- Linux: `~/.config/goldenmunch-kiosk/kiosk-config.json`
- Windows: `%APPDATA%/goldenmunch-kiosk/kiosk-config.json`
- macOS: `~/Library/Application Support/goldenmunch-kiosk/kiosk-config.json`

**Structure:**
```json
{
  "appUrl": "https://goldenmunch-kiosk.onrender.com",
  "lastUpdated": "2025-01-15T10:30:00.000Z"
}
```

**Access:**
- UI: Press `Ctrl+Shift+C` → Settings Panel
- Code: `settingsManager.getSettings()`
- Manual: Edit JSON file directly

---

### Next.js Environment Variables

**Development** (.env.local):
```bash
NEXT_PUBLIC_API_URL=https://goldenmunch-pos-system-server.onrender.com/api
NEXT_PUBLIC_API_TIMEOUT=30000
```

**Production** (.env.production):
```bash
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://goldenmunch-pos-system-server.onrender.com/api
NEXT_PUBLIC_API_TIMEOUT=60000
```

**Render Configuration:**
- Set in Render dashboard under "Environment"
- Automatically loaded on build/start

---

### Printer Configuration

**File:** `electron/printer-config.json`

**Structure:**
```json
{
  "printerType": "usb",
  "usb": { "vid": "0x0416", "pid": "0x5011" },
  "network": { "address": "192.168.1.100", "port": 9100 },
  "serial": { "path": "/dev/ttyUSB0", "baudRate": 9600 },
  "settings": { "width": 48, "encoding": "GB18030" }
}
```

**Access:**
- Code: `ThermalPrinterService` constructor
- Manual: Edit JSON file, restart Electron

---

## Deployment Scenarios

### Scenario 1: Update UI Only

**No Electron rebuild needed!**

```bash
# 1. Make changes to Next.js UI
vim app/page.tsx

# 2. Commit and push
git add .
git commit -m "Update homepage layout"
git push origin main

# 3. Render auto-deploys (5 minutes)
# 4. Kiosk automatically loads new UI (on refresh or Ctrl+Shift+C → Reload)
```

**Timeline:** 5-10 minutes from push to live

---

### Scenario 2: Update Electron (Printer, Kiosk Features)

**UI stays unchanged!**

```bash
# 1. Make changes to Electron
vim electron/main.js

# 2. Build for target platform
npm run electron:build:linux

# 3. Distribute new binary
scp dist/*.deb pi@kiosk:/tmp/
ssh pi@kiosk "sudo dpkg -i /tmp/goldenmunch-kiosk_1.0.0_amd64.deb"

# 4. Restart Electron app
```

**Timeline:** 10 minutes build + distribution time

---

### Scenario 3: Update Backend API

**Both Next.js and Electron unaffected!**

```bash
# Backend is separate repository/deployment
# Just deploy backend changes to Render
# Kiosk continues working with new API
```

---

## Testing Strategy

### Test Next.js Independently

```bash
# Browser testing (no Electron needed)
npm run dev
open http://localhost:3002
```

**Test in:**
- Chrome DevTools
- Responsive mode (portrait 1080x1920)
- Network throttling (slow 3G)

---

### Test Electron Independently

```bash
# Point to production Next.js
npm run electron:dev:remote
# Configure settings: https://goldenmunch-kiosk.onrender.com

# Or use local Next.js
npm run electron:dev
```

**Test:**
- Settings panel (Ctrl+Shift+C)
- Printer IPC (if printer connected)
- Kiosk mode (production build)
- Keyboard shortcuts

---

### Integration Testing

```bash
# Terminal 1: Local Next.js
npm run dev

# Terminal 2: Electron → localhost
npm run electron:dev

# Test full flow: Add to cart → Order → Print
```

---

## Monitoring & Debugging

### Next.js Logs (Render)

- **Location:** Render Dashboard → goldenmunch-kiosk → Logs
- **View:** Real-time server logs, build logs, errors
- **Useful for:** API errors, rendering issues, deployment failures

### Electron Logs

- **Location:** Terminal output (if run from terminal)
- **Or:** Platform-specific log files
  - Linux: `~/.config/goldenmunch-kiosk/logs/`
  - Windows: `%APPDATA%/goldenmunch-kiosk/logs/`
- **Useful for:** IPC errors, printer issues, URL loading failures

### Backend API Logs

- **Location:** Render Dashboard → backend service → Logs
- **Useful for:** Order processing, API errors, database issues

---

## Security Architecture

### Electron Security

✅ **Implemented:**
- Context Isolation: ✅ (prevents renderer access to Node.js)
- Node Integration: ❌ Disabled (renderer cannot use require)
- Remote Module: ❌ Disabled (no remote access)
- Preload Script: ✅ (safe IPC bridge)
- Sandboxing: ✅ (renderer in sandbox)

**Attack Surface:**
- ⚠️ Printer IPC (validated input)
- ⚠️ Settings IPC (validated URLs)
- ✅ No eval() or unsafe code execution

### Next.js Security

✅ **Implemented:**
- HTTPS: ✅ (Render provides SSL)
- Environment Variables: ✅ (not in client bundle)
- XSS Protection: ✅ (React auto-escapes)
- CSRF: ⚠️ (consider adding for mutations)

**Recommendations:**
- Add Content Security Policy (CSP)
- Implement rate limiting on API
- Add request signing for Electron ↔ Next.js

---

## Future Enhancements

### 1. Auto-Update Support (Electron)

```javascript
// electron/auto-updater.js
const { autoUpdater } = require('electron-updater');

autoUpdater.checkForUpdatesAndNotify();
```

**Benefit:** Automatic Electron updates without manual distribution

---

### 2. Offline Mode (Next.js)

```javascript
// next.config.mjs
const withPWA = require('next-pwa');

module.exports = withPWA({
  pwa: {
    dest: 'public',
    disable: process.env.NODE_ENV === 'development'
  }
});
```

**Benefit:** Kiosk works offline, syncs when reconnected

---

### 3. Analytics & Monitoring

```javascript
// app/layout.tsx
import { Analytics } from '@vercel/analytics';

export default function RootLayout({ children }) {
  return (
    <>
      {children}
      <Analytics />
    </>
  );
}
```

**Benefit:** Track user behavior, errors, performance

---

## Summary

| Component | Technology | Hosted On | Responsibility |
|-----------|-----------|-----------|----------------|
| **Electron Client** | Electron 34 | Kiosk Device | Hardware, Kiosk Mode, Printer |
| **Next.js UI** | Next.js 15 + React 18 | Render.com | UI, Frontend Logic, Cart |
| **Backend API** | Express/NestJS | Render.com | Business Logic, Database |

**Key Principle:** **Separation of Concerns**

- Each component has **one responsibility**
- Components communicate via **standard protocols** (HTTPS, IPC)
- Changes to one component **don't require rebuilding others**

---

**📖 For deployment instructions, see:** `DEPLOYMENT.md`
