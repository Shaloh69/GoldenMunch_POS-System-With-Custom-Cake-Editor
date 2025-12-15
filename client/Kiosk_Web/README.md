# 🌐 GoldenMunch Kiosk - Web Application

**Next.js web application for the GoldenMunch POS Kiosk system.**

This is the **web UI** that provides the complete kiosk experience: menu browsing, custom cake editor, cart management, and order placement. It can be deployed as a standalone web app on Render.com and loaded by the Electron client.

---

## 📦 What This Project Contains

This project contains the **complete Next.js web application**:

- **🍰 Custom Cake Editor**: 3D cake designer with Three.js
- **📱 Responsive UI**: Optimized for 21-inch portrait touch displays
- **🛒 Shopping Cart**: Full cart management with localStorage
- **🎨 Theme System**: Dark/Light mode support
- **📋 Menu Management**: Dynamic menu with categories and promotions
- **💳 Order Processing**: Checkout and order submission
- **🔄 QR Code Integration**: Mobile custom cake editor sync

**This project does NOT contain:**

- ❌ Electron code (see `../Kiosk_Electron/`)
- ❌ Printer integration (see `../Kiosk_Electron/`)
- ❌ Kiosk mode features (see `../Kiosk_Electron/`)

---

## 🏗️ Architecture

```
┌─────────────────────────────────────┐
│  NEXT.JS WEB APP (This Project)    │
│  ├─ Full UI (Menu, Cake Editor)    │
│  ├─ Cart & Order Management         │
│  ├─ API Integration                 │
│  └─ Deployed on Render.com          │
└────────────┬────────────────────────┘
             │
             │ API Calls (Axios)
             ▼
┌─────────────────────────────────────┐
│  BACKEND API (Render.com)           │
│  https://goldenmunch-pos-system... │
└─────────────────────────────────────┘
```

**Loaded by:**

- Electron client (`Kiosk_Electron`)
- Or regular web browser (testing)

---

## 📂 Project Structure

```
Kiosk_Web/
├── app/                      # Next.js App Router
│   ├── page.tsx             # Home - Menu display
│   ├── layout.tsx           # Root layout
│   ├── providers.tsx        # Context providers
│   ├── cart/                # Shopping cart page
│   ├── categories/          # Category browsing
│   ├── custom-cake/         # Custom cake editor
│   ├── cake-editor/         # 3D cake design
│   └── menu/                # Menu page
│
├── components/              # React components
│   ├── cake-editor/        # 3D cake editor (Three.js)
│   ├── MenuCard.tsx        # Menu item cards
│   ├── CartFooter.tsx      # Cart display
│   └── theme-switch.tsx    # Dark/Light toggle
│
├── config/                  # Configuration
│   ├── api.ts              # Axios instance
│   ├── fonts.ts            # Font config
│   └── site.ts             # Site metadata
│
├── contexts/               # React Context
│   └── CartContext.tsx     # Cart state management
│
├── services/               # API services
│   ├── menu.service.ts     # Menu, categories
│   ├── order.service.ts    # Order processing
│   └── customCake.service.ts # Custom cake
│
├── types/                  # TypeScript types
│   └── api.ts             # API type definitions
│
├── utils/                  # Utilities
│   └── imageUtils.ts      # Image processing
│
├── public/                 # Static assets
│   └── fonts/             # Custom fonts
│
├── styles/                 # Global CSS
│   └── globals.css
│
├── next.config.mjs         # Next.js configuration
├── tailwind.config.js      # Tailwind CSS theme
├── tsconfig.json           # TypeScript config
├── package.json            # Next.js dependencies
│
├── .env.local              # Development environment
├── .env.production         # Production environment
│
├── README.md               # This file
├── DEPLOYMENT.md           # Deployment guide
└── DESIGN_GUIDE.md         # Design system guide
```

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

**Note**: This only installs Next.js and UI dependencies. No Electron dependencies!

### 2. Configure Environment

Create `.env.local` for development:

```bash
NEXT_PUBLIC_API_URL=https://goldenmunch-pos-system-server.onrender.com/api
NEXT_PUBLIC_API_TIMEOUT=30000
```

**(File already exists, just verify the API URL)**

### 3. Development Mode

```bash
npm run dev
```

**Visit**: http://localhost:3002

**Test in browser:**

- Chrome DevTools
- Responsive mode: 1080x1920 (portrait orientation)
- Touch simulation

### 4. Production Build

```bash
# Build for production
npm run build

# Start production server
npm start
```

**Visit**: http://localhost:3002

---

## 🌐 Deployment to Render.com

### Step 1: Create Web Service

1. **Go to Render Dashboard**: https://render.com/dashboard
2. **Click "New +"** → **"Web Service"**
3. **Connect repository**: `Shaloh69/GoldenMunch_POS-System-With-Custom-Cake-Editor`

### Step 2: Configure Build Settings

