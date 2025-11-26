# 🎂 Custom Cake 3D Editor & Approval Workflow - Implementation Plan

**Created:** November 23, 2025
**Status:** Ready to Implement
**Priority:** High

---

## 📋 Overview

Implement a complete custom cake ordering system with:
- QR code generation from kiosk
- Mobile-friendly 3D cake editor
- Admin review & approval workflow
- Price & schedule management
- Cashier integration for payment processing

---

## 🎯 Current Database Schema Analysis

### ✅ Existing Tables (Already Available):
```sql
- cake_flavors (flavor options)
- cake_sizes (size options)
- custom_cake_theme (birthday, wedding, etc.)
- custom_cake_design (design specifications)
- custom_cake_daily_capacity (production limits)
- customer_order (main orders table)
- order_item (line items with custom_cake_design_id)
```

### ❌ Missing Tables (Need to Create):
```sql
- custom_cake_request (for approval workflow)
- custom_cake_request_images (for storing design images/3D renders)
- qr_code_sessions (for linking QR codes to requests)
```

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CUSTOM CAKE FLOW                          │
└─────────────────────────────────────────────────────────────────┘

1. KIOSK
   ↓
   [User clicks "Custom Cake"]
   ↓
   [System generates QR code + Session Token]
   ↓
   [Display QR code on screen]

2. MOBILE (Scan QR)
   ↓
   [Opens: /custom-cake-editor?session=TOKEN]
   ↓
   [3D Cake Editor Interface]
   │
   ├─ Select Layers (1-5)
   ├─ Add Candles (count, type)
   ├─ Choose Theme
   ├─ Select Flavors per layer
   ├─ Add 3D Decorations
   ├─ Text on Cake
   ├─ Special Instructions
   └─ Notes to Baker
   ↓
   [Submit for Review]
   ↓
   [Status: "pending_review"]

3. ADMIN DASHBOARD
   ↓
   [Review Custom Cake Requests]
   ↓
   [View 3D Preview + Specifications]
   ↓
   [Decision: Approve / Reject]
   │
   ├─ APPROVE:
   │  ├─ Set Custom Price
   │  ├─ Set Preparation Days
   │  ├─ Set Pickup Date/Time
   │  └─ Status: "approved"
   │
   └─ REJECT:
      ├─ Provide Reason
      └─ Status: "rejected"

4. CUSTOMER NOTIFICATION
   ↓
   [Email/SMS with order details]
   ↓
   [Payment link or QR code]

5. CASHIER/PAYMENT
   ↓
   [View approved custom orders]
   ↓
   [Process payment]
   ↓
   [Generate order ticket]
   ↓
   [Status: "confirmed" → "preparing" → "ready" → "completed"]
