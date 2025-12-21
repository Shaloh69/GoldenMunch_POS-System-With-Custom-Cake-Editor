# Kiosk_Web Client - Complete Architecture Documentation

## Table of Contents
1. [Overview](#overview)
2. [Technology Stack](#technology-stack)
3. [Dependencies](#dependencies)
4. [Directory Structure](#directory-structure)
5. [Pages and Routes](#pages-and-routes)
6. [Major Components](#major-components)
7. [State Management](#state-management)
8. [API Integration](#api-integration)
9. [Styling Approach](#styling-approach)
10. [Kiosk Functionality](#kiosk-functionality)
11. [Custom Cake Editor](#custom-cake-editor)
12. [Configuration](#configuration)
13. [How Functions Work](#how-functions-work)

---

## Overview

The **Kiosk_Web** client is a modern, touch-optimized web application built with **Next.js 16** and designed for a **21-inch portrait touchscreen display (1080x1920)**. It serves as the customer-facing interface for a bakery POS kiosk system, allowing customers to browse menu items, add items to cart, and initiate custom cake design via QR code.

**Location:** `/client/Kiosk_Web`

**Primary Use Case:** Self-service kiosk for walk-in customers

---

## Technology Stack

### Core Framework
- **Next.js 16.0.10** - React framework with App Router architecture
- **React 18.3.1** - UI library
- **TypeScript 5.6.3** - Type safety

### Build Tools
- **Webpack** - Built into Next.js
- **PostCSS 8.5.6** - CSS processing
- **Tailwind CSS 4.1.11** - Utility-first CSS framework
- **ESLint 9.25.1** - Code linting
- **Prettier 3.5.3** - Code formatting

---

## Dependencies

### UI Component Library - HeroUI

**40+ Components from `@heroui/*` Package:**
- **Form Controls:** Button, Input, Select, Autocomplete, Form, Checkbox, Radio, Switch
- **Layout:** Card, Modal, Drawer, Tabs, Accordion, Divider, Spacer
- **Navigation:** Navbar, Dropdown, Breadcrumbs, Pagination
- **Display:** Table, Chip, Badge, Avatar, Image, Skeleton, Progress, Spinner
- **Feedback:** Toast, Tooltip, Popover, Alert
- **Overlay:** Modal, Drawer
- **Utilities:** Scroll Shadow, Kbd, Code, Snippet, User

### Styling & Theming
- **tailwindcss@4.1.11** - Utility-first CSS framework
- **next-themes@0.4.6** - Dark/Light theme management
- **tailwind-variants@3.1.1** - Component variant utilities
- **clsx@2.1.1** - Conditional className utilities

### Animation
- **framer-motion@11.18.2** - Animation library for smooth transitions

### Icons
- **lucide-react@0.555.0** - Modern icon library with 1000+ icons

### API Communication
- **axios@1.6.0** - HTTP client for API requests

### QR Code Generation
- **qrcode@1.5.4** - QR code generation library
- **qrcode.react@4.2.0** - React QR code component

### 3D Rendering (Custom Cake Editor)
- **three** - 3D graphics library
- **@react-three/fiber** - React renderer for Three.js
- **@react-three/drei** - Helper components for Three.js

### Utilities
- **intl-messageformat@10.7.16** - Internationalization
- **@react-aria/ssr@3.9.10** - Server-side rendering support
- **@react-aria/visually-hidden@3.8.28** - Accessibility utilities

### Development Tools
- **husky** - Git hooks
- **lint-staged** - Pre-commit linting

---

## Directory Structure

```
/client/Kiosk_Web/
├── app/                          # Next.js App Router pages
│   ├── page.tsx                  # Home/Menu page
│   ├── layout.tsx                # Root layout with providers
│   ├── providers.tsx             # Context providers wrapper
│   ├── error.tsx                 # Error boundary
│   ├── not-found.tsx             # 404 page
│   ├── cart/                     # Shopping cart & checkout
│   │   └── page.tsx
│   ├── custom-cake/              # Custom cake QR generation
│   │   └── page.tsx
│   ├── order-confirmation/       # Order confirmation display
│   │   └── page.tsx
│   ├── order-success/            # Order success with QR
│   │   └── page.tsx
│   ├── specials/                 # Special offers page
│   │   └── page.tsx
│   └── idle/                     # Idle screensaver
│       ├── layout.tsx
│       └── page.tsx
│
├── components/                   # Reusable components
│   ├── AnimatedBackground.tsx    # Decorative background
│   ├── BackToMenuButton.tsx      # Navigation component
│   ├── CartFooter.tsx            # Fixed cart summary
│   ├── CustomCakeQRModal.tsx     # QR modal for custom cakes
│   ├── ImageLightbox.tsx         # Image viewer
│   ├── KioskAppSidebar.tsx       # Main sidebar (cart + item details)
│   ├── LayoutContent.tsx         # Layout wrapper
│   ├── MenuCard.tsx              # Menu item display card
│   ├── Toast.tsx                 # Toast notifications
│   ├── counter.tsx               # Quantity counter
│   ├── icons.tsx                 # Custom icons
│   ├── kiosk-navbar.tsx          # Top navigation
│   ├── primitives.ts             # HeroUI re-exports
│   └── theme-switch.tsx          # Theme toggle
│
├── contexts/                     # React Context providers
│   └── CartContext.tsx           # Global cart state management
│
├── services/                     # API service layers
│   ├── customCake.service.ts     # Custom cake API calls
│   ├── menu.service.ts           # Menu & category API
│   ├── order.service.ts          # Order creation & retrieval
│   ├── printer.service.ts        # Printer integration
│   └── settings.service.ts       # Settings API
│
├── types/                        # TypeScript definitions
│   ├── api.ts                    # Complete API types (305 lines)
│   └── index.ts                  # Type exports
│
├── utils/                        # Utility functions
│   └── imageUtils.ts             # Image URL processing
│
├── config/                       # Configuration files
│   ├── api.ts                    # Axios client configuration
│   ├── fonts.ts                  # Font configuration
│   └── site.ts                   # Site metadata
│
├── styles/                       # Global styles
│   └── globals.css               # Custom CSS (802 lines)
│
├── lib/                          # Library utilities
│   ├── shims/                    # Compatibility shims
│   └── utils.ts                  # Utility functions
│
├── next.config.mjs               # Next.js configuration
├── tailwind.config.js            # Tailwind configuration
├── tsconfig.json                 # TypeScript configuration
├── package.json                  # Dependencies
└── .env.example                  # Environment template
```

---

## Pages and Routes

### Main Pages

| Route | File | Purpose |
|-------|------|---------|
| `/` | `app/page.tsx` | Home page with menu grid and categories |
| `/cart` | `app/cart/page.tsx` | Shopping cart and checkout |
| `/custom-cake` | `app/custom-cake/page.tsx` | QR code generation for mobile cake editor |
| `/order-confirmation` | `app/order-confirmation/page.tsx` | Order confirmation display |
| `/order-success` | `app/order-success/page.tsx` | Success page with QR code |
| `/specials` | `app/specials/page.tsx` | Special offers/promotions |
| `/idle` | `app/idle/page.tsx` | Screensaver/idle mode |

### Routing Architecture

Uses **Next.js 14+ App Router** with:
- File-based routing
- Nested layouts
- Server and client components
- Automatic code splitting

---

## Major Components

### 1. MenuCard Component
**File:** `components/MenuCard.tsx`

**Features:**
- Displays menu item with image, name, price
- Shows stock status badges (In Stock, Low Stock, Out of Stock)
- Featured item indicator
- Cart quantity indicator
- Animated "fly to cart" effect on click
- Responsive 3-column grid layout
- Touch-optimized click areas

**Props:**
```typescript
interface MenuCardProps {
  item: MenuItem;
  onAddToCart: (item: MenuItem) => void;
  cartQuantity?: number;
}
```

### 2. KioskAppSidebar Component
**File:** `components/KioskAppSidebar.tsx`

**Purpose:** Right-side sliding panel (35vw width, max 500px)

**Two Main Sections:**

**A. Item Detail Section:**
- Large image display
- Detailed description
- Nutritional information
- Allergen warnings
- Quantity selector (1-99)
- Add to cart button
- Price display

**B. Cart Section (Collapsible):**
- Current cart items list
- Item thumbnails and quantities
- Individual item removal
- Quantity adjustment
- Subtotal calculation
- Tax calculation
- Total display
- Checkout button
- Custom cake link
- Empty cart state

**Features:**
- Toggle button to show/hide
- Smooth slide animations
- Auto-hide on specific pages (idle, cart, custom-cake)
- Responsive design

### 3. LayoutContent Component
**File:** `components/LayoutContent.tsx`

**Features:**
- Wrapper for global layout elements
- Manages animated background
- Provides consistent container
- Responsive padding and margins

### 4. AnimatedBackground Component
**File:** `components/AnimatedBackground.tsx`

**Features:**
- Decorative background with animations
- Golden/yellow gradient theme
- Smooth transitions
- CSS-based animations
- Performance-optimized

### 5. CartFooter Component
**File:** `components/CartFooter.tsx`

**Features:**
- Fixed bottom cart summary
- Quick cart item count display
- Total price display
- Quick access to cart page
- Always visible for easy access

### 6. CustomCakeQRModal Component
**File:** `components/CustomCakeQRModal.tsx`

**Features:**
- QR code display for mobile editor
- Countdown timer (5 minutes)
- Session status polling
- Instructions for customers
- Auto-close on completion
- Regenerate QR option

---

## State Management

### Context API Pattern

**CartContext** (`contexts/CartContext.tsx`)

**Context Interface:**
```typescript
interface CartContextType {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (menuItemId: number) => void;
  updateQuantity: (menuItemId: number, quantity: number) => void;
  clearCart: () => void;
  getItemCount: () => number;
  getSubtotal: () => number;
  getTax: () => number;
  getTotal: () => number;
  getOrderItems: () => OrderItemRequest[];
}
```

**Features:**
- **LocalStorage Persistence** - Cart saved to `goldenmunch_cart` key
- **Automatic Save** - Cart saved on every change
- **Load on Mount** - Cart restored from localStorage
- **Custom Cake Support** - Handles design data and pricing
- **Flavor & Size Variants** - Per-layer customization
- **Price Calculation** - With design complexity costs

**CartItem Interface:**
```typescript
interface CartItem {
  menu_item_id: number;
  name: string;
  quantity: number;
  unit_price: number;
  image_url?: string;
  customization?: CustomCakeDesign;
}
```

### Provider Setup
**File:** `app/providers.tsx`

```typescript
<HeroUIProvider>
  <ToastProvider />
  <NextThemesProvider>
    <CartProvider>
      {children}
    </CartProvider>
  </NextThemesProvider>
</HeroUIProvider>
```

**No External State Libraries** - Uses React Context + useState hooks

---

## API Integration

### Axios Client Configuration
**File:** `config/api.ts`

**Base Configuration:**
```typescript
{
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache, no-store, must-revalidate'
  }
}
```

**Request Interceptor:**
- Logs all outgoing requests with timestamp
- Adds cache-busting parameters
- Ready for future auth token injection

**Response Interceptor:**
- Logs all responses with cache headers
- Global error handling (network/server/unknown)
- Detailed error logging

### Service Layer Pattern

**MenuService** (`services/menu.service.ts`)

**Methods:**
- `getMenuItems(params)` - Fetch menu with filters
  - Supports category filtering
  - Item type filtering
  - Stock status filtering
  - Search by name
- `getItemDetails(id)` - Get item with customization options
- `getCategories()` - Get active categories
- `getActivePromotions()` - Get current promotions
- `checkCapacity(params)` - Check custom cake capacity

**OrderService** (`services/order.service.ts`)

**Methods:**
- `createOrder(orderData)` - Place new order
  - Validates cart items
  - Calculates totals
  - Generates verification code
- `getOrderByCode(code)` - Retrieve order by verification code
- `getOrderById(id)` - Get order details
- `markQRScanned(orderId)` - Mark QR as viewed by customer

**CustomCakeService** (`services/customCake.service.ts`)

**Methods:**
- `generateQRSession(kioskId)` - Create QR session for mobile editor
  - Returns sessionToken, qrCodeUrl, editorUrl, expiresIn
- `pollSessionStatus(sessionToken)` - Check if design is complete
  - Polls every 2 seconds
  - Returns status: pending, in_progress, completed, expired
- `validateSession(sessionToken)` - Validate mobile session
- `getDesignOptions()` - Fetch flavors, sizes, themes
- `saveDraft(draftData)` - Auto-save design
- `submitForReview(requestId)` - Submit for admin approval

**SettingsService** (`services/settings.service.ts`)

**Methods:**
- `getPaymentQR(method)` - Fetch GCash/PayMaya QR codes

---

## Styling Approach

### Tailwind CSS Configuration

**Custom Theme** (`tailwind.config.js`)

**Custom Colors:**
```javascript
colors: {
  'sunny-yellow': '#FBCD2F',
  'charcoal-gray': '#2B2B2B',
  'soft-warm-gray': '#F3F3F3',
  'deep-orange-yellow': '#F5A623',
  // + 15 more custom colors
}
```

**Custom Gradients:**
```javascript
backgroundImage: {
  'mesh-gradient': 'linear-gradient(...)',
  'caramel-gradient': 'linear-gradient(...)',
  // + 4 more gradients
}
```

**Custom Shadows:**
```javascript
boxShadow: {
  'xl-golden': '0 20px 25px...',
  'caramel': '0 4px 20px...',
  // + 4 more custom shadows
}
```

**Custom Animations:**
```javascript
animation: {
  'float': 'float 3s ease-in-out infinite',
  'bounce-slow': 'bounce 2s infinite',
  'pulse-gentle': 'pulse 3s ease-in-out infinite',
  'gradient-shift': 'gradient-shift 15s ease infinite',
  // + 15 more animations
}
```

### Global CSS
**File:** `styles/globals.css` (802 lines)

**Custom @keyframes Animations:**
- `float-smooth` - Background floating elements
- `gradient-shift` - Animated gradients
- `pulse-gentle` - Breathing effect
- `wave-slow/slower` - SVG wave animations
- `fadeIn/fadeInUp/fadeInDown` - Entry animations
- `scaleIn/scaleUp` - Scale animations
- `slideInRight/slideInLeft/slideOutRight` - Slide animations
- `cardLift` - Hover effect for cards
- `shimmer` - Loading skeleton effect
- `ripple` - Button click ripple
- `bounceIn` - Entry bounce
- `glowPulse` - Attention-grabbing glow
- `shake` - Error state animation
- `flyToCart` - Add to cart animation

**Custom CSS Classes:**

**Glass Effects:**
```css
.glass-card {
  backdrop-filter: blur(10px);
  background: rgba(255, 255, 255, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.glass-button {
  backdrop-filter: blur(5px);
  background: rgba(251, 205, 47, 0.2);
}
```

**Touch Optimization:**
```css
.touch-target { min-height: 88px; min-width: 88px; }
.touch-target-lg { min-height: 120px; min-width: 120px; }
.touch-target-xl { min-height: 160px; min-width: 160px; }
```

**Utility Classes:**
```css
.text-gradient - Gradient text effect
.scrollbar-hide - Hide scrollbars
.skeleton - Loading placeholder
.btn-gradient - Gradient button
```

### HeroUI Component Styling

**Styled via:**
- Component props (`color`, `variant`, `size`)
- `classNames` prop for custom styling
- Theme configuration in Tailwind config

**Theme Management:**
```typescript
// Managed by next-themes
const { theme, setTheme } = useTheme();
// Supports: 'light', 'dark', 'system'
```

---

## Kiosk Functionality

### How the Kiosk Works

#### 1. Menu Browsing
- **Grid Layout:** 3-column responsive grid
- **Category Filter:** Horizontal scrolling category chips
- **Real-time Updates:** Auto-refresh every 30 seconds
- **Stock Indicators:** Color-coded badges (green/yellow/red)
- **Featured Items:** Special badge for promoted items
- **Click to View:** Opens sidebar with full details

#### 2. Item Selection
- **Sidebar Slides In:** Smooth animation from right
- **Large Image Display:** Full item image
- **Detailed Info:** Description, allergens, nutritional info
- **Quantity Selector:** Increment/decrement buttons (1-99)
- **Add to Cart:** Large touch-friendly button
- **Visual Feedback:** Animation shows item flying to cart
- **Cart Badge:** Updates in real-time

#### 3. Shopping Cart Management
- **Persistent Cart:** Saved to localStorage
- **Collapsible Panel:** Inside sidebar
- **Inline Editing:** Update quantities directly
- **Remove Items:** Individual item removal
- **Price Display:** Real-time subtotal/tax/total calculation
- **Empty State:** Friendly message with call-to-action

#### 4. Checkout Flow
1. Navigate to `/cart` page
2. **Customer Info (Optional):**
   - Name
   - Phone number
   - Email
3. **Order Type Selection:**
   - Dine In
   - Takeout
   - Delivery
4. **Payment Method:**
   - Cash
   - GCash
   - PayMaya
   - Card
5. **Special Instructions:** Free-text field
6. **QR Code Display:** For digital payments
7. **Reference Number Entry:** For GCash/PayMaya
8. **Order Placement:** Creates order on server

#### 5. Order Completion
- Redirects to `/order-success`
- **Displays:**
  - QR code with order number
  - 6-digit verification code
  - Estimated preparation time
  - Pickup instructions
- **Actions:**
  - Print receipt (if printer connected)
  - Return to menu
  - Start new order
- **Cart Cleared:** Automatic cleanup

### Touch Optimization Features

**Display Specs:**
- **Resolution:** 1080x1920 (portrait)
- **Size:** 21-inch touchscreen
- **Orientation:** Portrait mode

**Touch Optimizations:**
- **Minimum Touch Targets:** 88px (WCAG AAA standard)
- **Large Buttons:** Primary actions 120px+
- **No Text Selection:** Prevents accidental selection
- **No Image Dragging:** Disabled for smoother UX
- **Tap Highlight Disabled:** Custom feedback instead
- **Large Inputs:** Easy keyboard interaction
- **Gesture Support:** Swipe, tap, long-press

**Accessibility:**
- High contrast mode support
- Large, readable fonts (16px minimum)
- Clear visual hierarchy
- Color-blind friendly indicators

---

## Custom Cake Editor

### QR Code Workflow

**Kiosk-Side Flow** (`app/custom-cake/page.tsx`)

**States:**
1. **Welcome Screen:**
   - Introduction to custom cake feature
   - Benefits explanation
   - "Start Designing" button

2. **Generate QR Session:**
   ```typescript
   const session = await CustomCakeService.generateQRSession("KIOSK-001");
   // Returns:
   // {
   //   sessionToken: string,
   //   qrCodeUrl: string,
   //   editorUrl: string,
   //   expiresIn: number (300 seconds)
   // }
   ```

3. **Display QR Code:**
   - **Large QR Code:** 320px × 320px
   - **5-Minute Countdown:** Visual timer with progress bar
   - **Instructions:** "Scan with your phone to design your cake"
   - **Session Token Display:** For debugging

4. **Poll for Completion:**
   ```typescript
   // Every 2 seconds
   const status = await CustomCakeService.pollSessionStatus(sessionToken);

   if (status === 'completed') {
     // Show success screen
     // Display completion message
     // Auto-redirect to menu after 5 seconds
   } else if (status === 'expired') {
     // Show expired screen
     // Offer to regenerate QR
   }
   ```

5. **Session States:**
   - `welcome` - Initial state
   - `generating` - Creating QR session (loading)
   - `qr` - Showing QR code and polling
   - `expired` - Session timeout (5 minutes)
   - `success` - Design completed
   - `error` - Error occurred

**Mobile-Side Flow** (accessed via QR code):
1. Customer scans QR → Opens mobile editor URL
2. Validates session token
3. Loads design options (flavors, sizes, themes)
4. Shows 3D cake editor (Three.js)
5. Auto-saves draft every 3 seconds
6. Customer submits design
7. Marks session as completed
8. Kiosk detects completion and shows success

**Database-Backed Sessions:**
- Session tokens stored in `qr_code_sessions` table
- Design data persisted in `custom_cake_request` table
- Status tracking: pending → in_progress → completed
- Admin review workflow after submission

### Custom Cake Features

**Design Options:**
- **Layers:** 1-5 tiers
- **Flavors:** Chocolate, Vanilla, Strawberry, Red Velvet (per layer)
- **Sizes:** 6", 8", 10", 12" (per layer)
- **Frosting:** Buttercream, Fondant, Whipped Cream, Ganache
- **Frosting Color:** Color picker
- **Themes:** Birthday, Wedding, Anniversary, Graduation
- **Decorations:** Flowers, stars, hearts, ribbons, pearls
- **Custom Text:** With font and color options
- **Special Instructions:** Free-text field

**3D Preview:**
- Real-time 3D rendering with Three.js
- Multi-angle view (front, side, top, 3D)
- Animated decorations
- Screenshot capture for admin review

---

## Configuration

### Next.js Configuration
**File:** `next.config.mjs`

```javascript
{
  output: 'standalone', // For Render deployment
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: true // For speed in development
  },
  transpilePackages: [
    'three',
    '@react-three/fiber',
    '@react-three/drei'
  ],
  images: {
    unoptimized: true // Compatibility mode
  }
}
```

### TypeScript Configuration
**File:** `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "strict": true,
    "jsx": "react-jsx",
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

### Environment Variables

**Development** (`.env.local`):
```bash
NEXT_PUBLIC_API_URL=https://goldenmunch-pos-system-server.onrender.com/api
NEXT_PUBLIC_API_TIMEOUT=30000
```

**Production** (Render):
```bash
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://goldenmunch-pos-system-server.onrender.com/api
NEXT_PUBLIC_API_TIMEOUT=60000
```

---

## How Functions Work

### 1. Add to Cart Flow

```typescript
// User clicks menu item card
const handleAddToCart = (item: MenuItem) => {
  // 1. Create cart item
  const cartItem: CartItem = {
    menu_item_id: item.id,
    name: item.name,
    quantity: 1,
    unit_price: item.current_price,
    image_url: item.image_url
  };

  // 2. Add to cart context
  addItem(cartItem);

  // 3. Show animation (fly to cart)
  triggerFlyAnimation();

  // 4. Update cart badge
  // (automatically updates via context)

  // 5. Save to localStorage
  // (automatically done by CartContext)

  // 6. Show toast notification
  toast.success(`Added ${item.name} to cart!`);
};
```

### 2. Checkout Flow

```typescript
// User clicks "Checkout" button
const handleCheckout = async () => {
  // 1. Validate cart
  if (items.length === 0) {
    toast.error('Cart is empty');
    return;
  }

  // 2. Prepare order data
  const orderData = {
    order_type: 'walk_in',
    order_source: 'kiosk',
    items: getOrderItems(), // Convert cart items to order items
    customer_name: customerName,
    customer_phone: customerPhone,
    payment_method: paymentMethod,
    special_instructions: specialInstructions
  };

  // 3. Call API
  const response = await OrderService.createOrder(orderData);

  // 4. Handle response
  if (response.success) {
    // 5. Clear cart
    clearCart();

    // 6. Navigate to success page
    router.push(`/order-success?orderId=${response.data.id}`);
  } else {
    // Show error
    toast.error(response.message);
  }
};
```

### 3. Custom Cake QR Session Flow

```typescript
// User clicks "Design Custom Cake"
const handleStartCustomCake = async () => {
  // 1. Set state to generating
  setSessionState('generating');

  // 2. Generate QR session
  const session = await CustomCakeService.generateQRSession('KIOSK-001');

  // 3. Display QR code
  setQrCodeUrl(session.qrCodeUrl);
  setSessionToken(session.sessionToken);
  setSessionState('qr');

  // 4. Start countdown timer (5 minutes)
  startCountdown(300);

  // 5. Start polling for completion
  pollInterval = setInterval(async () => {
    const status = await CustomCakeService.pollSessionStatus(sessionToken);

    if (status === 'completed') {
      // 6. Show success
      setSessionState('success');
      clearInterval(pollInterval);

      // 7. Redirect after 5 seconds
      setTimeout(() => {
        router.push('/');
      }, 5000);
    } else if (status === 'expired') {
      // Handle expiration
      setSessionState('expired');
      clearInterval(pollInterval);
    }
  }, 2000); // Poll every 2 seconds
};
```

### 4. Auto-Refresh Menu

```typescript
// Auto-refresh menu items every 30 seconds
useEffect(() => {
  const fetchMenu = async () => {
    const response = await MenuService.getMenuItems({
      category_id: selectedCategory,
      status: 'available'
    });

    if (response.success) {
      setMenuItems(response.data);
    }
  };

  // Initial fetch
  fetchMenu();

  // Set up interval
  const interval = setInterval(fetchMenu, 30000); // 30 seconds

  // Cleanup
  return () => clearInterval(interval);
}, [selectedCategory]);
```

### 5. Cart Persistence

```typescript
// CartContext implementation
const CartProvider = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('goldenmunch_cart');
    if (savedCart) {
      setItems(JSON.parse(savedCart));
    }
  }, []);

  // Save to localStorage on cart change
  useEffect(() => {
    localStorage.setItem('goldenmunch_cart', JSON.stringify(items));
  }, [items]);

  // ... cart methods
};
```

---

## Performance Optimizations

### 1. Code Splitting
- **Automatic** via Next.js App Router
- **Dynamic imports** for heavy components
- **Lazy loading** for images

### 2. Image Optimization
- Next.js Image component for optimization
- Lazy loading with blur placeholder
- Responsive image sizing

### 3. Caching Strategy
- **API caching** with cache-busting timestamps
- **LocalStorage** for cart persistence
- **SWR patterns** for data fetching

### 4. Bundle Optimization
- **Tree shaking** enabled
- **Minification** in production
- **Compression** (gzip/brotli)

---

## Deployment

### Development
```bash
npm run dev   # Start dev server on port 3002
```

### Production Build
```bash
npm run build   # Create optimized production build
npm start       # Start production server
```

### Deployment on Render.com
1. Connect GitHub repository
2. Set build command: `npm run build`
3. Set start command: `npm start`
4. Configure environment variables
5. Auto-deploy on git push

---

## Summary

The **Kiosk_Web** client is a sophisticated **Next.js 16** application optimized for touchscreen kiosks. Key features include:

- **Modern UI:** HeroUI component library with 40+ components
- **Touch-Optimized:** 88px minimum touch targets, portrait 21-inch display
- **Real-time Menu:** Auto-refreshing with categories and stock status
- **Custom Cake Editor:** QR-based mobile workflow with session polling
- **Shopping Cart:** LocalStorage persistence with complex pricing
- **Checkout:** Multiple payment methods (Cash, GCash, PayMaya)
- **802 Lines of CSS:** Extensive custom animations
- **API Integration:** Axios-based service layer with interceptors
- **State Management:** React Context for cart state
- **Theme System:** Dark/Light mode with next-themes
- **Deployment-Ready:** Standalone mode for Render.com

The application provides an intuitive, visually appealing interface for customers to browse products, customize cakes, and complete orders seamlessly through a self-service kiosk experience.