```yaml
Name: goldenmunch-kiosk-web
Environment: Node
Region: Choose closest to your location
Branch: main (or your deployment branch)
Root Directory: client/Kiosk_Web
Build Command: npm install && npm run build
Start Command: npm run start
```

### Step 3: Environment Variables

Add in Render dashboard:

```bash
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://goldenmunch-pos-system-server.onrender.com/api
NEXT_PUBLIC_API_TIMEOUT=60000
PORT=3002
```

### Step 4: Advanced Settings

```yaml
Auto-Deploy: Yes (deploys on git push)
Health Check Path: / (optional)
Instance Type: Starter (recommended for better performance)
```

### Step 5: Deploy

- Click **"Create Web Service"**
- Wait for deployment (~5-10 minutes)
- **Note your URL**: `https://goldenmunch-kiosk-web.onrender.com`

### Step 6: Configure Electron Client

After deployment, configure the Electron client to load your Render URL:

```bash
cd ../Kiosk_Electron
npm run dev

# Press Ctrl+Shift+C
# Enter: https://goldenmunch-kiosk-web.onrender.com
# Save & Reload
```

**See `DEPLOYMENT.md` for complete deployment guide.**

---

## 🎨 Features

### 1. Custom Cake Editor (3D)

**3D cake designer built with:**

- Three.js (3D rendering)
- React Three Fiber (React integration)
- React Three Drei (helpers)

**Features:**

- Real-time 3D preview
- Multiple cake layers
- Flavors, sizes, shapes
- Text decorations
- Color customization
- Price calculation

**Files:**

- `app/cake-editor/` - 3D editor page
- `components/cake-editor/` - 3D components

### 2. Shopping Cart

**Cart management with:**

- Add/remove items
- Quantity updates
- Price calculation
- Custom cake designs
- LocalStorage persistence
- Cross-tab synchronization

**Files:**

- `contexts/CartContext.tsx` - Cart state
- `components/CartFooter.tsx` - Cart display
- `app/cart/` - Checkout page

### 3. Menu System

**Dynamic menu with:**

- Categories filtering
- Search functionality
- Item details sidebar
- Promotions display
- Capacity checking
- Image optimization

**Files:**

- `app/page.tsx` - Home/Menu page
- `components/MenuCard.tsx` - Item cards
- `services/menu.service.ts` - API calls

### 4. Theme System

**Dark/Light mode with:**

- HeroUI theme provider
- Next-themes integration
- Sunny Yellow primary color
- Charcoal Gray text
- Smooth transitions

**Files:**

- `app/providers.tsx` - Theme setup
- `components/theme-switch.tsx` - Toggle
- `tailwind.config.js` - Theme colors

### 5. Order Processing

**Complete checkout flow:**

- Order summary
- Customer details (optional)
- Payment integration (future)
- Order code generation
- Receipt printing (via Electron)

**Files:**

- `app/cart/page.tsx` - Checkout
- `services/order.service.ts` - API

---

## 🔧 Development

### Run Development Server

```bash
npm run dev
```

**Features:**

- Hot module reload
- Fast refresh
- Error overlay
- Source maps

### Lint Code

```bash
npm run lint
```

**Linters:**

- ESLint (Next.js config)
- TypeScript compiler
- Prettier (code formatting)

### Build for Production

```bash
npm run build
```

**Output:**

- `.next/` directory
- Standalone Next.js build
- Optimized bundles
- Server components

### Test Production Build Locally

```bash
npm run build
npm run start
```

Visit http://localhost:3002

---

## 🧪 Testing

### Test in Browser

```bash
npm run dev
# Open http://localhost:3002 in Chrome
```

**Recommended:**

- Use DevTools responsive mode
- Set viewport: 1080x1920 (portrait)
- Enable touch simulation
- Test both light/dark themes

### Test with Electron

```bash
# Terminal 1: Start Next.js
npm run dev

# Terminal 2: Start Electron (in Kiosk_Electron)
cd ../Kiosk_Electron
npm run dev

# In Electron settings: Enter http://localhost:3002
```

### Test on Real Device

```bash
# Get your local IP
ipconfig getifaddr en0  # macOS
hostname -I             # Linux

# Start dev server on all interfaces
npm run dev

# Access from device: http://<your-ip>:3002
```

---

## 🎯 API Integration

### API Client Configuration

**File**: `config/api.ts`

```typescript
// Axios instance with interceptors
const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: Number(process.env.NEXT_PUBLIC_API_TIMEOUT),
  headers: {
    "Cache-Control": "no-cache",
    Pragma: "no-cache",
  },
});
```

### Available Services

**Menu Service** (`services/menu.service.ts`):

```typescript
getMenuItems(filters);
getCategories();
getActivePromotions();
checkCapacity();
```

**Order Service** (`services/order.service.ts`):

```typescript
createOrder(orderData);
getOrderByCode(code);
```

**Custom Cake Service** (`services/customCake.service.ts`):

```typescript
generateQRSession();
pollSessionStatus();
getDesignOptions();
submitForReview();
```

### Environment Variables

Development (`.env.local`):