```

---

## 📊 New Database Schema

### 1. Custom Cake Request Table
```sql
CREATE TABLE custom_cake_request (
    request_id INT AUTO_INCREMENT PRIMARY KEY,
    session_token VARCHAR(100) NOT NULL UNIQUE,
    qr_code_data TEXT COMMENT 'QR code content',

    -- Customer Info
    customer_name VARCHAR(100),
    customer_phone VARCHAR(20),
    customer_email VARCHAR(100),

    -- Cake Design Details
    num_layers INT DEFAULT 1,
    layer_1_flavor_id INT,
    layer_2_flavor_id INT,
    layer_3_flavor_id INT,
    layer_4_flavor_id INT,
    layer_5_flavor_id INT,

    total_height_cm DECIMAL(5,2),
    base_diameter_cm DECIMAL(5,2),

    -- Decorations
    theme_id INT,
    candles_count INT DEFAULT 0,
    candle_type ENUM('number', 'regular', 'sparkler', 'none') DEFAULT 'regular',
    frosting_color VARCHAR(50),
    frosting_type ENUM('buttercream', 'fondant', 'whipped_cream', 'ganache', 'cream_cheese'),

    -- 3D Elements (JSON for flexibility)
    decorations_3d JSON COMMENT 'Array of 3D decoration objects',
    cake_text VARCHAR(200),
    text_color VARCHAR(50),
    text_font ENUM('script', 'bold', 'elegant', 'playful', 'modern') DEFAULT 'script',

    -- Instructions
    special_instructions TEXT,
    baker_notes TEXT,
    dietary_restrictions TEXT,

    -- Approval Workflow
    status ENUM('draft', 'pending_review', 'approved', 'rejected', 'cancelled') DEFAULT 'draft',
    submitted_at TIMESTAMP NULL,
    reviewed_at TIMESTAMP NULL,
    reviewed_by INT NULL COMMENT 'admin_id who reviewed',
    rejection_reason TEXT NULL,

    -- Pricing & Scheduling
    estimated_price DECIMAL(10,2) NULL COMMENT 'Auto-calculated estimate',
    approved_price DECIMAL(10,2) NULL COMMENT 'Final price set by admin',
    preparation_days INT NULL,
    scheduled_pickup_date DATE NULL,
    scheduled_pickup_time TIME NULL,

    -- Linked Order (after approval & payment)
    order_id INT NULL COMMENT 'Links to customer_order after payment',

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NULL COMMENT 'QR session expiry',

    FOREIGN KEY (theme_id) REFERENCES custom_cake_theme(theme_id),
    FOREIGN KEY (layer_1_flavor_id) REFERENCES cake_flavors(flavor_id),
    FOREIGN KEY (layer_2_flavor_id) REFERENCES cake_flavors(flavor_id),
    FOREIGN KEY (layer_3_flavor_id) REFERENCES cake_flavors(flavor_id),
    FOREIGN KEY (layer_4_flavor_id) REFERENCES cake_flavors(flavor_id),
    FOREIGN KEY (layer_5_flavor_id) REFERENCES cake_flavors(flavor_id),
    FOREIGN KEY (reviewed_by) REFERENCES admin(admin_id),
    FOREIGN KEY (order_id) REFERENCES customer_order(order_id),

    INDEX idx_session_token (session_token),
    INDEX idx_status (status),
    INDEX idx_submitted_at (submitted_at),
    INDEX idx_scheduled_pickup (scheduled_pickup_date)
);
```

### 2. Request Images/Renders Table
```sql
CREATE TABLE custom_cake_request_images (
    image_id INT AUTO_INCREMENT PRIMARY KEY,
    request_id INT NOT NULL,
    image_url VARCHAR(255) NOT NULL,
    image_type ENUM('3d_render', 'reference', 'sketch') DEFAULT '3d_render',
    view_angle ENUM('front', 'side', 'top', '3d') DEFAULT 'front',
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (request_id) REFERENCES custom_cake_request(request_id) ON DELETE CASCADE,
    INDEX idx_request_images (request_id)
);
```

### 3. QR Session Tracking
```sql
CREATE TABLE qr_code_sessions (
    session_id INT AUTO_INCREMENT PRIMARY KEY,
    session_token VARCHAR(100) NOT NULL UNIQUE,
    qr_code_url VARCHAR(500) NOT NULL,
    kiosk_id VARCHAR(50) COMMENT 'Which kiosk generated this',
    ip_address VARCHAR(50),
    user_agent TEXT,

    status ENUM('active', 'used', 'expired') DEFAULT 'active',
    accessed_at TIMESTAMP NULL,
    expires_at TIMESTAMP NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_token (session_token),
    INDEX idx_status (status),
    INDEX idx_expires (expires_at)
);
```

---

## 💻 Frontend Components

### 1. **Kiosk - Custom Cake Start Page**
**File:** `client/Kiosk/app/custom-cake/page.tsx`

```typescript
Features:
- Display "Create Custom Cake" button
- Generate QR code via API call
- Show QR code with countdown timer (15 min expiry)
- Instructions: "Scan QR code with your phone"
- Link to editor for testing: /custom-cake-editor?session=TOKEN
```

### 2. **Mobile 3D Cake Editor**
**File:** `client/cake-editor/app/page.tsx` (New separate Next.js app)

```typescript
Features:
- Validate session token
- Multi-step wizard:

  Step 1: Basic Info
  - Customer name, phone, email
  - Event type (birthday, wedding, etc.)

  Step 2: Cake Structure
  - Number of layers (1-5)
  - Size selection per layer
  - Height visualization

  Step 3: Flavors
  - Select flavor for each layer
  - Visual flavor preview

  Step 4: 3D Design
  - Interactive 3D cake model (Three.js / React Three Fiber)
  - Add candles (drag & drop)
  - Add decorations (toppers, flowers, etc.)
  - Rotate, zoom, pan

  Step 5: Frosting & Colors
  - Frosting type selection
  - Color picker for layers
  - Texture preview

  Step 6: Text & Details
  - Cake text input
  - Font selection
  - Text color & position

  Step 7: Special Instructions
  - Dietary restrictions
  - Special requests
  - Notes to baker

  Step 8: Review & Submit
  - Show estimated price
  - Summary of all selections
  - 3D preview images (capture from canvas)
  - Submit button

