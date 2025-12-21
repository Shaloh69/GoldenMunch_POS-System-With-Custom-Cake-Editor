# MobileEditor Client - Complete Architecture Documentation

## Table of Contents
1. [Overview](#overview)
2. [Technology Stack](#technology-stack)
3. [Dependencies](#dependencies)
4. [Directory Structure](#directory-structure)
5. [Screens and Navigation](#screens-and-navigation)
6. [Mobile-Specific Features](#mobile-specific-features)
7. [State Management](#state-management)
8. [Backend Connection](#backend-connection)
9. [Custom Cake Editing Features](#custom-cake-editing-features)
10. [Build Configuration](#build-configuration)
11. [How Functions Work](#how-functions-work)

---

## Overview

The **MobileEditor** is a **mobile-optimized Progressive Web Application (PWA)** built with **Next.js 14** and designed for smartphones and tablets. It provides a 3D cake customization interface accessed via QR code from the kiosk.

**Location:** `/client/MobileEditor`

**Important:** This is **NOT a native mobile app** - it's a web application optimized for mobile browsers.

### Key Characteristics

- **Framework:** Next.js 14 with static export
- **Access Method:** QR code scan from kiosk
- **Rendering:** 3D visualization with Three.js
- **Deployment:** Static files served by Express backend
- **Session-Based:** Time-limited design sessions (30 minutes)

---

## Technology Stack

### Core Framework
- **Next.js 14.2.25** - React framework with Static Site Generation (SSG)
- **React 18.2.0** - UI library
- **TypeScript 5.2.2** - Type safety

### Mobile Deployment
- **Static Export** - No server-side rendering
- **Nginx** - Production web server (via Docker)
- **Docker** - Multi-stage build for production

---

## Dependencies

### Core Framework
```json
{
  "next": "14.2.25",
  "react": "18.2.0",
  "react-dom": "18.2.0",
  "typescript": "5.2.2"
}
```

### UI Components & Styling
```json
{
  "@nextui-org/react": "2.2.9",      // NextUI component library
  "@nextui-org/system": "2.0.15",
  "@nextui-org/theme": "2.1.17",
  "@heroicons/react": "2.1.1",       // Icon library
  "tailwindcss": "3.3.5",            // Utility-first CSS
  "framer-motion": "11.5.0"          // Animation library
}
```

### 3D Rendering (Core Feature!)
```json
{
  "three": "0.169.0",                // 3D graphics library
  "@react-three/fiber": "8.17.10",   // React renderer for Three.js
  "@react-three/drei": "9.114.3"     // Three.js helper components
}
```

**3D Features:**
- Real-time 3D cake rendering
- Multi-layer cake visualization
- Animated decorations (flowers, stars, hearts, ribbons)
- 3D text rendering
- Animated candles with flickering flames
- OrbitControls for camera manipulation
- Environment lighting and shadows

### API Communication
```json
{
  "axios": "1.6.0"  // HTTP client (with custom fetch wrapper)
}
```

---

## Directory Structure

```
/client/MobileEditor/
├── app/                          # Next.js App Router
│   ├── page.tsx                  # Main editor page (8-step wizard)
│   ├── layout.tsx                # Root layout with metadata
│   ├── providers.tsx             # NextUI provider wrapper
│   └── globals.css               # Global styles
│
├── components/                   # React components
│   └── cake-editor/
│       ├── CakeCanvas3D.tsx          # 3D canvas wrapper
│       ├── CakeModel.tsx             # 3D cake rendering with layers
│       ├── Decorations3D.tsx         # 3D decorations (flowers, stars, etc.)
│       └── steps/                    # Wizard step components
│           ├── StepCustomerInfo.tsx  # Step 1: Contact info
│           ├── StepLayers.tsx        # Step 2: Layer count (1-5)
│           ├── StepFlavor.tsx        # Step 3: Flavor per layer
│           ├── StepSize.tsx          # Step 4: Size per layer
│           ├── StepFrosting.tsx      # Step 5: Frosting type & color
│           ├── StepDecorations.tsx   # Step 6: 3D decorations & theme
│           ├── StepText.tsx          # Step 7: Custom text
│           └── StepReview.tsx        # Step 8: Review & submit
│
├── services/                     # API service layer
│   └── customCake.service.ts     # API integration
│
├── config/                       # Configuration
│   └── api.ts                    # API client (custom fetch wrapper)
│
├── types/                        # TypeScript types
│   └── api.ts                    # Type definitions
│
├── public/                       # Static assets
│   └── fonts/
│       └── helvetiker_regular.typeface.json  # 3D text font
│
├── next.config.js                # Next.js config (static export)
├── tailwind.config.ts            # Tailwind config (sunny yellow theme)
├── tsconfig.json                 # TypeScript config
├── package.json                  # Dependencies
├── Dockerfile                    # Multi-stage Docker build
├── nginx.conf.template           # Nginx config for production
├── start-nginx.sh                # Startup script
├── .env.example                  # Environment template
├── .env.local                    # Local development config
└── .env.production               # Production config
```

---

## Screens and Navigation

### Navigation Pattern: 8-Step Linear Wizard

The app uses a **single-page design** with a step-based wizard:

### Step-by-Step Flow

**Step 1 - Customer Info** (`StepCustomerInfo.tsx`)
- **Fields:**
  - Full name (required)
  - Email address (required)
  - Phone number (required)
  - Event type (birthday, wedding, anniversary, graduation, etc.)
  - Event date (optional)
- **Validation:** Email and phone format checking

**Step 2 - Layers** (`StepLayers.tsx`)
- **Selection:** Number of cake tiers (1-5 layers)
- **Visual:** 3D preview updates in real-time
- **Info:** Explanation of multi-tier cakes

**Step 3 - Flavors** (`StepFlavor.tsx`)
- **Per-Layer Selection:** Choose flavor for each layer
- **Options:**
  - Chocolate (brown cake color)
  - Vanilla (cream cake color)
  - Strawberry (pink cake color)
  - Red Velvet (red cake color)
- **Visual:** 3D cake layers update with colors

**Step 4 - Sizes** (`StepSize.tsx`)
- **Per-Layer Selection:** Choose size for each layer
- **Options:**
  - Small (6 inches, serves 8-10)
  - Medium (8 inches, serves 15-20)
  - Large (10 inches, serves 25-30)
  - Extra Large (12 inches, serves 35-40)
- **Visual:** Layer diameters update in 3D

**Step 5 - Frosting** (`StepFrosting.tsx`)
- **Frosting Type:**
  - Buttercream (smooth, classic)
  - Fondant (smooth, sculptable)
  - Whipped Cream (light, airy)
  - Ganache (rich, glossy)
  - Cream Cheese (tangy, smooth)
- **Color Picker:** Select frosting color (hex color picker)
- **Visual:** Frosting color updates on 3D model

**Step 6 - Decorations** (`StepDecorations.tsx`)
- **Theme Selection:**
  - Birthday (balloons, candles)
  - Wedding (flowers, elegance)
  - Anniversary (hearts, romance)
  - Graduation (caps, diplomas)
- **3D Decorations:** Select from:
  - Flowers 🌸 (6-petal design)
  - Stars ⭐ (extruded star shape)
  - Hearts ❤️ (bezier curve hearts)
  - Ribbons 🎀 (torus loops)
  - Pearls ⚪ (reflective spheres)
  - Butterflies 🦋 (flapping wings)
- **Quantity:** Adjustable count per decoration type
- **Special Instructions:** Free-text field

**Step 7 - Text** (`StepText.tsx`)
- **Custom Text:** Message for cake (e.g., "Happy Birthday!")
- **Text Color:** Color picker
- **Font Selection:** Multiple font options
- **Position:** Top, center, or bottom of cake
- **Visual:** 3D text rendered on cake model

**Step 8 - Review** (`StepReview.tsx`)
- **Summary:** All design choices displayed
- **Pricing:** Estimated cost calculation
- **Actions:**
  - Go back to edit
  - Submit for admin review
- **Screenshot Capture:** Multiple angles saved

### Navigation Controls

**Bottom Panel:**
- **Previous Button** - Go back one step
- **Next Button** - Proceed to next step
- **Progress Indicator** - "Step 3 of 8" with progress bar
- **Swipeable Panel** - Drag down to hide controls for full 3D view

**Drag-to-Dismiss:**
- Drag handle at top of panel
- Swipe down to minimize controls
- Tap to restore

---

## Mobile-Specific Features

### Touch & Gesture Controls

**1. Drag-to-Dismiss Panel**
- Swipe down on drag handle to hide control panel
- Shows full-screen 3D cake view
- Framer Motion spring animations
- Smooth gesture tracking

**2. 3D Canvas Interactions**
- **OrbitControls** from Three.js
- **Pinch to Zoom:**
  - Minimum distance: 3 units
  - Maximum distance: 8 units
- **Swipe to Rotate:** 360° camera rotation
- **Touch-Optimized:** Smooth touch response

**3. Mobile-Optimized UI**
- **Viewport Meta Tags:**
  ```html
  <meta name="viewport"
    content="width=device-width, initial-scale=1,
    user-scalable=no, viewport-fit=cover">
  ```
- **Safe Area Insets:** For notched devices (iPhone X+)
- **Responsive Breakpoints:** sm, md, lg
- **Large Touch Targets:** Minimum 44-48px (Apple HIG)

### Mobile UX Features

**QR Code Session Management**
- Accessed via QR scan from kiosk
- 30-minute session timeout
- Session token validation
- Expiry warnings

**Auto-Save**
- Saves draft every 3 seconds
- Network-resilient (retry logic)
- LocalStorage backup

**Fullscreen Tip**
- Prompts user to enable fullscreen mode
- Better immersive experience
- iOS/Android specific instructions

**Tutorial System**
- 4-step guided tour on first use
- Skip option available
- LocalStorage tracking (shown once)

**Offline Fallback**
- Mock data if API unavailable
- Graceful degradation
- Network status detection

### Device Capabilities

**WebGL Rendering**
- Required for 3D preview
- WebGL capability detection
- Fallback message for unsupported devices

**LocalStorage**
- Tutorial completion tracking
- Session state backup
- Draft persistence

**Canvas Screenshot**
- Captures 3D renders as PNG images
- Multiple angles (front, side, top, 3D)
- Uploaded to backend for admin review

---

## State Management

### Strategy: Local React State (useState)

**No external state management library** - Pure React hooks

```typescript
// Main state object
interface CakeDesign {
  // Customer Information
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  event_type?: string;
  event_date?: string;

  // Cake Structure
  num_layers: number;
  layer_1_flavor_id?: number;
  layer_1_size_id?: number;
  layer_2_flavor_id?: number;
  layer_2_size_id?: number;
  // ... up to layer_5

  // Frosting & Theme
  theme_id?: number;
  frosting_type: string;
  frosting_color: string;

  // Decorations
  candles_count: number;
  candle_type: string;
  decorations_3d?: Decoration3D[];

  // Custom Text
  cake_text?: string;
  text_color?: string;
  text_font?: string;
  text_position?: string;

  // Notes
  special_instructions?: string;
  dietary_restrictions?: string;
  reference_image?: string;
}
```

### State Flow

```typescript
// 1. Initial State - Default values
const [design, setDesign] = useState<CakeDesign>({
  customer_name: '',
  customer_email: '',
  customer_phone: '',
  num_layers: 1,
  frosting_type: 'buttercream',
  frosting_color: '#FFFFFF',
  candles_count: 0,
  decorations_3d: []
});

// 2. Step Updates - Partial updates
const updateDesign = (updates: Partial<CakeDesign>) => {
  setDesign(prev => ({ ...prev, ...updates }));
};

// 3. Auto-save with debounce
useEffect(() => {
  const timer = setTimeout(() => {
    saveDraft(design);
  }, 3000); // 3-second debounce

  return () => clearTimeout(timer);
}, [design]);

// 4. Submit - Finalize design
const handleSubmit = async () => {
  const response = await CustomCakeService.submit(design);
  // ...
};
```

---

## Backend Connection

### API Configuration

**Base URL:** Configured via `NEXT_PUBLIC_API_URL`
- **Local Dev:** `http://localhost:3001/api`
- **Production:** `https://goldenmunch-pos-system-server.onrender.com/api`

### API Client Architecture

**Custom Fetch Wrapper** (`config/api.ts`)

Mimics Axios API but uses native Fetch:

```typescript
class ApiClient {
  private baseURL: string;

  async get<T>(url: string): Promise<ApiResponse<T>> {
    const response = await fetch(`${this.baseURL}${url}`, {
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) {
      throw new ApiError(response.status, await response.text());
    }

    return await response.json();
  }

  async post<T>(url: string, data: any): Promise<ApiResponse<T>> {
    // Similar to get but with POST method and body
  }
}
```

**Custom Error Class:**
```typescript
class ApiError extends Error {
  constructor(
    public status: number,
    public message: string
  ) {
    super(message);
  }
}
```

### API Endpoints Used

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/custom-cake/session/:token` | GET | Validate QR session |
| `/api/custom-cake/options` | GET | Fetch flavors/sizes/themes |
| `/api/custom-cake/save-draft` | POST | Auto-save design (every 3s) |
| `/api/custom-cake/upload-images` | POST | Upload 3D screenshots |
| `/api/custom-cake/submit` | POST | Submit final design for review |

### Session Flow

```
1. Kiosk generates QR
   └─> POST /api/kiosk/custom-cake/generate-qr
       Returns: sessionToken

2. QR contains URL
   └─> http://SERVER_IP:3001/?session=TOKEN

3. Mobile validates session
   └─> GET /api/custom-cake/session/:token
       Returns: { valid: true, expiresAt: "..." }

4. Mobile designs cake
   └─> POST /api/custom-cake/save-draft (every 3s)
       Auto-saves progress

5. Mobile submits
   └─> POST /api/custom-cake/submit
       Creates custom_cake_request record
       Marks session as completed
```

---

## Custom Cake Editing Features (3D)

### 3D Rendering Engine

**Technology:** Three.js via React Three Fiber

### Features

#### A. 3D Cake Model (`CakeModel.tsx`)

**Multi-Layer Rendering:**
- 1-5 cylindrical tiers
- Dynamic sizing based on selections
- Automatic stacking with proper spacing

**Flavor-Based Colors:**
```typescript
const flavorColors = {
  chocolate: '#8B4513',   // Brown
  vanilla: '#FFE4B5',     // Cream
  strawberry: '#FFB6C1',  // Pink
  redVelvet: '#DC143C'    // Red
};
```

**Frosting Layers:**
- Top frosting cap (rounded)
- Side frosting coating
- Configurable color (hex)
- Smooth material finish

**Auto-Rotation:**
- Gentle sine-wave animation
- Rotates on Y-axis
- Speed: 0.2 radians/sec

#### B. 3D Candles (Advanced!)

**Smart Positioning Algorithm:**
- Grid layout within circular boundary
- Adapts to layer diameter
- Evenly distributed

**Adaptive Scaling:**
- Smaller candles for larger counts
- Maintains visual balance

**Animated Flames:**
```typescript
// Flickering effect
flame.scale.y = 1 + Math.sin(time * 5) * 0.1;

// Dual-layer flame
- Inner yellow glow
- Outer orange corona
- Point light emission (yellow light)
```

**Candle Structure:**
- Wax-colored cylinder body
- Wick (small cylinder)
- Flame geometry (cone)
- Metallic base

#### C. 3D Decorations (`Decorations3D.tsx`)

**6 Decoration Types:**

**1. Flowers 🌸**
```typescript
- 6 pink petals (spheres)
- Yellow center sphere
- Optional green stem
- Grouped together
```

**2. Stars ⭐**
```typescript
- Extruded star shape (5 points)
- Metallic gold material
- Rotating animation
- Emissive glow (#FFD700)
```

**3. Hearts ❤️**
```typescript
- Bezier curve heart shape
- 3D extrusion (depth: 0.2)
- Metallic red finish
- Positioned on top of cake
```

**4. Ribbons 🎀**
```typescript
- Torus geometry loop
- Ribbon tails (boxes)
- Center knot (sphere)
- Positioned on sides
```

**5. Butterflies 🦋**
```typescript
- Flapping wing animation
- Body (cylinder) + antennae (thin cylinders)
- Hemisphere wings
- Flight path animation
```

**6. Pearls ⚪**
```typescript
- Highly reflective spheres
- Metallic material (roughness: 0.1)
- White color
- Small size (0.05 radius)
```

#### D. 3D Text

**Font:** Helvetiker Regular (Three.js typeface)

**Features:**
```typescript
{
  font: helvetikerFont,
  size: 0.4,
  height: 0.1,  // Extrusion depth
  curveSegments: 12,
  bevelEnabled: true,
  bevelThickness: 0.02,
  bevelSize: 0.01,
  bevelSegments: 5
}
```

**Material:**
- MeshStandardMaterial
- Metallic finish
- Configurable color
- Emissive glow

**Positioning:**
- Front of cake (z-axis offset)
- Above top layer
- Centered horizontally

#### E. Lighting & Environment

**Lighting Setup:**
```typescript
<ambientLight intensity={0.5} />
<spotLight
  position={[10, 10, 10]}
  angle={0.3}
  penumbra={1}
  intensity={1}
  castShadow
/>
<pointLight position={[-10, -10, -10]} intensity={0.5} />
```

**Environment:**
- "Sunset" HDR preset (from drei)
- Realistic reflections
- Ambient occlusion
- Contact shadows on ground plane

#### F. Camera & Controls

**PerspectiveCamera:**
```typescript
{
  position: [0, 2, 5],
  fov: 50,
  near: 0.1,
  far: 1000
}
```

**OrbitControls:**
```typescript
{
  enablePan: false,           // No panning
  enableZoom: true,            // Pinch to zoom
  minDistance: 3,              // Closest zoom
  maxDistance: 8,              // Farthest zoom
  maxPolarAngle: Math.PI / 2,  // Can't go below cake
  autoRotate: false,
  dampingFactor: 0.05
}
```

#### G. Screenshot Capture

**Multi-Angle Rendering:**

```typescript
const captureAngles = async () => {
  const angles = [
    { name: 'front', position: [0, 2, 5] },
    { name: 'side', position: [5, 2, 0] },
    { name: 'top', position: [0, 5, 0] },
    { name: '3d', position: [3, 3, 3] }
  ];

  const screenshots = [];

  for (const angle of angles) {
    // Move camera
    camera.position.set(...angle.position);
    camera.lookAt(0, 1, 0);

    // Render frame
    gl.render(scene, camera);

    // Capture to PNG
    const dataURL = gl.domElement.toDataURL('image/png');
    screenshots.push({ angle: angle.name, image: dataURL });
  }

  return screenshots;
};
```

**Upload to Backend:**
```typescript
await CustomCakeService.uploadImages({
  sessionToken,
  images: screenshots
});
```

---

## Build Configuration

### Development

```bash
npm run dev   # Starts Next.js dev server on port 3003
```

**Debug Mode:**
```
http://localhost:3003/?debug=true  # Bypasses session validation
```

### Production Build

```bash
npm run build   # Creates static export in /out directory
npm run export  # Alias for build + export
```

**Output:** `/out` directory with static HTML/CSS/JS

### Docker Build (Multi-Stage)

**File:** `/client/MobileEditor/Dockerfile`

**Stage 1: Builder**
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build  # Creates /app/out directory
```

**Stage 2: Production**
```dockerfile
FROM nginx:alpine
COPY --from=builder /app/out /usr/share/nginx/html
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
EXPOSE ${PORT:-10000}
USER nodejs:1001
HEALTHCHECK --interval=30s --timeout=3s \
  CMD wget --quiet --tries=1 --spider http://localhost:${PORT:-10000} || exit 1
ENTRYPOINT ["dumb-init", "--"]
CMD ["/start-nginx.sh"]
```

**Nginx Configuration** (`nginx.conf.template`):
```nginx
server {
  listen ${PORT};
  server_name _;
  root /usr/share/nginx/html;
  index index.html;

  location / {
    try_files $uri $uri/ /index.html;
  }

  # Cache static assets
  location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
  }
}
```

### iOS/Android Considerations

**This is a PWA, not a native app:**
- Can be added to home screen (iOS/Android)
- Fullscreen mode available
- WebGL rendering on mobile browsers
- No App Store/Play Store distribution

**PWA Features:**
- Installable (Add to Home Screen)
- Works offline (if service worker added)
- Fullscreen mode
- Native-like experience

---

## How Functions Work

### 1. Session Validation Flow

```typescript
// User scans QR code from kiosk
// URL: http://SERVER_IP:3001/?session=abc123xyz

// 1. Extract session token from URL
const params = new URLSearchParams(window.location.search);
const sessionToken = params.get('session');

// 2. Validate session
const validateSession = async () => {
  try {
    const response = await CustomCakeService.validateSession(sessionToken);

    if (response.valid) {
      // Session is valid
      setSessionValid(true);
      setExpiresAt(response.expiresAt);
      startExpiryCountdown();
    } else {
      // Session expired or invalid
      setSessionValid(false);
      showError('Session has expired. Please scan QR code again.');
    }
  } catch (error) {
    // Network error
    showError('Unable to connect to server.');
  }
};
```

### 2. Auto-Save Draft Flow

```typescript
// Auto-save design every 3 seconds
useEffect(() => {
  // Don't auto-save on first render
  if (isFirstRender) {
    setIsFirstRender(false);
    return;
  }

  // Debounce saves
  const timer = setTimeout(async () => {
    try {
      await CustomCakeService.saveDraft({
        sessionToken,
        design: design
      });

      // Show subtle success indicator
      setLastSaved(new Date());
    } catch (error) {
      console.error('Auto-save failed:', error);
      // Don't block user, will retry
    }
  }, 3000); // 3-second debounce

  return () => clearTimeout(timer);
}, [design]); // Re-run when design changes
```

### 3. 3D Rendering Update Flow

```typescript
// User selects new frosting color
const handleFrostingColorChange = (color: string) => {
  // 1. Update state
  updateDesign({ frosting_color: color });

  // 2. React Three Fiber automatically re-renders
  // CakeModel.tsx receives new props
  // <mesh> material color updates

  // 3. Auto-save triggered (via useEffect above)
};

// In CakeModel.tsx
const CakeModel = ({ frostingColor, layers, flavors }) => {
  return (
    <group>
      {layers.map((layer, index) => (
        <mesh key={index} position={[0, index * 0.5, 0]}>
          <cylinderGeometry args={[layer.diameter, layer.diameter, 0.4]} />
          <meshStandardMaterial
            color={frostingColor}  // ← Updates automatically
            metalness={0.2}
            roughness={0.6}
          />
        </mesh>
      ))}
    </group>
  );
};
```

### 4. Screenshot Capture & Upload Flow

```typescript
// User clicks "Submit" in Step 8
const handleSubmit = async () => {
  try {
    // 1. Capture screenshots from 3D canvas
    setLoading(true);
    setLoadingMessage('Capturing 3D previews...');

    const screenshots = await captureScreenshots();
    // Returns: [
    //   { angle: 'front', image: 'data:image/png;base64,...' },
    //   { angle: 'side', image: 'data:image/png;base64,...' },
    //   ...
    // ]

    // 2. Upload screenshots to backend
    setLoadingMessage('Uploading images...');

    await CustomCakeService.uploadImages({
      sessionToken,
      images: screenshots
    });

    // 3. Submit design for review
    setLoadingMessage('Submitting for review...');

    const response = await CustomCakeService.submit({
      sessionToken,
      design: design
    });

    if (response.success) {
      // 4. Mark session as completed
      setSubmitted(true);

      // 5. Show success message
      showSuccess('Your custom cake has been submitted for review!');

      // 6. Kiosk will detect completion via polling
      // and show success screen
    }
  } catch (error) {
    showError('Failed to submit. Please try again.');
  } finally {
    setLoading(false);
  }
};
```

### 5. Kiosk Polling Detection

```typescript
// Kiosk side (not in MobileEditor, but related):
const pollSessionStatus = async () => {
  const interval = setInterval(async () => {
    const status = await CustomCakeService.pollSessionStatus(sessionToken);

    if (status === 'completed') {
      // Mobile user has submitted design
      clearInterval(interval);
      showSuccess('Design completed!');
      redirectToMenu();
    }
  }, 2000); // Poll every 2 seconds
};
```

---

## Summary

The **MobileEditor** is a sophisticated **mobile-optimized web application** (not a native app) built with Next.js and Three.js. Key features include:

### Core Technology
- **Next.js 14** with static export (no SSR)
- **Three.js** for real-time 3D cake visualization
- **TypeScript** for type safety
- **NextUI** component library
- **Tailwind CSS** for styling

### Mobile Optimization
- **Touch-friendly** with 44px minimum targets
- **Swipeable panels** with spring animations
- **Responsive** breakpoints (sm, md, lg)
- **WebGL** detection and fallbacks
- **Network-resilient** with auto-save

### 3D Features
- **Real-time rendering** of multi-layer cakes
- **Animated decorations** (flowers, stars, hearts, ribbons, pearls, butterflies)
- **3D text** rendering with extrusion
- **Animated candles** with flickering flames
- **OrbitControls** for pinch-zoom and rotation
- **Screenshot capture** from multiple angles

### Workflow
- **QR-based access** from kiosk (30-minute sessions)
- **8-step wizard** for comprehensive customization
- **Auto-save** every 3 seconds
- **Multi-angle screenshots** for admin review
- **Session completion** detection by kiosk

### Deployment
- **Static export** to `/out` directory
- **Nginx** production server (Docker)
- **Multi-stage Docker build** for optimization
- **Served by backend** Express server

The MobileEditor provides an innovative, intuitive interface for customers to design custom cakes on their smartphones with real-time 3D visualization, accessed seamlessly through QR code scanning from the kiosk.
