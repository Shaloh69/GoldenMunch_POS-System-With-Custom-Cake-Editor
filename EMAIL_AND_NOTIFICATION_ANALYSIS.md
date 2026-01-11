# Email and Notification Workflow Analysis

## Complete System Documentation

This document provides a comprehensive analysis of the email and notification system across the GoldenMunch POS platform, examining both server-side and client-side implementations.

---

## 📋 Table of Contents

1. [Server-Side Architecture](#server-side-architecture)
2. [Client-Side Architecture](#client-side-architecture)
3. [Workflow Diagrams](#workflow-diagrams)
4. [Configuration](#configuration)
5. [Database Schema](#database-schema)
6. [Integration Points](#integration-points)

---

## 🖥️ SERVER-SIDE ARCHITECTURE

### 1. Email Service (`server/src/services/email.service.ts`)

**Purpose**: Core email functionality using Nodemailer with SMTP configuration.

#### Features:
- ✉️ Email sending via SMTP (Gmail, etc.)
- 📧 Pending notification processing
- 🔄 Retry mechanism for failed emails
- 📅 Scheduled pickup reminders
- 🔔 Admin notifications for new requests

#### Configuration:
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password_here
EMAIL_FROM_NAME=GoldenMunch POS
ADMIN_EMAIL=admin@goldenmunch.com
```

#### Key Methods:

##### `sendEmail(options: EmailOptions)`
- Sends individual emails
- Returns boolean success status
- Handles errors gracefully
- Logs message IDs

##### `processPendingNotifications()`
- Queries database for pending notifications
- Processes up to 50 notifications per run
- Updates status to 'sent' or 'failed'
- Called by scheduler every 5 minutes

##### `retryFailedNotifications()`
- Retries failed emails from last 24 hours
- Processes up to 20 failed notifications
- Resets status before retry
- Called by scheduler every hour

##### `sendPickupReminders()`
- Sends reminders for next day pickups
- Checks for duplicate reminders (prevents spam)
- Creates beautiful HTML email templates
- Includes order details, verification code

##### `notifyAdminNewRequest(requestId)`
- Notifies admin of new custom cake requests
- Sends immediately (not queued)
- Includes direct link to review request
- Non-blocking operation

---

### 2. Scheduler Service (`server/src/services/scheduler.service.ts`)

**Purpose**: Automated task scheduling using node-cron.

#### Scheduled Jobs:

| Job Name | Schedule | Description |
|----------|----------|-------------|
| `processPendingEmails` | `*/5 * * * *` | Every 5 minutes - Process pending notifications |
| `retryFailedEmails` | `0 * * * *` | Every hour - Retry failed emails |
| `sendPickupReminders` | `0 9 * * *` | 9:00 AM daily - Morning pickup reminders |
| `sendEveningReminders` | `0 18 * * *` | 6:00 PM daily - Evening pickup reminders |

#### Features:
- 🕐 Cron-based scheduling
- 🔧 Manual job triggering (for testing)
- 🛑 Graceful job stopping
- 📊 Job status monitoring

#### Initialization:
```typescript
// Called in server.ts on startup
schedulerService.initialize();

// Stopped on shutdown
process.on('SIGTERM', () => {
  schedulerService.stopAll();
});
```

---

### 3. SSE Service (`server/src/services/sse.service.ts`)

**Purpose**: Real-time notification delivery via Server-Sent Events.

#### Features:
- 🔴 Real-time event streaming
- 📡 Multiple channels (orders, menu, inventory, custom-cakes, notifications)
- 🔄 Auto-reconnection support
- 📜 Event history replay
- ❤️ Heartbeat mechanism (30s interval)

#### Event Types:
```typescript
// Order events
'order.created'
'order.updated'
'order.status_changed'
'order.deleted'
'order.printed'

// Menu events
'menu.item.created'
'menu.item.updated'
'menu.item.deleted'
'menu.item.stock_changed'

// Custom cake events
'custom_cake.submitted'
'custom_cake.approved'
'custom_cake.rejected'
'custom_cake.completed'

// Generic
'notification'
'cache.invalidated'
```

#### Broadcasting Example:
```typescript
// In order.controller.ts
sseService.broadcast(SSEChannels.ORDERS, SSEEvents.ORDER_CREATED, {
  order_id: result.order_id,
  order_number: result.order_number,
  total_amount: result.total_amount,
  timestamp: new Date().toISOString(),
});
```

---

### 4. Integration Points in Controllers

#### Custom Cake Controller (`server/src/controllers/customCake.controller.ts`)

**Trigger Points:**

##### 1. `submitForReview()` - Customer Submits Request
```typescript
// After request is saved to database
emailService.notifyAdminNewRequest(request_id).catch((error) => {
  console.error('Failed to send admin notification email:', error);
});
```
- Sends immediate notification to admin
- Non-blocking (doesn't wait for email to send)
- Error logged but doesn't fail request

##### 2. `approveRequest()` - Admin Approves Custom Cake
```typescript
// After approval and notification record created in DB
emailService.processPendingNotifications().catch((error) => {
  console.error('Failed to send approval notification:', error);
});
```
- Creates notification record in database
- Triggers immediate processing
- Email contains approval details, pricing, pickup info

##### 3. `rejectRequest()` - Admin Rejects Request
```typescript
// After rejection notification created
emailService.processPendingNotifications().catch((error) => {
  console.error('Failed to send rejection notification:', error);
});
```
- Creates rejection notification
- Sends polite rejection email
- Includes reason if provided

##### 4. `processPayment()` - Payment Processed
```typescript
// After order created and payment confirmed
emailService.processPendingNotifications().catch((error) => {
  console.error('Failed to send payment confirmation notification:', error);
});
```
- Sends payment confirmation
- Includes order number, verification code
- Reminder about pickup date/time

#### Order Controller (`server/src/controllers/order.controller.ts`)

**SSE Integration:**

##### 1. `createOrder()` - New Order Created
```typescript
sseService.broadcast(SSEChannels.ORDERS, SSEEvents.ORDER_CREATED, {
  order_id: result.order_id,
  order_number: result.order_number,
  total_amount: result.total_amount,
  items_count: result.items_count,
  timestamp: new Date().toISOString(),
});
```

##### 2. `updateOrderStatus()` - Status Changed
```typescript
sseService.broadcast(SSEChannels.ORDERS, SSEEvents.ORDER_STATUS_CHANGED, {
  order_id: parseInt(id, 10),
  order_status,
  updated_by: user_id,
  timestamp: new Date().toISOString(),
});
```

---

## 💻 CLIENT-SIDE ARCHITECTURE

### 1. Toast Notifications (In-App Alerts)

#### Kiosk Web (`client/Kiosk_Web/components/Toast.tsx`)

**Custom Toast Component:**
```typescript
interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
}
```

**Features:**
- 🎨 Color-coded by type (green, red, blue, orange)
- ⏱️ Auto-dismiss (default 4s)
- 🖱️ Click to dismiss
- 🎭 Smooth animations (slide in/out)
- 📍 Fixed top-right position

**useToast Hook:**
```typescript
const { showToast, success, error, warning, info } = useToast();

// Usage examples
success('Order created successfully!');
error('Payment failed');
warning('Low stock alert');
info('Processing your request...');
```

#### CashierAdmin (`client/cashieradmin/app/cashier/orders/page.tsx`)

**HeroUI Toast System:**
```typescript
import { addToast } from "@heroui/toast";

addToast({
  title: "Payment Verified",
  description: `Order #${order.order_number} confirmed`,
  color: "success",
  timeout: 3000,
});
```

**Common Use Cases:**
- ✅ Payment verification
- 🖨️ Print confirmations
- ❌ Error messages
- ⚠️ Warnings
- 📊 Status updates

---

### 2. SSE Client Hooks

#### CashierAdmin - Orders Hook (`client/cashieradmin/hooks/useOrders.ts`)

**Real-time Order Updates:**
```typescript
export function useOrders(status?: string) {
  // SWR for data fetching
  const { data, mutate } = useSWR(['orders', status], fetchOrders);

  // SSE for real-time updates
  useSSE({
    url: '/api/sse/orders',
    events: {
      'order.created': () => mutate(),      // Refresh list
      'order.status_changed': () => mutate(),
      'order.updated': () => mutate(),
      'order.deleted': () => mutate(),
      'order.printed': () => mutate(),
    }
  });
}
```

**Benefits:**
- 🚫 No polling needed
- ⚡ Instant updates (< 1s latency)
- 🔄 Auto-reconnection
- 💾 Client-side caching with SWR

#### Kiosk - Menu Hook (`client/Kiosk_Web/hooks/useMenu.ts`)

**Real-time Menu Updates:**
```typescript
export function useMenuItems() {
  const { data, mutate } = useSWR('menu-items', fetchMenuItems);

  useSSE({
    url: '/api/sse/menu',
    events: {
      'menu.item.created': () => mutate(),
      'menu.item.updated': () => mutate(),
      'menu.item.deleted': () => mutate(),
      'menu.item.stock_changed': () => mutate(),
    }
  });
}
```

---

### 3. SSE Connection Hook (`useSSE.ts`)

**Features:**
- 🔌 EventSource API wrapper
- 🔄 Auto-reconnection (3s delay)
- 📜 Event handler registration
- 🔍 Connection status tracking
- 🧹 Cleanup on unmount

**Usage:**
```typescript
useSSE({
  url: `${API_URL}/api/sse/orders`,
  enabled: true,
  reconnect: true,
  reconnectDelay: 3000,
  events: {
    'event.name': (data) => {
      // Handle event
    }
  },
  onOpen: () => console.log('Connected'),
  onError: (error) => console.error('Error:', error),
});
```

---

## 🔄 WORKFLOW DIAGRAMS

### Email Notification Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    EMAIL NOTIFICATION WORKFLOW                   │
└─────────────────────────────────────────────────────────────────┘

1. TRIGGER EVENT (e.g., Custom Cake Request Submitted)
   │
   ├─→ customCake.controller.ts: submitForReview()
   │   │
   │   ├─→ Insert request into database
   │   │
   │   └─→ emailService.notifyAdminNewRequest(requestId)
   │       │
   │       ├─→ Fetch request details from DB
   │       │
   │       ├─→ Generate HTML email template
   │       │
   │       └─→ sendEmail() → SMTP → Admin's inbox
   │
   └─→ Response sent to client (doesn't wait for email)

2. PENDING NOTIFICATION PROCESSING
   │
   ├─→ Scheduler: Every 5 minutes
   │   │
   │   └─→ emailService.processPendingNotifications()
   │       │
   │       ├─→ Query DB: SELECT * WHERE status='pending' LIMIT 50
   │       │
   │       ├─→ For each notification:
   │       │   ├─→ sendEmail()
   │       │   ├─→ Success? → UPDATE status='sent', sent_at=NOW()
   │       │   └─→ Failed? → UPDATE status='failed', error_message='...'
   │       │
   │       └─→ Log results

3. RETRY FAILED EMAILS
   │
   ├─→ Scheduler: Every hour
   │   │
   │   └─→ emailService.retryFailedNotifications()
   │       │
   │       ├─→ Query DB: SELECT * WHERE status='failed' AND sent_at > 24h ago
   │       │
   │       ├─→ UPDATE status='pending' (reset for retry)
   │       │
   │       └─→ sendNotification() for each

4. PICKUP REMINDERS
   │
   └─→ Scheduler: 9:00 AM & 6:00 PM daily
       │
       └─→ emailService.sendPickupReminders()
           │
           ├─→ Query: approved cakes with pickup_date = tomorrow
           │
           ├─→ Check: No reminder sent today (prevent duplicates)
           │
           ├─→ Create reminder notification in DB
           │
           └─→ Send immediately via sendNotification()
```

### Real-Time SSE Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                   SSE REAL-TIME NOTIFICATION FLOW                │
└─────────────────────────────────────────────────────────────────┘

CLIENT (CashierAdmin)
   │
   ├─→ Component mounts with useOrders() hook
   │   │
   │   ├─→ SWR: Initial data fetch
   │   │   └─→ GET /api/cashier/orders → Returns orders array
   │   │
   │   └─→ useSSE: Connect to SSE stream
   │       └─→ EventSource: GET /api/sse/orders
   │           │
   │           ├─→ Server registers client (stores in memory)
   │           │
   │           └─→ Sends 'connected' event
   │
   ▼
PERSISTENT CONNECTION ESTABLISHED
   │
   ├─→ Heartbeat: Every 30s (": heartbeat\n\n")
   │
   └─→ Waiting for events...

SERVER (Order Created)
   │
   ├─→ Kiosk places order
   │   │
   │   └─→ order.controller.ts: createOrder()
   │       │
   │       ├─→ Insert order into database
   │       │
   │       ├─→ sseService.broadcast(
   │       │     SSEChannels.ORDERS,
   │       │     SSEEvents.ORDER_CREATED,
   │       │     { order_id, order_number, total_amount }
   │       │   )
   │       │   │
   │       │   ├─→ Find all clients on 'orders' channel
   │       │   │
   │       │   ├─→ For each client:
   │       │   │   └─→ response.write(`event: order.created\n`)
   │       │   │   └─→ response.write(`data: ${JSON.stringify(data)}\n\n`)
   │       │   │
   │       │   └─→ Store in event history (for replay)
   │       │
   │       └─→ Return success response to kiosk
   │
   ▼
CLIENT (Receives Event)
   │
   ├─→ useSSE event handler triggered
   │   │
   │   └─→ 'order.created': (data) => {
   │         console.log('New order:', data);
   │         mutate(); // SWR revalidates data
   │       }
   │
   ├─→ SWR re-fetches orders
   │   └─→ GET /api/cashier/orders
   │
   ├─→ React re-renders with new data
   │
   └─→ UI updates INSTANTLY (< 1 second)
       └─→ New order appears in pending list
```

### Client-Side Toast Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                   CLIENT-SIDE TOAST NOTIFICATION                 │
└─────────────────────────────────────────────────────────────────┘

USER ACTION (e.g., Verify Payment)
   │
   ├─→ Click "Verify Payment" button
   │
   └─→ handleVerifyPayment()
       │
       ├─→ API Call: POST /api/cashier/payment/verify
       │   │
       │   ├─→ Success Response (200)
       │   │   │
       │   │   ├─→ addToast({
       │   │   │     title: "Payment Verified",
       │   │   │     description: "Order confirmed",
       │   │   │     color: "success",
       │   │   │     timeout: 3000
       │   │   │   })
       │   │   │   │
       │   │   │   └─→ ToastProvider manages state
       │   │   │       │
       │   │   │       ├─→ Generate unique ID
       │   │   │       │
       │   │   │       ├─→ Add to toasts array
       │   │   │       │
       │   │   │       └─→ Render Toast component
       │   │   │           │
       │   │   │           ├─→ Slide in animation
       │   │   │           │
       │   │   │           ├─→ Auto-dismiss after 3s
       │   │   │           │
       │   │   │           └─→ Slide out animation
       │   │   │
       │   │   └─→ Refresh order data
       │   │
       │   └─→ Error Response (400/500)
       │       │
       │       └─→ addToast({
       │             title: "Error",
       │             description: error.message,
       │             color: "danger"
       │           })
       │
       └─→ finally: setProcessing(false)
```

---

## ⚙️ CONFIGURATION

### Environment Variables

```env
# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password_here
EMAIL_FROM_NAME=GoldenMunch POS
ADMIN_EMAIL=admin@goldenmunch.com

# Business Information (used in emails)
BUSINESS_PHONE=+1234567890
BUSINESS_ADDRESS=123 Main Street, City, Country
BACKEND_URL=http://localhost:5000

# Redis (for SSE client tracking - optional)
REDIS_ENABLED=true
REDIS_HOST=localhost
REDIS_PORT=6379
```

### Email Provider Setup (Gmail Example)

1. **Enable 2-Factor Authentication**
   - Go to Google Account settings
   - Security → 2-Step Verification

2. **Generate App Password**
   - Security → App passwords
   - Select "Mail" and your device
   - Copy 16-character password

3. **Update .env**
   ```env
   EMAIL_USER=your.business@gmail.com
   EMAIL_PASSWORD=abcd efgh ijkl mnop
   ```

4. **Test Connection**
   ```bash
   # Server logs will show:
   ✅ Email service initialized successfully
   ✅ Email connection verified
   ```

---

## 🗄️ DATABASE SCHEMA

### custom_cake_notifications Table

```sql
CREATE TABLE custom_cake_notifications (
  notification_id INT AUTO_INCREMENT PRIMARY KEY,
  request_id INT NOT NULL,
  notification_type ENUM('approval', 'rejection', 'reminder', 'payment_confirmation') NOT NULL,
  recipient_email VARCHAR(255) NOT NULL,
  subject VARCHAR(500) NOT NULL,
  message_body TEXT NOT NULL,
  status ENUM('pending', 'sent', 'failed') DEFAULT 'pending',
  sent_at TIMESTAMP NULL,
  error_message TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (request_id) REFERENCES custom_cake_request(request_id),
  INDEX idx_status (status),
  INDEX idx_sent_at (sent_at)
);
```

**Fields:**
- `notification_id`: Auto-increment primary key
- `request_id`: Links to custom cake request
- `notification_type`: Type of notification (approval, rejection, etc.)
- `recipient_email`: Customer email address
- `subject`: Email subject line
- `message_body`: HTML email body
- `status`: Tracking (pending → sent/failed)
- `sent_at`: Timestamp when successfully sent
- `error_message`: Stored if send fails
- `created_at`: When notification was queued

**Indexes:**
- Fast querying of pending notifications
- Efficient retry of failed emails within 24h

---

## 🔗 INTEGRATION POINTS

### Server Initialization (`server/src/server.ts`)

```typescript
const startServer = async () => {
  // 1. Database connection
  await testConnection();

  // 2. Redis initialization (for SSE client tracking)
  await initRedis();

  // 3. Email service test
  await emailService.testConnection();

  // 4. Start scheduler (cron jobs)
  schedulerService.initialize();

  // 5. Process pending notifications immediately
  await emailService.processPendingNotifications();

  // 6. Start Express server
  app.listen(PORT, HOST);
};
```

### Client Providers

#### CashierAdmin (`client/cashieradmin/app/providers.tsx`)
```typescript
<HeroUIProvider>
  <ToastProvider />        {/* Toast notifications */}
  <NextThemesProvider>
    <AuthProvider>
      {children}
    </AuthProvider>
  </NextThemesProvider>
</HeroUIProvider>
```

#### Kiosk (`client/Kiosk_Web/app/providers.tsx`)
```typescript
<HeroUIProvider>
  <CartProvider>
    {children}
  </CartProvider>
</HeroUIProvider>
```

---

## 📊 NOTIFICATION STATISTICS

### Email Types and Triggers

| Email Type | Trigger | Recipients | Frequency |
|------------|---------|-----------|-----------|
| **Admin New Request** | Customer submits custom cake | Admin | Immediate |
| **Approval** | Admin approves request | Customer | Queued (5min) |
| **Rejection** | Admin rejects request | Customer | Queued (5min) |
| **Payment Confirmation** | Cashier processes payment | Customer | Queued (5min) |
| **Pickup Reminder** | 1 day before pickup | Customer | 9 AM & 6 PM |

### SSE Events by Channel

| Channel | Events | Clients | Update Frequency |
|---------|--------|---------|------------------|
| **orders** | created, updated, status_changed, deleted, printed | Cashiers, Admins | Real-time |
| **menu** | item.created, item.updated, item.deleted, stock_changed | Kiosks | Real-time |
| **inventory** | alert, updated | Admins | Real-time |
| **custom-cakes** | submitted, approved, rejected, completed | Admins, Cashiers | Real-time |
| **notifications** | Generic notifications | All authenticated | Real-time |

---

## 🎯 BEST PRACTICES

### Server-Side

1. **Email Sending**
   - ✅ Always non-blocking (don't await in controllers)
   - ✅ Queue notifications in database
   - ✅ Let scheduler process them
   - ✅ Implement retry logic for failures

2. **SSE Broadcasting**
   - ✅ Broadcast after database commit
   - ✅ Include minimal data (ids, timestamps)
   - ✅ Let clients refetch full details
   - ✅ Store events in history for replay

3. **Error Handling**
   - ✅ Log errors but don't fail requests
   - ✅ Update notification status on failure
   - ✅ Retry failed emails automatically
   - ✅ Alert admins of persistent failures

### Client-Side

1. **Toast Notifications**
   - ✅ Keep messages concise (< 50 chars)
   - ✅ Use appropriate colors (success, error, warning, info)
   - ✅ Auto-dismiss after 3-4 seconds
   - ✅ Allow manual dismissal

2. **SSE Connections**
   - ✅ Use SWR for initial data fetch
   - ✅ Let SSE trigger revalidation
   - ✅ Handle reconnection gracefully
   - ✅ Clean up on unmount

3. **Performance**
   - ✅ Debounce rapid updates
   - ✅ Batch multiple events
   - ✅ Cache frequently accessed data
   - ✅ Minimize re-renders

---

## 🔍 MONITORING & DEBUGGING

### Server Logs

```bash
# Email service
✅ Email service initialized successfully
✅ Email sent successfully: <message-id>
❌ Failed to send email: <error>

# Scheduler
🕐 Initializing scheduler service...
✅ Scheduled job "processPendingEmails" with pattern: */5 * * * *
📧 Processing 3 pending email notifications...

# SSE
📡 SSE client connected: orders-123-abc on channel: orders
🗑️  Broadcast to 5 clients on channel: orders, event: order.created
```

### Client Console

```javascript
// SSE connection
[SSE] Connected to /api/sse/orders
[SSE] Order created: { order_id: 123, ... }

// SWR revalidation
📋 MenuService.getMenuItems() called
✅ MenuService.getMenuItems() received 24 items
```

### Database Queries

```sql
-- Check pending notifications
SELECT * FROM custom_cake_notifications
WHERE status = 'pending'
ORDER BY created_at DESC;

-- Check failed emails
SELECT * FROM custom_cake_notifications
WHERE status = 'failed'
AND sent_at > DATE_SUB(NOW(), INTERVAL 24 HOUR);

-- Notification statistics
SELECT
  notification_type,
  status,
  COUNT(*) as count
FROM custom_cake_notifications
GROUP BY notification_type, status;
```

---

## 🚀 FUTURE ENHANCEMENTS

### Potential Improvements

1. **Email Templates**
   - Move templates to separate files
   - Support template variables
   - Multi-language support
   - Branded HTML templates

2. **Push Notifications**
   - Web Push API integration
   - Mobile app notifications
   - SMS notifications (Twilio)
   - Desktop notifications

3. **Analytics**
   - Email open tracking
   - Click tracking
   - Delivery rate monitoring
   - SSE connection metrics

4. **Advanced Features**
   - Email scheduling (send later)
   - Notification preferences
   - Unsubscribe management
   - Notification batching

---

## 📖 SUMMARY

The GoldenMunch POS notification system provides comprehensive communication through:

1. **Email Notifications**
   - SMTP-based email delivery
   - Queued processing with retry logic
   - Scheduled pickup reminders
   - Admin alerts for new requests

2. **Real-Time Updates (SSE)**
   - Instant order updates to cashiers
   - Live menu changes to kiosks
   - Inventory alerts to admins
   - Auto-reconnection support

3. **In-App Toasts**
   - Immediate user feedback
   - Action confirmations
   - Error messages
   - Status updates

**Result**: A robust, multi-channel notification system that keeps staff and customers informed in real-time while maintaining reliability through queuing, retry logic, and graceful error handling.

---

*Generated: 2026-01-11*
*GoldenMunch POS System - Point of Sale with Custom Cake Editor*