- Auto-save to session
- Generate 3D preview screenshots
- Upload to server
```

### 3. **Admin - Custom Cake Review Dashboard**
**File:** `client/cashieradmin/app/admin/custom-cakes/page.tsx`

```typescript
Features:
- List all custom cake requests
- Filter by status: pending_review, approved, rejected
- Sort by: submission date, pickup date
- Card view with:
  - Customer name
  - 3D preview images
  - Estimated price
  - Submission date
  - Quick approve/reject buttons

- Detail Modal:
  - Full 3D preview gallery
  - All specifications (layers, flavors, decorations)
  - Customer info & instructions
  - Estimated price breakdown
  - Actions:
    - Approve:
      - Set final price
      - Set preparation days
      - Set pickup date/time
      - Send approval notification
    - Reject:
      - Provide rejection reason
      - Send rejection notification
    - Request More Info (optional)
```

### 4. **Cashier - Custom Order Processing**
**File:** `client/cashieradmin/app/cashier/custom-orders/page.tsx`

```typescript
Features:
- List approved custom cakes
- Filter by status: approved, paid, preparing, ready
- Show:
  - Customer name & contact
  - Pickup date/time
  - Price
  - Payment status
  - Preview images

- Actions:
  - Process payment
  - Print order ticket
  - Mark as preparing / ready / completed
  - Contact customer
```

---

## 🔧 Backend API Endpoints

### Custom Cake Request APIs

```typescript
// 1. Generate QR Code Session
POST /api/kiosk/custom-cake/generate-qr
Response: {
  sessionToken: string,
  qrCodeUrl: string,
  editorUrl: string,
  expiresIn: number
}

// 2. Validate Session
GET /api/custom-cake/session/:token
Response: {
  valid: boolean,
  requestId: number | null
}

// 3. Get Design Options (flavors, themes, etc.)
GET /api/custom-cake/options
Response: {
  flavors: Flavor[],
  sizes: Size[],
  themes: Theme[],
  frostingTypes: string[],
  candleTypes: string[]
}

// 4. Save Draft (auto-save)
POST /api/custom-cake/save-draft
Body: {
  sessionToken: string,
  data: CustomCakeDesign
}

// 5. Upload 3D Preview Images
POST /api/custom-cake/upload-images
Body: FormData with images

// 6. Submit for Review
POST /api/custom-cake/submit
Body: {
  sessionToken: string,
  customerInfo: CustomerInfo,
  design: CustomCakeDesign,
  imageUrls: string[]
}
Response: {
  requestId: number,
  estimatedPrice: number,
  status: 'pending_review'
}

// 7. Admin - Get Pending Requests
GET /api/admin/custom-cakes/pending
Response: {
  requests: CustomCakeRequest[]
}

// 8. Admin - Get Request Details
GET /api/admin/custom-cakes/:requestId
Response: {
  request: CustomCakeRequest,
  images: Image[],
  estimatedCost: CostBreakdown
}

// 9. Admin - Approve Request
POST /api/admin/custom-cakes/:requestId/approve
Body: {
  approvedPrice: number,
  preparationDays: number,
  pickupDate: string,
  pickupTime: string,
  adminNotes: string
}

// 10. Admin - Reject Request
POST /api/admin/custom-cakes/:requestId/reject
Body: {
  rejectionReason: string
}

// 11. Customer - Check Status
GET /api/custom-cake/status/:requestId
Response: {
  status: string,
  approvedPrice: number | null,
  pickupDate: string | null,
  rejectionReason: string | null
}

// 12. Cashier - Get Approved Orders
GET /api/cashier/custom-cakes/approved
Response: {
  orders: ApprovedCustomCake[]
}

