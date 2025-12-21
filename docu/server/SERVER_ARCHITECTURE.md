# GoldenMunch POS Server - Complete Architecture Documentation

## Table of Contents
1. [Overview](#overview)
2. [Technology Stack](#technology-stack)
3. [Directory Structure](#directory-structure)
4. [API Endpoints](#api-endpoints)
5. [Database Models](#database-models)
6. [Services](#services)
7. [Middleware & Utilities](#middleware--utilities)
8. [Authentication & Authorization](#authentication--authorization)
9. [File Upload & Storage](#file-upload--storage)
10. [Background Jobs](#background-jobs)
11. [External Integrations](#external-integrations)
12. [Environment Configuration](#environment-configuration)

---

## Overview

The GoldenMunch POS Server is a **Node.js + TypeScript** backend application built with **Express.js** that powers a comprehensive Point of Sale system for a bakery/restaurant business. It supports:

- Multi-channel ordering (kiosk, cashier, admin, mobile)
- Custom cake design workflow with QR-based mobile editor
- Inventory management with alerts
- Payment processing (Cash, GCash, PayMaya)
- Email notifications
- Scheduled tasks (cron jobs)
- Capacity management for custom orders
- Analytics and reporting

**Server Location:** `/server`

---

## Technology Stack

### Core Framework
- **Node.js** (v18+)
- **TypeScript 5.3.3** - Type safety and modern JavaScript features
- **Express.js 4.18.2** - Web application framework

### Database
- **MySQL2 3.6.5** - MySQL database driver with connection pooling
- **Supabase** - Cloud storage for images

### Authentication & Security
- **jsonwebtoken 9.0.2** - JWT token generation/verification
- **bcrypt 5.1.1** - Password hashing
- **helmet 7.1.0** - Security headers
- **express-rate-limit 7.1.5** - Rate limiting
- **cors 2.8.5** - Cross-origin resource sharing

### File Handling
- **multer 1.4.5** - File upload middleware
- **@supabase/supabase-js 2.88.0** - Supabase client for storage

### Email & Scheduling
- **nodemailer 7.0.11** - Email sending
- **node-cron 4.2.1** - Scheduled tasks

### Validation & Logging
- **joi 17.11.0** - Schema validation
- **winston 3.11.0** - Logging system

### Utilities
- **qrcode 1.5.4** - QR code generation
- **axios 1.6.0** - HTTP client for external APIs
- **compression 1.7.4** - Response compression
- **dotenv 16.3.1** - Environment variable management

### Development Tools
- **nodemon 3.0.2** - Auto-reload during development
- **ts-node 10.9.2** - TypeScript execution
- **jest 29.7.0** - Testing framework
- **supertest 6.3.3** - API testing

---

## Directory Structure

```
/server/
├── src/
│   ├── server.ts                 # Entry point
│   ├── app.ts                    # Express app configuration
│   ├── config/                   # Configuration modules
│   │   ├── database.ts           # MySQL connection pool
│   │   ├── supabase.ts           # Supabase client
│   │   └── multer.ts             # File upload config
│   ├── controllers/              # Request handlers (14 controllers)
│   │   ├── auth.controller.ts    # Authentication
│   │   ├── kiosk.controller.ts   # Kiosk operations
│   │   ├── order.controller.ts   # Order management
│   │   ├── admin.controller.ts   # Admin operations
│   │   ├── customCake.controller.ts (1,214 lines)
│   │   ├── additional.controller.ts
│   │   ├── promotion.controller.ts
│   │   ├── discount.controller.ts
│   │   ├── feedback.controller.ts
│   │   ├── refund.controller.ts
│   │   ├── waste.controller.ts
│   │   ├── capacity.controller.ts
│   │   ├── paymentQR.controller.ts
│   │   └── customCakeSession.controller.ts
│   ├── middleware/               # Express middleware
│   │   ├── auth.middleware.ts    # JWT authentication
│   │   ├── error.middleware.ts   # Error handling
│   │   └── validation.middleware.ts
│   ├── models/
│   │   └── types.ts              # TypeScript interfaces (723 lines)
│   ├── routes/
│   │   └── index.ts              # All API routes (628 lines)
│   ├── services/                 # Business logic
│   │   ├── email.service.ts      # Email notifications
│   │   ├── scheduler.service.ts  # Cron jobs
│   │   ├── payment.service.ts    # Payment gateways
│   │   └── capacity.service.ts   # Capacity management
│   ├── utils/                    # Helper utilities
│   │   ├── logger.ts             # Winston logger
│   │   ├── helpers.ts            # Common helpers
│   │   ├── supabaseUpload.ts     # File upload helpers
│   │   └── typeGuards.ts         # Type safety
│   ├── seeders/
│   │   └── seedAdminAndCashier.ts
│   └── scripts/
│       └── setupSupabaseStorage.ts
├── tests/                        # Test suites
├── package.json                  # Dependencies
├── tsconfig.json                 # TypeScript config
└── .env.example                  # Environment template
```

---

## API Endpoints

All routes defined in `/server/src/routes/index.ts` (628 lines)

### Public Routes

#### Health & Info
- `GET /api` - API information (HTML or JSON)
- `GET /api/health` - Health check

#### Authentication
- `POST /api/auth/admin/login` - Admin login
- `POST /api/auth/cashier/login` - Cashier login (4-digit PIN)
- `GET /api/auth/verify` - Verify JWT token
- `PUT /api/auth/admin/username` - Update admin username
- `PUT /api/auth/admin/password` - Update admin password

### Kiosk Routes (Public/Optional Auth)

#### Menu & Categories
- `GET /api/kiosk/menu` - Get all menu items
- `GET /api/kiosk/menu/:id` - Get item details
- `GET /api/kiosk/categories` - Get all categories
- `GET /api/kiosk/promotions` - Get active promotions
- `GET /api/kiosk/capacity/check` - Check custom cake capacity

#### Orders
- `POST /api/kiosk/orders` - Create new order
- `GET /api/kiosk/orders/id/:id` - Get order by ID
- `GET /api/kiosk/orders/:code` - Get order by verification code
- `POST /api/kiosk/orders/:id/mark-qr-scanned` - Mark QR as scanned

#### Custom Cake - QR Session Flow
- `POST /api/kiosk/custom-cake/generate-qr` - Generate QR for mobile
- `GET /api/kiosk/custom-cake/session/:token/poll` - Poll completion

#### Custom Cake - Mobile Editor
- `GET /api/custom-cake/session/:token` - Validate session
- `GET /api/custom-cake/options` - Get design options
- `POST /api/custom-cake/save-draft` - Auto-save customization
- `POST /api/custom-cake/upload-images` - Upload 3D previews
- `POST /api/custom-cake/submit` - Submit for admin review

#### Payment QR
- `GET /api/kiosk/payment-qr/:paymentMethod` - Get payment QR code

### Cashier Routes (Requires Auth)

#### Orders
- `POST /api/cashier/orders/verify` - Verify order by code
- `POST /api/cashier/payment/verify` - Verify payment (with QR upload)
- `GET /api/cashier/orders` - Get all orders
- `GET /api/cashier/orders/:id` - Get order details
- `PATCH /api/cashier/orders/:id/status` - Update order status

#### Operations
- `POST /api/cashier/waste` - Create waste entry
- `POST /api/cashier/feedback` - Submit feedback
- `POST /api/cashier/refund` - Create refund request
- `GET /api/cashier/discounts` - Get discount types

#### Custom Cakes
- `GET /api/cashier/custom-cakes/approved` - Get approved orders
- `POST /api/cashier/custom-cakes/:requestId/process-payment`

### Admin Routes (Requires Admin Auth)

#### Menu Management
- `POST /api/admin/menu` - Create menu item (with image)
- `PUT /api/admin/menu/:id` - Update menu item
- `DELETE /api/admin/menu/:id` - Delete menu item
- `POST /api/admin/menu/prices` - Add item price

#### Categories
- `POST /api/admin/categories` - Create category
- `PUT /api/admin/categories/:id` - Update category
- `DELETE /api/admin/categories/:id` - Delete category

#### Inventory
- `GET /api/admin/inventory/alerts` - Get alerts
- `POST /api/admin/inventory/adjust` - Adjust inventory

#### Analytics
- `GET /api/admin/analytics/sales` - Get sales analytics
- `GET /api/admin/analytics/trending` - Get trending items
- `GET /api/admin/analytics/waste` - Get waste report
- `GET /api/admin/stats/daily` - Get daily stats

#### Promotions & Discounts
- Full CRUD for promotions
- Full CRUD for discount types

#### Custom Cake Management
- `GET /api/admin/custom-cakes/pending` - Get pending requests
- `POST /api/admin/custom-cakes/:requestId/approve` - Approve
- `POST /api/admin/custom-cakes/:requestId/reject` - Reject

#### Capacity Management
- `GET /api/admin/capacity/available-dates`
- `POST /api/admin/capacity/set` - Set date capacity
- `POST /api/admin/capacity/block` - Block date

#### System
- Cashier management
- Customer management
- Supplier management
- Tax rules
- Settings
- Refunds
- Feedback
- Payment QR codes

---

## Database Models

All models defined in `/server/src/models/types.ts` (723 lines)

### Enums

**Item & Menu:**
- `ItemType`: cake, pastry, beverage, snack, main_dish, appetizer, dessert, bread, other
- `UnitOfMeasure`: piece, dozen, half_dozen, kilogram, gram, liter, milliliter
- `ItemStatus`: available, sold_out, discontinued
- `PriceType`: regular, promotion, seasonal, bulk

**Orders:**
- `OrderType`: walk_in, pickup, pre_order, custom_order
- `OrderSource`: kiosk, cashier, admin
- `PaymentMethod`: cash, gcash, paymaya, card, bank_transfer
- `PaymentStatus`: pending, partial_paid, paid, failed, refunded
- `OrderStatus`: pending, confirmed, preparing, ready, completed, cancelled

**Custom Cakes:**
- `FrostingType`: buttercream, fondant, whipped_cream, ganache, cream_cheese
- `DesignComplexity`: simple, moderate, complex, intricate

**Promotions:**
- `PromotionType`: percentage, fixed_amount, buy_x_get_y, bundle, seasonal

**Inventory:**
- `TransactionType`: in, out, adjustment, return, waste, transfer
- `AlertType`: low_stock, out_of_stock, expiring_soon
- `WasteReason`: expired, damaged, overproduction, quality_issue

### Key Database Tables

**User Management:**
- `Admin` - Admin accounts with bcrypt password_hash
- `Cashier` - Cashier accounts with bcrypt pin_hash
- `Customer` - Customer records

**Menu & Inventory:**
- `MenuItem` - Menu items with stock, pricing, popularity
- `Category` - Product categories
- `MenuItemPrice` - Price history with date ranges
- `InventoryTransaction` - Stock movements
- `InventoryAlert` - Low stock alerts
- `WasteTracking` - Waste records

**Orders & Payments:**
- `CustomerOrder` - Order records
- `OrderItem` - Order line items
- `PaymentTransaction` - Payment records
- `OrderTimeline` - Order status history

**Custom Cakes:**
- `CakeFlavor` - Available flavors with pricing
- `CakeSize` - Available sizes with servings
- `CustomCakeTheme` - Themes with images
- `CustomCakeDesign` - Design specifications
- `CustomCakeDailyCapacity` - Daily capacity by complexity
- `custom_cake_request` - Cake requests with layers, decorations
- `qr_code_sessions` - QR sessions for mobile editor

**Promotions & Discounts:**
- `PromotionRule` - Promotion definitions
- `CustomerDiscountType` - Discount types
- `PromotionUsageLog` - Usage tracking

**System:**
- `KioskSettings` - Kiosk configuration
- `payment_qr_codes` - Stored payment QR codes

---

## Services

### Email Service
**File:** `/server/src/services/email.service.ts`

**Features:**
- Nodemailer integration for SMTP
- Notification queue processing
- Pickup reminders
- Admin notifications for new custom cake requests
- Email retry mechanism

**Email Types:**
- New custom cake request (to admin)
- Request approval (to customer)
- Request rejection (to customer)
- Pickup reminders (to customer)

### Scheduler Service
**File:** `/server/src/services/scheduler.service.ts`

**Cron Jobs:**
1. **Process Pending Emails** - Every 5 minutes
2. **Retry Failed Emails** - Every hour
3. **Morning Pickup Reminders** - Daily at 9:00 AM
4. **Evening Pickup Reminders** - Daily at 6:00 PM

### Payment Service
**File:** `/server/src/services/payment.service.ts`

**Features:**
- GCash payment gateway integration
- PayMaya payment gateway integration
- Mock mode for development
- Payment verification
- Reference number validation

### Capacity Service
**File:** `/server/src/services/capacity.service.ts`

**Features:**
- Daily capacity management for custom cakes
- Slot reservation/release
- Date availability checking
- Pickup date suggestions based on complexity
- Preparation days calculation
- Capacity synchronization with orders

---

## Middleware & Utilities

### Authentication Middleware
**File:** `/server/src/middleware/auth.middleware.ts`

**Functions:**
- `authenticate()` - General JWT verification
- `authenticateAdmin()` - Admin-only routes
- `authenticateCashier()` - Cashier/Admin routes
- `optionalAuth()` - Optional auth for kiosk

### Validation Middleware
**File:** `/server/src/middleware/validation.middleware.ts`

**Features:**
- Joi schema validation
- Enum validation
- Predefined schemas for common operations

### Error Handling
**File:** `/server/src/middleware/error.middleware.ts`

**Classes:**
- `AppError` - Custom error with status code
- `notFound()` - 404 handler
- `errorHandler()` - Global error handler
- `asyncHandler()` - Async route wrapper

### Logger
**File:** `/server/src/utils/logger.ts`

**Features:**
- Winston logger with console and file transports
- Automatic log rotation (5MB max, 5 files)
- Graceful degradation for containerized environments

### Helpers
**File:** `/server/src/utils/helpers.ts`

**Key Functions:**
- `generateVerificationCode()` - 6-digit order codes
- `generateOrderNumber()` - Unique order numbers
- `successResponse()` / `errorResponse()` - API formatters
- `calculatePagination()` - Pagination metadata
- `formatCurrency()` - PHP currency formatting
- `calculateOrderTotal()` - Order calculations
- `toMySQLDate()` / `toMySQLDateTime()` - Date formatting
- `buildSafeUpdateQuery()` - SQL injection prevention

### Supabase Upload
**File:** `/server/src/utils/supabaseUpload.ts`

**Functions:**
- `uploadToSupabase()` - Upload file buffer
- `deleteFromSupabase()` - Delete file
- `replaceImage()` - Replace old with new
- `uploadProductImage()` - Products bucket
- `uploadPaymentQR()` - Payment-qr bucket
- `uploadSessionQR()` - Session-qr bucket

---

## Authentication & Authorization

### JWT-Based Authentication

**Three Separate JWT Secrets:**
- `JWT_SECRET` - General purpose
- `ADMIN_JWT_SECRET` - Admin tokens (fallback to JWT_SECRET)
- `CASHIER_JWT_SECRET` - Cashier tokens (fallback to JWT_SECRET)

**Token Expiration:**
- Admin: 8 hours (configurable)
- Cashier: 12 hours (configurable)

**JWT Payload:**
```typescript
{
  id: number;
  username?: string;
  email?: string;
  role?: string;
  type: 'admin' | 'cashier' | 'customer';
}
```

### Authentication Flow

1. Client sends credentials to login endpoint
2. Server validates credentials (bcrypt comparison)
3. Server generates JWT with appropriate secret
4. Client stores token
5. Client sends token in `Authorization: Bearer <token>` header
6. Middleware validates token on protected routes

### Role-Based Access Control

- **Admin routes:** `authenticateAdmin` middleware
- **Cashier routes:** `authenticateCashier` middleware (allows both)
- **Optional routes:** `optionalAuth` middleware (kiosk)

### Password Security

- Bcrypt hashing with salt rounds (10)
- Admins: username + password_hash
- Cashiers: cashier_code + pin_hash (4-digit PIN)

---

## File Upload & Storage

### Storage Backend: Supabase Storage

**Three Storage Buckets:**
1. `products` - Menu items, categories, flavors, themes
2. `payment-qr` - Payment QR codes
3. `session-qr` - Custom cake session QR codes

### Upload Configuration

**Multer Settings:**
- Memory storage (no local disk)
- File size limit: 10MB (configurable)
- Image filter: jpeg, jpg, png, gif, webp
- Multiple file support (max 5 files)

**Upload Process:**
1. Multer receives file in memory (Buffer)
2. File validation (type, size)
3. Generate unique filename: `{prefix}-{timestamp}-{random}{ext}`
4. Upload to Supabase Storage bucket
5. Get public URL
6. Store URL in database

---

## Background Jobs

### Scheduler Service
**File:** `/server/src/services/scheduler.service.ts`

**Scheduled Jobs (node-cron):**

1. **Process Pending Emails** - `*/5 * * * *` (Every 5 minutes)
   - Processes email notification queue
   - Sends pending notifications

2. **Retry Failed Emails** - `0 * * * *` (Every hour)
   - Retries failed email notifications
   - Max 20 retries per run
   - Only retries emails failed within last 24 hours

3. **Morning Pickup Reminders** - `0 9 * * *` (Daily at 9:00 AM)
   - Sends reminders for next-day pickups

4. **Evening Pickup Reminders** - `0 18 * * *` (Daily at 6:00 PM)
   - Second reminder for next-day pickups

**Features:**
- Start/stop individual jobs
- Manual trigger for testing
- Graceful shutdown on SIGTERM/SIGINT
- Auto-start on server initialization

---

## External Integrations

### 1. Supabase
**Config:** `/server/src/config/supabase.ts`

**Environment Variables:**
- `SUPABASE_URL` - Project URL
- `SUPABASE_SERVICE_KEY` - Service role key

**Features:**
- Storage API for file uploads
- Public URL generation
- Bucket management

### 2. MySQL Database
**Config:** `/server/src/config/database.ts`

**Connection Pool:**
- Connection limit: 10
- SSL support for cloud databases
- Auto-reconnect

**Environment Variables:**
- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
- `DB_SSL`, `DB_SSL_REJECT_UNAUTHORIZED`

### 3. Email Service (Nodemailer)

**Environment Variables:**
- `EMAIL_HOST` (default: smtp.gmail.com)
- `EMAIL_PORT` (default: 587)
- `EMAIL_SECURE`
- `EMAIL_USER`, `EMAIL_PASSWORD`
- `EMAIL_FROM_NAME`
- `ADMIN_EMAIL`

**Queue System:**
- Notifications stored in database
- Status: pending, sent, failed
- Automatic retry mechanism

### 4. Payment Gateways

**GCash:**
- `GCASH_API_URL`
- `GCASH_CLIENT_ID`
- `GCASH_CLIENT_SECRET`

**PayMaya:**
- `PAYMAYA_API_URL`
- `PAYMAYA_PUBLIC_KEY`
- `PAYMAYA_SECRET_KEY`

**Features:**
- Payment creation
- Payment verification
- Reference validation
- Mock mode for testing

### 5. QR Code Generation

**Library:** `qrcode`
- Generate QR codes as data URLs
- Customizable size (400x400)
- Custom colors (amber-600)
- Embedded in database

---

## Environment Configuration

### Required Variables

```env
# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=GoldenMunchPOS

# JWT Secrets
JWT_SECRET=your-secret-key
ADMIN_JWT_SECRET=admin-secret-key
CASHIER_JWT_SECRET=cashier-secret-key

# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=your-service-key

# Email (optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
ADMIN_EMAIL=admin@goldenmunch.com

# Payment Gateways (optional - mock mode if not set)
GCASH_API_URL=https://api.gcash.com
GCASH_CLIENT_ID=
GCASH_CLIENT_SECRET=
PAYMAYA_API_URL=https://api.paymaya.com
PAYMAYA_PUBLIC_KEY=
PAYMAYA_SECRET_KEY=

# Server
PORT=5000
HOST=localhost
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000,http://localhost:3001
BACKEND_URL=http://localhost:5000
MOBILE_EDITOR_URL=http://localhost:3001
```

### Security Configuration

**Rate Limiting:**
- General API: 100 requests per 15 minutes
- Auth endpoints: 5 attempts per 15 minutes

**CORS:**
- Whitelist of allowed origins
- Auto-allow for Vercel/Render preview deployments
- Mobile app support (no origin header)

**Security Headers (Helmet):**
- XSS protection
- Content security policy
- Cross-origin resource policy

---

## How Functions Work

### 1. Custom Cake Workflow

**Kiosk → Mobile Editor → Admin Review → Payment → Pickup**

1. Kiosk generates QR session (`POST /api/kiosk/custom-cake/generate-qr`)
   - Creates session token in database
   - Generates QR code with editor URL
   - Returns QR code data URL

2. Customer scans QR, opens mobile editor
3. Mobile validates session (`GET /api/custom-cake/session/:token`)
   - Checks token validity and expiration
   - Returns session status

4. Customer designs cake
   - Auto-saves every 3 seconds (`POST /api/custom-cake/save-draft`)
   - Uploads 3D preview images (`POST /api/custom-cake/upload-images`)

5. Customer submits (`POST /api/custom-cake/submit`)
   - Marks session as completed
   - Creates custom_cake_request record
   - Triggers admin notification email

6. Admin reviews (`GET /api/admin/custom-cakes/pending`)
7. Admin approves with pricing (`POST /api/admin/custom-cakes/:requestId/approve`)
   - Updates request status
   - Calculates pricing
   - Reserves capacity slot
   - Sends approval email to customer

8. Cashier processes payment
9. Order created and linked
10. Pickup reminders sent automatically (cron job)

### 2. Order Flow

**Create → Payment → Fulfillment → Completion**

1. Create order (`POST /api/kiosk/orders`)
   - Validates menu items and stock
   - Calculates totals
   - Generates verification code
   - Deducts stock automatically
   - Returns order with QR code

2. Customer pays (GCash/PayMaya/Cash)

3. Cashier verifies payment (`POST /api/cashier/payment/verify`)
   - Uploads payment proof (optional)
   - Validates payment amount/reference
   - Creates payment transaction
   - Updates order status to confirmed

4. Order status updates:
   - confirmed → preparing → ready → completed
   - Each status change creates timeline entry

### 3. Inventory Management

**Automatic Deduction → Alerts → Adjustments**

1. Order placed → stock deducted automatically
2. Low stock alert generated if below min_stock_level
3. Admin views alerts (`GET /api/admin/inventory/alerts`)
4. Admin adjusts inventory (`POST /api/admin/inventory/adjust`)
   - Transaction recorded with reason
   - Popularity score updated

### 4. Email Notification System

**Queue → Process → Send → Retry**

1. Event triggers notification (e.g., cake request submitted)
2. Notification added to database queue (status: pending)
3. Cron job processes queue every 5 minutes
4. Email sent via Nodemailer
5. Status updated (sent or failed)
6. Failed emails retried hourly (max 24 hours old)

---

## Scripts

### Database Management
- `npm run db:verify` - Verify database connection
- `npm run seed` - Seed database with sample data
- `npm run seed:credentials` - Seed admin credentials
- `npm run seed:admin` - Seed admin and cashier
- `npm run supabase:setup` - Setup Supabase storage buckets

### Development
- `npm run dev` - Start development server with nodemon
- `npm run build` - Compile TypeScript to JavaScript
- `npm run clean` - Remove dist folder
- `npm run rebuild` - Clean and build

### Production
- `npm start` - Run compiled server (dist/server.js)

### Testing
- `npm test` - Run all tests with coverage
- `npm run test:watch` - Watch mode
- `npm run test:unit` - Unit tests only
- `npm run test:integration` - Integration tests only

---

## Deployment

### Local Development
1. Install dependencies: `npm install`
2. Configure `.env` file
3. Setup database and run migrations
4. Seed initial data
5. Run: `npm run dev`

### Production (Render.com)
1. Build: `npm run build`
2. Start: `npm start`
3. Environment variables configured in Render dashboard
4. Auto-deploy on git push

### Docker
```dockerfile
# See Dockerfile in project root
```

---

## Summary

The GoldenMunch POS Server is a comprehensive, production-ready backend system with:

- **14 Controllers** handling all business logic
- **628 Lines** of API route definitions
- **723 Lines** of TypeScript type definitions
- **4 Core Services** for email, scheduling, payments, capacity
- **3-tier Authentication** with separate JWT secrets
- **Supabase Integration** for cloud file storage
- **Automated Background Jobs** for emails and reminders
- **Multi-gateway Payment Support** with fallback to mock mode
- **Advanced Custom Cake Workflow** with QR-based mobile design
- **Comprehensive Error Handling** and validation
- **Production-grade Security** with rate limiting, CORS, Helmet

The server is designed to scale horizontally and supports deployment on cloud platforms like Render.com, AWS, or containerized environments.