```bash
NEXT_PUBLIC_API_URL=https://goldenmunch-pos-system-server.onrender.com/api
NEXT_PUBLIC_API_TIMEOUT=30000
```

Production (`.env.production` + Render):

```bash
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://goldenmunch-pos-system-server.onrender.com/api
NEXT_PUBLIC_API_TIMEOUT=60000
```

---

## 🎨 Styling & Theme

### Tailwind CSS

**Custom theme** (`tailwind.config.js`):

- Primary: Sunny Yellow (#FFD700)
- Text: Charcoal Gray (#333333)
- Font: Inter (system font stack)

### HeroUI Components

**40+ UI components:**

- Button, Card, Input, Modal
- Drawer, Dropdown, Table
- Tabs, Toast, Tooltip
- And more...

**Usage:**

```tsx
import { Button, Card } from "@heroui/react";

<Button color="primary">Add to Cart</Button>;
```

### Dark Mode

**Toggle theme:**

```tsx
import { ThemeSwitch } from "@/components/theme-switch";

<ThemeSwitch />;
```

**Detect theme:**

```tsx
import { useTheme } from "next-themes";

const { theme, setTheme } = useTheme();
```

---

## 📱 Responsive Design

**Optimized for:**

- Portrait 21-inch touch display (1080x1920)
- Tablet landscape
- Mobile portrait
- Desktop browser (testing)

**Breakpoints** (Tailwind):

```css
sm: 640px   // Small devices
md: 768px   // Medium devices
lg: 1024px  // Large devices
xl: 1280px  // Extra large
2xl: 1536px // 2X extra large
```

**Portrait-specific optimizations:**

```tsx
<div className="h-screen portrait:grid-cols-1 landscape:grid-cols-2">
  {/* Layout adapts to orientation */}
</div>
```

---

## 🔐 Security

### Environment Variables

✅ **Never commit** `.env.local` or `.env.production`
✅ **Use** `NEXT_PUBLIC_` prefix for client-side vars
✅ **Add to** `.gitignore`

### API Security

✅ **HTTPS only** (Render provides SSL)
✅ **CORS** configured on backend
✅ **Rate limiting** (backend responsibility)
✅ **Input validation** (backend + client)

### XSS Protection

✅ **React auto-escapes** output
✅ **No** `dangerouslySetInnerHTML` usage
✅ **Sanitize** user input before display

---

## 🚧 Troubleshooting

### Issue: Port 3002 Already in Use

```bash
# Kill process on port 3002
lsof -ti:3002 | xargs kill -9  # macOS/Linux
netstat -ano | findstr :3002   # Windows
```

### Issue: API Calls Failing

**Check:**

1. API URL in `.env.local` is correct
2. Backend is running
3. CORS is configured on backend
4. Network connection

**Debug:**

```bash
# Check API endpoint
curl https://goldenmunch-pos-system-server.onrender.com/api/menu
```

### Issue: 3D Cake Editor Not Loading

**Check:**

1. Browser supports WebGL
2. Three.js is installed
3. Check browser console for errors

**Test WebGL:**
Visit https://get.webgl.org/

### Issue: Build Fails

**Common causes:**

1. TypeScript errors: `npm run lint`
2. Missing dependencies: `npm install`
3. Node version: Check `engines` in package.json

**Clean build:**

```bash
npm run clean
npm install
npm run build
```

---

## 📦 Dependencies

### Runtime Dependencies

**Next.js & React:**

- `next@15.3.1` - Next.js framework
- `react@18.3.1` - React library
- `react-dom@18.3.1` - React DOM

**UI Components:**

- `@heroui/*` - 40+ UI components
- `lucide-react` - Icons
- `framer-motion` - Animations

**3D Rendering:**

- `three@0.169.0` - Three.js
- `@react-three/fiber` - React integration
- `@react-three/drei` - Helpers

**Utilities:**

- `axios` - HTTP client
- `next-themes` - Theme management
- `qrcode.react` - QR code generation

**Styling:**

- `tailwindcss@4.1.11` - Utility-first CSS
- `postcss` - CSS processing

### Development Dependencies

- `typescript@5.6.3` - TypeScript
- `eslint` - Linting
- `prettier` - Code formatting
- `@types/*` - Type definitions

**Total size**: ~200MB (node_modules)

---

## 🔗 Related Projects

- **Kiosk_Electron** (`../Kiosk_Electron/`) - Electron client wrapper
- **Backend API** - Separate API server on Render.com

---

## 📖 Additional Documentation

- `DEPLOYMENT.md` - Complete deployment guide
- `DESIGN_GUIDE.md` - Design system and guidelines
- `QUICK_FIX.md` - Common issues and fixes
- `../Kiosk_Electron/README.md` - Electron client documentation

---

## 🆘 Support

For issues:

1. Check browser console for errors
2. Check Network tab for failed API calls
3. Verify environment variables are set
4. Check Render logs (if deployed)

---

**🎉 This is the web application only. For the Electron client, see `Kiosk_Electron`!**