// 13. Cashier - Process Payment
POST /api/cashier/custom-cakes/:requestId/process-payment
Body: {
  paymentMethod: string,
  amountPaid: number
}
```

---

## 🎨 3D Editor Technology Stack

### Recommended Libraries:

1. **Three.js / React Three Fiber**
   - 3D rendering engine
   - Interactive 3D models

2. **Drei (React Three Fiber helpers)**
   - Pre-built 3D components
   - Camera controls, environment

3. **Leva / React GUI**
   - Control panel for adjustments

4. **html2canvas / Canvas API**
   - Capture 3D screenshots

### 3D Models Needed:
```
- Base cake cylinder (customizable height/diameter)
- Candles (number, regular, sparkler)
- Toppers (star, heart, character figures)
- Flowers (roses, daisies, generic)
- Frosting textures
- Text mesh (3D text on cake)
```

---

## 📱 Mobile Responsive Design

### Editor UI Layout:
```
┌──────────────────────────────────┐
│        HEADER                     │
│  Golden Munch - Custom Cake       │
│  Step 3 of 8: Cake Structure      │
└──────────────────────────────────┘
│                                   │
│    ┌─────────────────────┐       │
│    │                      │       │
│    │   3D CAKE PREVIEW    │       │
│    │   (Interactive)      │       │
│    │                      │       │
│    └─────────────────────┘       │
│                                   │
│  [Rotate] [Zoom In] [Zoom Out]   │
│                                   │
│  ┌──────────────────────────┐    │
│  │ Controls                  │    │
│  │                           │    │
│  │ Number of Layers: [3]     │    │
│  │ [1] [2] [3] [4] [5]       │    │
│  │                           │    │
│  │ Base Size: [Medium]       │    │
│  │                           │    │
│  └──────────────────────────┘    │
│                                   │
│  [Back]            [Next Step →] │
└──────────────────────────────────┘
```

---

## 🔔 Notification System

### Customer Notifications:

1. **Request Submitted**
   ```
   Subject: Custom Cake Request Received

   Hi [Customer Name],

   Your custom cake request has been received!
   Request ID: #CCR-12345

   Our team will review your design and get back to you within 24 hours.

   You can check status at: [Link]
   ```

2. **Request Approved**
   ```
   Subject: Custom Cake Request APPROVED! 🎉

   Hi [Customer Name],

   Great news! Your custom cake has been approved!

   Final Price: ₱[Amount]
   Pickup Date: [Date] at [Time]

   Please complete payment: [Payment Link]
   ```

3. **Request Rejected**
   ```
   Subject: Custom Cake Request Update

   Hi [Customer Name],

   Unfortunately, we cannot fulfill your custom cake request.

   Reason: [Rejection Reason]

   Please contact us to discuss alternatives.
   ```

---

## ⏱️ Implementation Timeline

### Phase 1: Database & Backend (Day 1-2)
- [ ] Create new database tables
- [ ] Implement QR code generation API
- [ ] Build custom cake request APIs
- [ ] Admin approval APIs
- [ ] Notification system

### Phase 2: Kiosk Integration (Day 2)
- [ ] Custom cake start page
- [ ] QR code display component
- [ ] Session management

### Phase 3: 3D Editor (Day 3-5)
- [ ] Set up separate Next.js app
- [ ] Implement Three.js 3D scene
- [ ] Create multi-step wizard
- [ ] Build 3D cake model builder
- [ ] Implement save/submit functionality
- [ ] Screenshot capture & upload

### Phase 4: Admin Dashboard (Day 5-6)
- [ ] Custom cake review list
- [ ] Detail view with 3D preview
- [ ] Approve/reject modals
- [ ] Price & schedule setting
- [ ] Notification triggers

### Phase 5: Cashier Integration (Day 6)
- [ ] Approved orders list
- [ ] Payment processing
- [ ] Status updates

### Phase 6: Testing & Polish (Day 7)
- [ ] End-to-end testing
- [ ] Mobile responsiveness
- [ ] Error handling
- [ ] Performance optimization

---

## 🚀 Success Criteria

- ✅ QR code generates and displays on kiosk
- ✅ Mobile editor loads from QR scan
- ✅ 3D cake builder is interactive and smooth
- ✅ Design submits successfully with images
- ✅ Admin can review and approve/reject
- ✅ Customer receives notifications
- ✅ Cashier can process approved orders
- ✅ Full order lifecycle tracked

---

## 📊 Estimated Costs

### Development Time:
- Backend: 16 hours
- Frontend (Editor): 24 hours
- Admin Dashboard: 12 hours
- Testing: 8 hours
- **Total: ~60 hours (7-8 days)**

### 3D Models:
- Purchase or create basic 3D assets
- Estimated: $50-200 for model pack

---

## 🔐 Security Considerations

1. **Session Tokens:** Use UUID v4, expire after 15-30 minutes
2. **Rate Limiting:** Prevent QR generation spam
3. **Image Upload:** Validate file types, limit size (5MB)
4. **Input Validation:** Sanitize all user inputs
5. **Authentication:** Admin/Cashier must be authenticated

---

## 📝 Next Steps

1. **Immediate:** Create database migration for new tables
2. **Then:** Implement backend APIs
3. **Finally:** Build frontend components

**Ready to start implementation?** 🚀

---

**Status:** ✅ Planning Complete
**Last Updated:** November 23, 2025
