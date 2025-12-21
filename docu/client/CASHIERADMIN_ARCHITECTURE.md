# CashierAdmin Client - Complete Architecture Documentation

## Table of Contents
1. [Overview](#overview)
2. [Technology Stack](#technology-stack)
3. [Dependencies](#dependencies)
4. [Directory Structure](#directory-structure)
5. [Pages and Routes](#pages-and-routes)
6. [Major Features](#major-features)
7. [Authentication & Authorization](#authentication--authorization)
8. [Payment Integration](#payment-integration)
9. [Components](#components)
10. [API Integration](#api-integration)
11. [Type System](#type-system)
12. [Configuration](#configuration)
13. [How Functions Work](#how-functions-work)

---

## Overview

The **CashierAdmin** client is a comprehensive web application built with **Next.js 15** that provides both cashier and administrative interfaces for the GoldenMunch POS system. It features dual login systems, role-based access control, and complete business management capabilities.

**Location:** `/client/cashieradmin`

**Two User Roles:**
1. **Cashier** - Order processing, payment verification, customer service
2. **Admin** - Full system management, analytics, menu configuration

---

## Technology Stack

### Core Framework
- **Next.js 15.3.1** - React framework with App Router
- **React 18.3.1** - UI library
- **TypeScript 5.6.3** - Type safety

---

## Dependencies

### UI Component Library - HeroUI

**40+ Components:**
```json
{
  "@heroui/accordion": "^3.2.9",
  "@heroui/alert": "^3.3.5",
  "@heroui/autocomplete": "^3.2.15",
  "@heroui/avatar": "^3.2.9",
  "@heroui/badge": "^3.2.9",
  "@heroui/button": "^3.2.9",
  "@heroui/card": "^3.2.11",
  "@heroui/chip": "^3.2.10",
  "@heroui/code": "^3.2.9",
  "@heroui/divider": "^3.2.9",
  "@heroui/drawer": "^3.2.9",
  "@heroui/dropdown": "^3.3.5",
  "@heroui/form": "^3.3.5",
  "@heroui/image": "^3.2.9",
  "@heroui/input": "^3.3.1",
  "@heroui/kbd": "^3.2.9",
  "@heroui/link": "^3.2.10",
  "@heroui/listbox": "^3.2.12",
  "@heroui/modal": "^3.2.12",
  "@heroui/navbar": "^3.2.11",
  "@heroui/pagination": "^3.2.12",
  "@heroui/popover": "^3.2.14",
  "@heroui/progress": "^3.2.10",
  "@heroui/radio": "^3.3.1",
  "@heroui/scroll-shadow": "^3.2.10",
  "@heroui/select": "^3.3.1",
  "@heroui/skeleton": "^3.2.10",
  "@heroui/snippet": "^3.2.10",
  "@heroui/spacer": "^3.2.9",
  "@heroui/spinner": "^3.2.9",
  "@heroui/switch": "^3.2.10",
  "@heroui/system": "^3.3.3",
  "@heroui/table": "^3.2.12",
  "@heroui/tabs": "^3.2.12",
  "@heroui/theme": "^3.3.3",
  "@heroui/toast": "^3.2.9",
  "@heroui/tooltip": "^3.2.12",
  "@heroui/user": "^3.2.10"
}
```

### Styling & Animation
```json
{
  "tailwindcss": "4.1.11",
  "tailwind-variants": "3.1.1",
  "framer-motion": "11.18.2",
  "next-themes": "0.4.6",
  "clsx": "2.1.1"
}
```

### Icons
```json
{
  "@heroicons/react": "2.2.0"
}
```

### HTTP Client
```json
{
  "axios": "1.6.0"
}
```

### Development Tools
```json
{
  "eslint": "9.25.1",
  "prettier": "3.5.3",
  "typescript-eslint": "8.34.1"
}
```

---

## Directory Structure

```
/client/cashieradmin/
├── app/                      # Next.js App Router pages
│   ├── admin/               # Admin-only pages
│   │   ├── analytics/       # Sales analytics & reports
│   │   ├── cake/           # Cake flavor & size management
│   │   ├── cashiers/       # Cashier management
│   │   ├── categories/     # Menu categories
│   │   ├── custom-cakes/   # Custom cake request review
│   │   ├── customers/      # Customer management
│   │   ├── discounts/      # Discount type management
│   │   ├── feedback/       # Customer feedback
│   │   ├── inventory/      # Stock management
│   │   ├── menu/           # Menu item management
│   │   ├── promotions/     # Promotional campaigns
│   │   ├── refunds/        # Refund requests
│   │   ├── settings/       # System settings
│   │   │   └── payment-qr/ # Payment QR code upload
│   │   ├── suppliers/      # Supplier management
│   │   ├── tax/           # Tax configuration
│   │   ├── transactions/   # Transaction history
│   │   └── waste/         # Waste tracking
│   ├── cashier/            # Cashier-only pages
│   │   ├── custom-cakes/   # Custom cake payment processing
│   │   ├── new-order/      # Create new orders
│   │   └── orders/         # Unified orders & payment verification
│   ├── dashboard/          # Shared dashboard (role-based)
│   ├── login/             # Dual authentication page
│   ├── layout.tsx         # Root layout
│   ├── providers.tsx      # Context providers
│   └── error.tsx          # Error boundary
│
├── components/            # Reusable React components
│   ├── AnimatedBackground.tsx
│   ├── ImageLightbox.tsx
│   ├── navbar.tsx
│   ├── sidebar.tsx
│   ├── theme-switch.tsx
│   └── protected-route.tsx
│
├── contexts/             # React Context providers
│   └── AuthContext.tsx   # Authentication state management
│
├── services/            # API service layer (19 services)
│   ├── analytics.service.ts
│   ├── auth.service.ts
│   ├── cake.service.ts
│   ├── cashier.service.ts
│   ├── customCakeCashier.service.ts
│   ├── customCakeRequest.service.ts
│   ├── customer.service.ts
│   ├── discount.service.ts
│   ├── feedback.service.ts
│   ├── inventory.service.ts
│   ├── menu.service.ts
│   ├── order.service.ts
│   ├── printer.service.ts
│   ├── promotion.service.ts
│   ├── refund.service.ts
│   ├── settings.service.ts
│   ├── supplier.service.ts
│   ├── tax.service.ts
│   └── waste.service.ts
│
├── types/               # TypeScript type definitions
│   └── api.ts          # Complete API types (1010 lines)
│
├── lib/                # Utility libraries
│   └── api-client.ts   # Axios HTTP client wrapper
│
├── utils/              # Helper utilities
│   └── imageUtils.ts   # Image URL formatting
│
├── config/             # Configuration files
│   ├── site.ts
│   └── fonts.ts
│
├── styles/             # Global styles
├── public/             # Static assets
├── next.config.js      # Next.js configuration
├── tailwind.config.ts  # Tailwind CSS configuration
├── tsconfig.json       # TypeScript configuration
├── package.json        # Dependencies
└── .env.example        # Environment template
```

---

## Pages and Routes

### Authentication
- **`/login`** - Dual login system
  - Admin tab: username + password
  - Cashier tab: cashier code + 4-digit PIN

### Shared Routes
- **`/dashboard`** - Role-based dashboard
  - Today's order statistics
  - Revenue tracking
  - Customer count
  - Average order value
  - Recent orders list

### Cashier Routes (`/cashier/*`)

**1. `/cashier/new-order`** - Create Walk-In Orders
- **Features:**
  - Menu item selection with search
  - Category filtering
  - Shopping cart management
  - Quantity adjustment
  - Customer discount application
  - Payment method selection
  - Real-time total calculation
  - Special instructions field

**2. `/cashier/orders`** - Unified Order & Payment Management
- **Three-Tab Interface:**
  - **Pending Payments:** Orders awaiting payment verification
  - **Active Orders:** Confirmed orders in progress
  - **Completed Orders:** Finished orders

- **Features:**
  - Payment verification with QR upload
  - Order status updates (confirmed → preparing → ready → completed)
  - Order timeline tracking
  - Discount application at payment
  - Reference number entry (GCash/PayMaya)
  - Auto-refresh every 10 seconds
  - Search by order number
  - Filter by date range
  - Pagination

**3. `/cashier/custom-cakes`** - Custom Cake Payments
- View approved custom cake requests
- Process payments
- Payment method selection
- Change calculation
- Pickup scheduling information
- Customer contact details

### Admin Routes (`/admin/*`)

**1. `/admin/analytics`** - Sales Analytics
- **Metrics:**
  - Total revenue (date range)
  - Order count
  - Average order value
  - Top-selling items (with quantities)
  - Payment method breakdown
  - Waste cost analysis
  - Trending items

- **Features:**
  - Date range filtering
  - Export to CSV
  - Visual charts
  - Popularity score calculation

**2. `/admin/menu`** - Menu Item Management
- **Features:**
  - Full CRUD operations
  - Image upload (drag & drop)
  - Stock management
  - Infinite stock option
  - Price history management
  - Category assignment (many-to-many)
  - Bulk operations (delete, status change)
  - Search & filtering
  - Pagination (10/25/50/100 per page)
  - Quick stock adjustment (+/-)
  - Featured item toggle
  - Analytics dashboard (inventory value, alerts)

**3. `/admin/categories`** - Category Management
- Create/edit/delete categories
- Category images
- Active/inactive status
- Item assignment

**4. `/admin/discounts`** - Customer Discount Types
- Create discount types (Senior, PWD, Student, etc.)
- Percentage-based discounts
- ID verification requirements
- Active/inactive status
- Usage statistics

**5. `/admin/cashiers`** - Cashier Account Management
- Create/edit/delete cashiers
- Generate unique cashier codes
- Set 4-digit PINs
- Active/inactive status
- Performance tracking

**6. `/admin/custom-cakes`** - Custom Cake Request Review
- **Pending Requests:**
  - Customer details
  - Design specifications
  - 3D preview images (multi-angle)
  - Layer details (flavors, sizes)
  - Decorations & text
  - Special instructions

- **Actions:**
  - Approve with pricing
  - Set preparation time
  - Set pickup date
  - Reject with reason

- **All Requests:**
  - Filter by status (pending, approved, rejected, paid, completed)
  - Search by customer name
  - Date range filtering

**7. `/admin/settings/payment-qr`** - Payment QR Management
- Upload GCash QR code
- Upload PayMaya QR code
- Preview current QR codes
- Replace existing QR codes

**8. `/admin/transactions`** - Transaction History
- All payment transactions
- Filter by payment method
- Date range filtering
- Export to CSV

**9. `/admin/inventory`** - Inventory Management
- **Alerts:**
  - Low stock items
  - Out of stock items
  - Expiring items
  - Acknowledge alerts

- **Adjustments:**
  - Adjust stock quantities
  - Stock adjustment reasons
  - Transaction history
  - Inventory value calculation

**10. `/admin/promotions`** - Promotional Campaigns
- Create promotions (percentage, fixed amount, buy-X-get-Y)
- Set date ranges
- Assign items/categories
- Track usage
- Active/inactive status

**11. `/admin/refunds`** - Refund Request Management
- Review refund requests
- Approve/reject
- Process refunds
- Refund reasons
- Refund method tracking

**12. `/admin/feedback`** - Customer Feedback
- View all feedback
- Rating statistics
- Respond to feedback
- Filter by rating

**13. `/admin/customers`** - Customer Database
- Customer records
- Contact information
- Order history
- Loyalty points (future)

**14. `/admin/suppliers`** - Supplier Management
- Supplier database
- Contact details
- Product categories
- Active/inactive status

**15. `/admin/tax`** - Tax Configuration
- Tax rules
- Percentage or fixed amount
- Apply to categories/items

**16. `/admin/waste`** - Waste Tracking
- Record waste entries
- Waste reasons (expired, damaged, etc.)
- Quantity tracking
- Cost calculation
- Waste summary reports

**17. `/admin/cake`** - Cake Configuration
- **Flavors:**
  - Create/edit flavors
  - Upload images
  - Set pricing
  - Active/inactive status

- **Sizes:**
  - Create/edit sizes
  - Set servings
  - Price multipliers
  - Active/inactive status

---

## Major Features

### Cashier-Specific Features

**✅ Order Creation**
- Walk-in order processing
- Menu item selection
- Shopping cart management
- Customer discount application
- Multi-method payment

**✅ Payment Verification**
- Verify pending payments
- Upload payment QR/proof
- Reference number tracking
- Discount application
- Change calculation

**✅ Order Management**
- Status progression (pending → confirmed → preparing → ready → completed)
- Order timeline tracking
- Special instructions
- Real-time updates

**✅ Custom Cake Payments**
- View approved requests
- Process payments
- Pickup scheduling

**✅ Receipt Printing**
- Electron integration
- Thermal printer support
- Order verification codes

### Admin-Specific Features

**✅ Menu Management**
- Full CRUD operations
- Image upload
- Price history
- Stock management
- Category assignment
- Bulk operations

**✅ Analytics & Reporting**
- Sales analytics
- Trending items
- Payment method breakdown
- Waste reports
- Inventory value

**✅ Custom Cake Approval**
- Review pending requests
- Approve with pricing
- Set pickup dates
- Reject with reason

**✅ System Configuration**
- Payment QR codes
- Discount types
- Tax rules
- Cashier accounts
- Supplier management

**✅ Inventory Control**
- Stock alerts
- Manual adjustments
- Transaction history
- Waste tracking

**✅ Customer Service**
- Feedback review
- Refund processing
- Customer database

---

## Authentication & Authorization

### Authentication Architecture

**File:** `contexts/AuthContext.tsx`

**Context Interface:**
```typescript
interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}
```

**User Interface:**
```typescript
interface AuthUser {
  id: number;
  username?: string;          // Admin only
  name: string;
  email?: string;             // Admin only
  type: 'admin' | 'cashier';
  role_id?: number;
  cashier_code?: string;      // Cashier only
}
```

### Login System

**Admin Login:**
```typescript
POST /api/auth/admin/login
Body: {
  username: string,
  password: string
}
Response: {
  token: string,
  user: AuthUser
}
```

**Cashier Login:**
```typescript
POST /api/auth/cashier/login
Body: {
  cashier_code: string,
  pin: string  // 4-digit PIN
}
Response: {
  token: string,
  user: AuthUser
}
```

### Token Storage

**LocalStorage:**
- `auth_token` - JWT token
- `auth_user` - User object (JSON)

**Token Format:**
- Bearer token
- Sent in `Authorization` header
- Auto-injected by Axios interceptor

### Authorization Levels

**Route Protection:**
- **Admin-only routes:** `/admin/*` require `type === 'admin'`
- **Cashier routes:** `/cashier/*` accessible by both admin and cashier
- **Shared routes:** `/dashboard` adapts to user type

**Sidebar Navigation:**
- Dynamically rendered based on user type
- Admin sees full menu
- Cashier sees limited menu

### Session Management

**Token Verification:**
```typescript
GET /api/auth/verify
Headers: { Authorization: 'Bearer TOKEN' }
Response: {
  valid: boolean,
  user: AuthUser
}
```

**Auto-Logout:**
- 401 responses trigger automatic logout
- Redirects to login page
- Clears localStorage

**Password Management (Admin):**
```typescript
PUT /api/auth/admin/username
PUT /api/auth/admin/password
```

---

## Payment Integration

### Payment Methods Supported

```typescript
enum PaymentMethod {
  CASH = 'cash',
  GCASH = 'gcash',
  PAYMAYA = 'paymaya',
  CARD = 'card',
  BANK_TRANSFER = 'bank_transfer',
  LOYALTY_POINTS = 'loyalty_points'
}
```

### Payment Verification Flow

**API Endpoint:**
```typescript
POST /api/cashier/payment/verify
```

**Without QR Upload:**
```typescript
Body: {
  order_id: number,
  payment_method: PaymentMethod,
  reference_number?: string,    // For digital payments
  amount_tendered?: number,      // For cash
  customer_discount_type_id?: number
}
```

**With QR Upload:**
```typescript
FormData: {
  order_id: number,
  payment_method: string,
  reference_number?: string,
  qr_code: File,                // Image file
  customer_discount_type_id?: number
}
```

### Payment Status Enum

```typescript
enum PaymentStatus {
  UNPAID = 'unpaid',
  PENDING = 'pending',
  PARTIAL = 'partial',
  PARTIAL_PAID = 'partial_paid',
  PAID = 'paid',
  FAILED = 'failed',
  REFUNDED = 'refunded'
}
```

### Payment Workflow

**Step-by-Step:**

1. **Order Creation**
   - Cashier creates order
   - Status: `pending`
   - Payment status: `unpaid`

2. **Payment Selection**
   - Cashier selects payment method
   - For cash: enters amount tendered
   - For digital: enters reference number

3. **Discount Application (Optional)**
   - Select discount type
   - Verify customer ID
   - Discount applied to total

4. **QR Code Upload (Optional)**
   - For GCash/PayMaya
   - Proof of payment
   - Stored on server

5. **Verification**
   - Server validates payment
   - Updates order status → `confirmed`
   - Payment status → `paid`

6. **Receipt Printing**
   - Automatic receipt generation
   - Verification code displayed
   - Reference number included

### Cash Handling

**Change Calculation:**
```typescript
const calculateChange = (amountTendered: number, total: number): number => {
  return Math.max(0, amountTendered - total);
};
```

**Validation:**
```typescript
// Ensure sufficient payment
if (paymentMethod === 'cash' && amountTendered < finalTotal) {
  throw new Error('Insufficient amount tendered');
}
```

### Digital Payment Integration

**GCash/PayMaya:**
- Reference number required (min 5 characters)
- QR code upload optional but recommended
- Server validates reference format

**Payment QR Display:**
- Admin uploads merchant QR codes
- Displayed at checkout
- Customer scans to pay

---

## Components

### Core Components

**Sidebar** (`components/sidebar.tsx`)
- Role-based navigation
- Collapsible design
- Active route highlighting
- User profile display
- Logout button

**Navbar** (`components/navbar.tsx`)
- App branding
- Theme switcher
- User menu

**ProtectedRoute** (`components/protected-route.tsx`)
- Authentication check
- Auto-redirect to login
- Role-based access control

**ThemeSwitch** (`components/theme-switch.tsx`)
- Dark/Light mode toggle
- Persistent preference

**AnimatedBackground** (`components/AnimatedBackground.tsx`)
- Decorative background animations
- Gradient effects

**ImageLightbox** (`components/ImageLightbox.tsx`)
- Full-screen image viewer
- Navigation controls

---

## API Integration

### API Client

**File:** `lib/api-client.ts`

**Base Configuration:**
```typescript
{
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 60000,  // 60 seconds
  headers: {
    'Content-Type': 'application/json'
  }
}
```

**Request Interceptor:**
```typescript
axios.interceptors.request.use(config => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

**Response Interceptor:**
```typescript
axios.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      // Auto-logout on unauthorized
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

**Methods:**
```typescript
apiClient.get<T>(url, config)
apiClient.post<T>(url, data, config)
apiClient.put<T>(url, data, config)
apiClient.patch<T>(url, data, config)
apiClient.delete<T>(url, config)
apiClient.postFormData<T>(url, formData)  // For file uploads
apiClient.putFormData<T>(url, formData)
```

### Service Layer

**19 Service Files:**

1. **auth.service.ts** - Login, logout, token verification
2. **order.service.ts** - Order CRUD, status updates
3. **menu.service.ts** - Menu item management
4. **discount.service.ts** - Discount type operations
5. **analytics.service.ts** - Sales analytics, reports
6. **cashier.service.ts** - Cashier management
7. **customer.service.ts** - Customer database
8. **promotion.service.ts** - Promotional campaigns
9. **refund.service.ts** - Refund processing
10. **feedback.service.ts** - Customer feedback
11. **inventory.service.ts** - Stock management
12. **supplier.service.ts** - Supplier database
13. **tax.service.ts** - Tax configuration
14. **waste.service.ts** - Waste tracking
15. **cake.service.ts** - Cake flavors & sizes
16. **customCakeRequest.service.ts** - Admin cake review
17. **customCakeCashier.service.ts** - Cashier cake payment
18. **settings.service.ts** - System settings
19. **printer.service.ts** - Receipt printing (Electron)

**Service Pattern:**
```typescript
export class OrderService {
  static async getOrders(params: any): Promise<ApiResponse<Order[]>> {
    return apiClient.get<Order[]>('/cashier/orders', { params });
  }

  static async updateStatus(
    orderId: number,
    status: OrderStatus
  ): Promise<ApiResponse<void>> {
    return apiClient.patch<void>(
      `/cashier/orders/${orderId}/status`,
      { status }
    );
  }
}
```

---

## Type System

### Complete Type Definitions

**File:** `types/api.ts` (1010 lines)

**40+ Entity Interfaces:**
- MenuItem, Category, MenuItemPrice
- CustomerOrder, OrderItem, OrderTimelineEntry
- Customer, Cashier, Admin, Role
- PromotionRule, CustomerDiscountType
- CakeFlavor, CakeSize, CustomCakeTheme
- CustomCakeRequest, QRCodeSession
- InventoryAlert, InventoryTransaction
- RefundRequest, WasteTracking
- PaymentTransaction, KioskSetting

**20+ Enums:**
- ItemType, OrderType, OrderStatus
- PaymentMethod, PaymentStatus
- PromotionType, TaxType
- FrostingType, DesignComplexity
- RefundType, RefundReason, RefundStatus
- WasteReason, AlertType
- And more...

**Request/Response DTOs:**
- LoginRequest
- CreateMenuItemRequest
- UpdateOrderStatusRequest
- VerifyPaymentRequest
- CreateRefundRequest
- And 30+ more...

---

## Configuration

### Environment Variables

**`.env.example`:**
```bash
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:5000/api

# Application Settings
NEXT_PUBLIC_APP_NAME=GoldenMunch Admin
NEXT_PUBLIC_ENVIRONMENT=development

# Feature Flags
NEXT_PUBLIC_ENABLE_ANALYTICS=true
NEXT_PUBLIC_ENABLE_DEBUG=true
```

### Next.js Configuration

```javascript
{
  eslint: {
    ignoreDuringBuilds: true
  },
  images: {
    remotePatterns: [
      'http://localhost:3001/uploads/**',
      'http://localhost:5000/uploads/**',
      'https://*.render.com/uploads/**'
    ]
  }
}
```

### Tailwind Configuration

**Custom Theme:**
```javascript
colors: {
  'cream-white': '#FEFAF6',
  'soft-sand': '#F5F1ED',
  'warm-beige': '#EDE8E3',
  'light-caramel': '#E8D5C4',
  'muted-clay': '#C9A88A',
  'warm-brown': '#8B7355',
  'rich-brown': '#5D4E37'
}
```

---

## How Functions Work

### 1. Order Creation Flow

```typescript
// Cashier selects menu items and creates order
const handleCreateOrder = async () => {
  // 1. Prepare order data
  const orderData = {
    order_type: 'walk_in',
    order_source: 'cashier',
    items: cartItems.map(item => ({
      menu_item_id: item.id,
      quantity: item.quantity,
      unit_price: item.price
    })),
    payment_method: selectedPaymentMethod,
    customer_discount_type_id: selectedDiscountId,
    special_instructions: notes
  };

  // 2. Call API
  const response = await OrderService.createOrder(orderData);

  if (response.success) {
    // 3. Clear cart
    clearCart();

    // 4. Navigate to orders page
    router.push('/cashier/orders');

    // 5. Show success message
    toast.success(`Order #${response.data.order_number} created!`);
  }
};
```

### 2. Payment Verification Flow

```typescript
// Cashier verifies payment for pending order
const handleVerifyPayment = async (order: Order) => {
  // 1. Validate inputs
  if (paymentMethod === 'cash' && amountTendered < order.total_amount) {
    toast.error('Insufficient amount tendered');
    return;
  }

  if (['gcash', 'paymaya'].includes(paymentMethod) && !referenceNumber) {
    toast.error('Reference number required');
    return;
  }

  // 2. Prepare payment data
  let verifyData: any = {
    order_id: order.id,
    payment_method: paymentMethod,
    reference_number: referenceNumber,
    amount_tendered: amountTendered,
    customer_discount_type_id: selectedDiscountId
  };

  // 3. Upload QR code if provided
  if (qrCodeFile) {
    const formData = new FormData();
    Object.keys(verifyData).forEach(key => {
      formData.append(key, verifyData[key]);
    });
    formData.append('qr_code', qrCodeFile);

    await OrderService.verifyPaymentWithQR(formData);
  } else {
    await OrderService.verifyPayment(verifyData);
  }

  // 4. Show success and calculate change
  if (paymentMethod === 'cash') {
    const change = amountTendered - order.total_amount;
    toast.success(`Payment verified! Change: ₱${change.toFixed(2)}`);
  } else {
    toast.success('Payment verified!');
  }

  // 5. Print receipt (if Electron)
  if (window.electron) {
    window.electron.printer.printReceipt(order);
  }

  // 6. Refresh orders list
  fetchOrders();
};
```

### 3. Custom Cake Approval Flow

```typescript
// Admin approves custom cake request
const handleApprove = async (request: CustomCakeRequest) => {
  // 1. Calculate pricing
  const basePrice = calculateBasePrice(request);
  const complexityCost = getComplexityCost(request.design_complexity);
  const totalPrice = basePrice + complexityCost;

  // 2. Set preparation time
  const prepDays = getPreparationDays(request.design_complexity);
  const pickupDate = addDays(new Date(), prepDays);

  // 3. Approve with pricing
  const response = await CustomCakeRequestService.approve(request.id, {
    approved_price: totalPrice,
    preparation_days: prepDays,
    pickup_date: pickupDate,
    admin_notes: approvalNotes
  });

  if (response.success) {
    // 4. Capacity slot automatically reserved by backend
    // 5. Email notification sent to customer
    toast.success('Custom cake request approved!');
    fetchPendingRequests();
  }
};
```

### 4. Menu Item Management

```typescript
// Admin creates/updates menu item
const handleSaveMenuItem = async () => {
  // 1. Validate form
  if (!name || !currentPrice) {
    toast.error('Name and price required');
    return;
  }

  // 2. Prepare FormData (for image upload)
  const formData = new FormData();
  formData.append('name', name);
  formData.append('description', description);
  formData.append('current_price', currentPrice.toString());
  formData.append('stock_quantity', stockQuantity.toString());
  formData.append('infinite_stock', infiniteStock.toString());

  if (imageFile) {
    formData.append('image', imageFile);
  }

  // 3. Create or update
  if (isEditMode) {
    await MenuService.updateMenuItem(itemId, formData);
    toast.success('Menu item updated!');
  } else {
    await MenuService.createMenuItem(formData);
    toast.success('Menu item created!');
  }

  // 4. Refresh menu list
  fetchMenuItems();
};
```

---

## Summary

The **CashierAdmin** client is a comprehensive, production-ready Point of Sale administration system with:

### Architecture
- **Next.js 15** with App Router
- **TypeScript** for type safety
- **HeroUI** component library (40+ components)
- **19 Service Modules** for complete API coverage
- **1010 Lines** of TypeScript type definitions

### Features
- **Dual Login System** - Admin and Cashier roles
- **Role-Based Access Control** - Dynamic routing and UI
- **Complete POS Features** - Orders, payments, inventory, analytics
- **Custom Cake Workflow** - Request review, approval, payment
- **Multi-Method Payments** - Cash, GCash, PayMaya, Card
- **Real-Time Updates** - Auto-refresh every 10 seconds
- **Receipt Printing** - Electron integration for thermal printers
- **Comprehensive Analytics** - Sales, trending items, waste reports
- **Modern UX** - Responsive design, animations, theming

### Deployment
- **Production-Ready** - Optimized builds
- **Environment-Based Config** - Development and production
- **Cloud Deployment** - Render.com support
- **Scalable Architecture** - Service layer pattern

The CashierAdmin client provides a powerful, intuitive interface for staff to manage all aspects of the GoldenMunch POS system, from daily order processing to comprehensive business analytics and system configuration.
