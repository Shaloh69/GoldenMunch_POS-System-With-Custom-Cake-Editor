# GoldenMunch Mobile Cake Editor

A mobile-optimized 3D cake design interface for customers to create custom cakes via QR code from the kiosk.

## 🏗️ Architecture

The Mobile Cake Editor is a **standalone Next.js application** that is:
- Built as **static files** (Next.js export)
- **Served by the Express backend server**
- **Accessible from mobile devices** via QR code

### Why This Architecture?

**Problem Solved:**
- The Kiosk is an Electron desktop application running on `localhost` - NOT accessible from phones
- Mobile devices need to access the cake editor from their browsers
- The QR code needs to point to a **network-accessible URL**

**Solution:**
- Mobile editor is served from the **backend server** (port 3001)
- Backend server IS accessible via network (e.g., `http://192.168.1.100:3001`)
- QR codes point to: `http://SERVER_IP:3001/?session=TOKEN`

## 📦 Installation

```bash
cd client/MobileEditor
npm install
```

## 🔧 Development

### Local Development (Standalone)

Run the mobile editor in dev mode:

```bash
npm run dev
```

This starts a Next.js dev server on `http://localhost:3003`

**Note:** In dev mode, you'll need to manually add `?session=SESSION_TOKEN` to test with a valid session.

### 🐛 Debug Mode (Bypass QR Code)

For development and testing, you can bypass the QR code session validation:

**URL:** `http://localhost:3003/?debug=true`

**Features:**
- ✅ Bypasses session validation (no QR code needed)
- ✅ Skips all API calls for saving/submitting
- ✅ Shows visual debug banner at the top
- ✅ Displays design data in console
- ✅ Works in development mode only (NODE_ENV !== 'production')

**Usage Example:**
```bash
# Start dev server
npm run dev

# Open in browser with debug mode
http://localhost:3003/?debug=true

# Or test on mobile (make sure you're on same network)
http://YOUR_LOCAL_IP:3003/?debug=true
```

**Console Output:**
When debug mode is active, you'll see:
- `🔧 DEBUG MODE: Bypassing session validation`
- `🔧 DEBUG MODE: Skipping draft save`
- `🔧 DEBUG MODE: Simulating submission`

**Visual Indicator:**
A purple banner appears at the top: "🔧 DEBUG MODE ACTIVE - Session validation bypassed | No data will be saved"

**Important Notes:**
- Debug mode ONLY works in development (`NODE_ENV !== 'production`)
- No data is saved to the database in debug mode
- The submit button shows a preview alert instead of actual submission
- Perfect for UI testing, screenshot capture, and design iterations

### Testing with Backend

1. Start the backend server:
   ```bash
   cd ../../server
   npm run dev
   ```

2. Build and export the mobile editor:
   ```bash
   cd ../client/MobileEditor
   npm run build
   ```

3. The backend will automatically serve the static files from `client/MobileEditor/out/`

4. Access via: `http://localhost:3001/?session=YOUR_SESSION_TOKEN`

## 🚀 Production Build

### Build Static Files

```bash
npm run build
```

This creates static HTML/CSS/JS files in the `out/` directory using Next.js static export.

### Deployment

The static files are **automatically served** by the Express backend from `client/MobileEditor/out/`.

**Backend Configuration (server/src/app.ts):**
```typescript
const mobileEditorPath = path.join(__dirname, '../../client/MobileEditor/out');
app.use(express.static(mobileEditorPath));
```

## 🌐 Network Configuration

### For Production/Kiosk Deployment:

1. **Find the server's network IP address:**
   ```bash
   # On Linux/Mac
   ifconfig | grep "inet "

   # On Windows
   ipconfig
   ```

2. **Update backend `.env` file:**
   ```env
   MOBILE_EDITOR_URL=http://192.168.1.100:3001
   BACKEND_URL=http://192.168.1.100:3001
   ```
   Replace `192.168.1.100` with your actual server IP.

3. **Update mobile editor `.env.local`:**
   ```env
   NEXT_PUBLIC_API_URL=http://192.168.1.100:3001/api
   ```

4. **Rebuild the mobile editor:**
   ```bash
   npm run build
   ```

5. **Restart the backend server:**
   ```bash
   cd ../../server
   npm run build
   npm start
   ```

## 📱 How It Works

### Workflow:

1. **Customer at Kiosk:**
   - Selects "Custom Cake"
   - Kiosk calls: `POST /api/kiosk/custom-cake/generate-qr`
   - Backend generates QR code pointing to: `http://SERVER_IP:3001/?session=TOKEN`

2. **Customer Scans QR Code:**
   - Phone opens: `http://SERVER_IP:3001/?session=TOKEN`
   - Backend serves mobile editor static files
   - Mobile editor validates session via: `GET /api/custom-cake/session/:token`

3. **Customer Designs Cake:**
   - 8-step wizard with 3D preview
   - Auto-saves every 3 seconds: `POST /api/custom-cake/save-draft`
   - Final submission: `POST /api/custom-cake/submit`

4. **Admin Reviews:**
   - Admin dashboard shows pending requests
   - Can approve/reject with pricing and scheduling

## 🎨 Features

- **3D Cake Preview** - Real-time Three.js rendering
- **8-Step Design Wizard:**
  1. Customer Info
  2. Layer Count (1-5 layers)
  3. Flavor Selection (per layer)
  4. Size Selection (per layer)
  5. Frosting Type & Color
  6. Decorations & Theme
  7. Custom Text
  8. Review & Submit

- **Auto-Save** - Drafts saved every 3 seconds
- **Session Management** - 30-minute QR session expiry
- **Mobile Optimized** - Touch-friendly, responsive design
- **3D Screenshot Capture** - Multi-angle cake renders

## 📁 Project Structure

```
client/MobileEditor/
├── app/
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Main editor page
│   ├── providers.tsx       # HeroUI provider
│   └── globals.css         # Global styles
├── components/
│   └── cake-editor/
│       ├── CakeCanvas3D.tsx        # 3D canvas
│       ├── CakeModel.tsx           # 3D cake rendering
│       ├── Decorations3D.tsx       # 3D decoration models
│       └── steps/
│           ├── StepCustomerInfo.tsx
│           ├── StepLayers.tsx
│           ├── StepFlavor.tsx
│           ├── StepSize.tsx
│           ├── StepFrosting.tsx
│           ├── StepDecorations.tsx
│           ├── StepText.tsx
│           └── StepReview.tsx
├── services/
│   └── customCake.service.ts   # API client
├── next.config.js          # Next.js config (static export)
├── package.json
└── README.md
```

## 🔗 API Integration

All API calls use `NEXT_PUBLIC_API_URL` environment variable.

**Endpoints Used:**
- `GET /api/custom-cake/session/:token` - Validate session
- `GET /api/custom-cake/options` - Get flavors/sizes/themes
- `POST /api/custom-cake/save-draft` - Auto-save design
- `POST /api/custom-cake/upload-images` - Upload 3D screenshots
- `POST /api/custom-cake/submit` - Submit for review

## 🐛 Troubleshooting

### QR Code Not Accessible from Phone

**Problem:** Phone says "Can't reach this page"

**Solution:**
1. Ensure phone and server are on **same WiFi network**
2. Check firewall isn't blocking port 3001
3. Verify MOBILE_EDITOR_URL uses **network IP**, not localhost
4. Test by visiting `http://SERVER_IP:3001` directly from phone

### Session Expired Error

**Problem:** Always shows "Session Expired"

**Solution:**
1. Check backend logs for session validation errors
2. Ensure `qr_code_sessions` table exists in database
3. Verify session token in URL matches database
4. Check if session hasn't expired (30 min limit)

### 3D Model Not Rendering

**Problem:** White screen or canvas errors

**Solution:**
1. Check browser console for WebGL errors
2. Ensure device supports WebGL (most modern phones do)
3. Try different browser (Chrome recommended)
4. Check if Three.js loaded correctly

### Build Fails

**Problem:** `npm run build` errors

**Solution:**
1. Delete `node_modules` and `.next` folders
2. Run `npm install` again
3. Check for TypeScript errors: `npx tsc --noEmit`
4. Ensure all peer dependencies are installed

## 📊 Browser Support

- **Mobile:** iOS Safari 13+, Chrome for Android 80+
- **Desktop:** Chrome 90+, Firefox 88+, Safari 13+, Edge 90+
- **WebGL Required:** For 3D rendering

## 🔐 Security Notes

- Sessions expire after 30 minutes
- QR tokens are single-use and validated server-side
- No authentication required for public editor (by design)
- All submissions go through admin approval
- CORS configured to allow mobile access

## 📝 License

Proprietary - GoldenMunch POS System
