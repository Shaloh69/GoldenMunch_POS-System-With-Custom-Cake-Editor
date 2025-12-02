# Custom Cake Features - Complete Implementation Guide

## 🎂 Overview

This document describes the complete custom cake workflow from customer order to pickup, including all newly implemented features.

---

## ✨ Implemented Features

### 1. ✅ Complete Workflow (Kiosk → MobileEditor → Admin → Cashier)
- QR code generation at kiosk
- Mobile editor for cake design
- Admin approval system
- Cashier payment processing

### 2. ✅ Email Notification System
- Automated email notifications for all events
- Pickup reminders (1 day before)
- Admin notifications for new requests
- Customer notifications (approval, rejection, payment confirmation)

### 3. ✅ Pickup Scheduling with Capacity Management
- Daily capacity tracking (default: 10 orders/day)
- Automatic capacity validation during approval
- Date blocking/unblocking for holidays
- Available date suggestions based on preparation time

### 4. ✅ Admin Price Control
- Admin manually sets the final price
- No automatic calculation constraints
- Full flexibility based on complexity assessment

---

## 🔧 Setup Instructions

### 1. Install Dependencies

The required packages have already been installed:
```bash
# Already installed in server
- nodemailer: ^6.9.16
- @types/nodemailer: ^6.4.16
- node-cron: ^3.0.3
- @types/node-cron: ^3.0.11
```

### 2. Configure Email Service

Update your `.env` file with email credentials:

```env
# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password_here
EMAIL_FROM_NAME=GoldenMunch POS

# Admin Email (receives new request notifications)
ADMIN_EMAIL=admin@goldenmunch.com

# Business Contact Info (shown in emails)
BUSINESS_PHONE=+1234567890
BUSINESS_ADDRESS=123 Main Street, City, Country
```

#### Gmail Setup (Recommended):
1. Go to Google Account Settings → Security
2. Enable 2-Step Verification
3. Create an App Password:
   - Visit: https://myaccount.google.com/apppasswords
   - Select app: Mail
   - Select device: Other (Custom name)
   - Generate and copy the 16-character password
4. Use this password in `EMAIL_PASSWORD`

#### Other Email Providers:
- **Outlook**: `smtp.office365.com`, port 587
- **Yahoo**: `smtp.mail.yahoo.com`, port 587
- **SendGrid**: Use SendGrid API instead (better for production)

### 3. Start the Server

```bash
cd server
npm run dev
```

The scheduler will automatically start and log:
```
✅ Email service initialized successfully
🕐 Initializing scheduler service...
✅ Scheduled job "processPendingEmails" with pattern: */5 * * * *
✅ Scheduled job "retryFailedEmails" with pattern: 0 * * * *
✅ Scheduled job "sendPickupReminders" with pattern: 0 9 * * *
✅ Scheduled job "sendEveningReminders" with pattern: 0 18 * * *
```

---

## 📋 Complete Workflow

### Step 1: Customer Creates Custom Cake (Kiosk)

1. Customer selects "Custom Cake" at kiosk
2. Kiosk generates QR code with 30-minute session
3. Customer scans QR code with phone
4. Redirected to Mobile Editor

**API Endpoint:**
```http
POST /api/kiosk/custom-cake/generate-qr
Body: { "kiosk_id": "KIOSK_001" }
Response: {
  "qr_code_data": "data:image/png;base64,...",
  "editor_url": "http://localhost:3001/?session=abc123...",
  "session_token": "abc123...",
  "expires_at": "2025-12-01T10:30:00Z"
}
```

### Step 2: Design Cake (Mobile Editor)

Customer completes 8-step wizard:
1. **Customer Info**: Name, email, phone
2. **Layers**: 1-5 layers
3. **Flavors**: Choose flavor per layer
4. **Sizes**: Choose size per layer
5. **Frosting**: Type and color
6. **Decorations**: 3D elements, candles, theme
7. **Text**: Cake message, font, position, color
8. **Review**: Preview and submit

**Key Features:**
- Auto-saves draft every 3 seconds
- Live 3D preview with React Three Fiber
- Captures screenshots from 4 angles on submit

**API Endpoints:**
```http
GET /api/custom-cake/session/:token
POST /api/custom-cake/save-draft
POST /api/custom-cake/upload-images
POST /api/custom-cake/submit
```

### Step 3: Admin Reviews Request

**Endpoint:**
```http
GET /api/admin/custom-cakes/pending
```

**Response:**
```json
[
  {
    "request_id": 1,
    "customer_name": "John Doe",
    "customer_email": "john@example.com",
    "customer_phone": "+1234567890",
    "num_layers": 3,
    "estimated_price": 950.00,
    "submitted_at": "2025-12-01T09:00:00Z"
  }
]
```

**View Details:**
```http
GET /api/admin/custom-cakes/:requestId
```

Returns:
- Full customer details
- Layer-by-layer specifications
- 4 angles of 3D screenshots
- Estimated price (for reference only)

### Step 4: Admin Approves with Price & Schedule

**Endpoint:**
```http
POST /api/admin/custom-cakes/:requestId/approve
Body: {
  "approved_price": 1200.00,
  "preparation_days": 3,
  "scheduled_pickup_date": "2025-12-05",
  "scheduled_pickup_time": "14:00",
  "admin_notes": "Beautiful design, extra work on decorations"
}
```

**What Happens:**
1. ✅ Validates date availability (capacity check)
2. ✅ Updates request status to 'approved'
3. ✅ Reserves slot in capacity table
4. ✅ Creates notification record
5. ✅ Sends email to customer immediately
6. ✅ Logs approval by admin ID

**Email Sent:**
```
Subject: 🎂 Your Custom Cake Request is Approved!

Dear John Doe,

Great news! Your custom cake request has been approved.

Price: ₱1,200.00
Pickup Date: December 5, 2025
Pickup Time: 2:00 PM

Please proceed to payment at the counter.
```

### Step 5: Cashier Processes Payment

**Endpoint:**
```http
POST /api/cashier/custom-cakes/:requestId/process-payment
Body: {
  "payment_method": "Cash",
  "amount_paid": 1200.00
}
```

**What Happens:**
1. Creates customer record (if new)
2. Creates order in `customer_order` table
3. Links order to custom cake request
4. Generates verification code
5. Sends payment confirmation email

**Receipt Details:**
- Order Number: ORD-20251201-001
- Verification Code: ABC-123
- Pickup Date: December 5, 2025
- Amount Paid: ₱1,200.00

### Step 6: Pickup Reminders (Automated)

**Scheduler Jobs:**

1. **Morning Reminder** (9:00 AM daily):
   ```
   Checks all pickups scheduled for tomorrow
   Sends reminder email to customers
   ```

2. **Evening Reminder** (6:00 PM daily):
   ```
   Second reminder for tomorrow's pickups
   ```

**Reminder Email:**
```
Subject: 🎂 Reminder: Your Custom Cake is Ready for Pickup Tomorrow!

Dear John Doe,

This is a friendly reminder that your custom cake is ready for pickup tomorrow!

📅 Date: Wednesday, December 5, 2025
🕐 Time: 2:00 PM
📋 Order Number: ORD-20251201-001
🔑 Verification Code: ABC-123
💰 Total Amount: ₱1,200.00

Important Notes:
- Please bring your verification code
- Arrive within scheduled time
- Contact us if you need to reschedule
```

### Step 7: Customer Picks Up Cake

Customer presents verification code at counter. Cashier:
1. Verifies order number
2. Confirms identity
3. Hands over cake
4. Updates order status to 'completed'

---

## 🔔 Notification System

### Email Types

1. **submission_received** → Admin
   - Triggered when customer submits design
   - Recipient: `ADMIN_EMAIL`

2. **approved** → Customer
   - Triggered when admin approves request
   - Includes price and pickup details

3. **rejected** → Customer
   - Triggered when admin rejects request
   - Includes rejection reason

4. **ready_for_pickup** → Customer
   - Triggered when payment is processed
   - Includes order number and verification code

5. **reminder** → Customer
   - Triggered 1 day before pickup (twice: 9 AM & 6 PM)
   - Includes all pickup details

### Scheduler Configuration

All jobs run automatically in the background:

| Job Name | Schedule | Description |
|----------|----------|-------------|
| `processPendingEmails` | Every 5 minutes | Sends pending notifications |
| `retryFailedEmails` | Every hour | Retries failed notifications |
| `sendPickupReminders` | Daily at 9:00 AM | Morning pickup reminders |
| `sendEveningReminders` | Daily at 6:00 PM | Evening pickup reminders |

### Manual Triggers (for testing)

```typescript
// In server console or admin endpoint
import { schedulerService } from './services/scheduler.service';
import { emailService } from './services/email.service';

// Test email connection
await emailService.testConnection();

// Process pending emails immediately
await emailService.processPendingNotifications();

// Send pickup reminders now
await emailService.sendPickupReminders();

// Trigger specific job
await schedulerService.triggerJob('sendPickupReminders');
```

---

## 📅 Capacity Management

### Default Settings

- **Default capacity**: 10 orders per day
- **Minimum notice**: 3 days
- **Auto-sync**: Syncs with actual orders on startup

### Admin Endpoints

#### Get Available Dates
```http
GET /api/admin/capacity/available-dates?days=30&minDays=3
Response: [
  {
    "date": "2025-12-05",
    "dayOfWeek": "Thursday",
    "isAvailable": true,
    "currentOrders": 3,
    "maxOrders": 10
  },
  {
    "date": "2025-12-06",
    "dayOfWeek": "Friday",
    "isAvailable": false,
    "reason": "Fully booked",
    "currentOrders": 10,
    "maxOrders": 10
  }
]
```

#### Check Specific Date
```http
GET /api/admin/capacity/check/2025-12-05
Response: {
  "date": "2025-12-05",
  "available": true,
  "currentOrders": 3,
  "maxOrders": 10,
  "remainingSlots": 7
}
```

#### Set Daily Capacity
```http
POST /api/admin/capacity/set
Body: {
  "date": "2025-12-25",
  "maxOrders": 20
}
```

#### Block Date (Holiday/Closure)
```http
POST /api/admin/capacity/block
Body: {
  "date": "2025-12-25"
}
```

#### Unblock Date
```http
POST /api/admin/capacity/unblock
Body: {
  "date": "2025-12-25"
}
```

#### Sync Capacity with Actual Orders
```http
POST /api/admin/capacity/sync
```
This ensures the capacity table reflects actual order counts.

#### Get Capacity Overview
```http
GET /api/admin/capacity/overview?startDate=2025-12-01&endDate=2025-12-31
Response: [
  {
    "capacity_date": "2025-12-05",
    "max_orders": 10,
    "current_orders": 3,
    "is_fully_booked": false,
    "remaining_slots": 7
  }
]
```

### Customer-Facing Endpoints

#### Suggest Pickup Dates
```http
GET /api/capacity/suggest?preparationDays=3&count=5
Response: [
  {
    "date": "2025-12-05",
    "dayOfWeek": "Thursday",
    "isAvailable": true,
    "currentOrders": 3,
    "maxOrders": 10
  }
]
```

#### Calculate Preparation Days
```http
POST /api/capacity/calculate-prep-days
Body: {
  "numLayers": 5,
  "hasTheme": true,
  "has3DDecorations": true
}
Response: {
  "preparationDays": 5
}
```

**Calculation Logic:**
- Base: 2 days
- +1 day if 4+ layers
- +1 day if 5 layers
- +1 day if has theme
- +1 day if has 3D decorations

---

## 🗄️ Database Tables

### custom_cake_request
Main table storing all custom cake orders.

**Key Fields:**
- `request_id` - Primary key
- `status` - draft | pending_review | approved | rejected | completed | cancelled
- `estimated_price` - Reference only (not used for billing)
- `approved_price` - **ADMIN SET** - Final price customer pays
- `scheduled_pickup_date` - Date for pickup
- `scheduled_pickup_time` - Time for pickup
- `preparation_days` - Days needed to prepare
- `order_id` - Links to customer_order after payment

### custom_cake_notifications
Tracks all email notifications.

**Fields:**
- `notification_id` - Primary key
- `request_id` - Foreign key
- `notification_type` - submission_received | approved | rejected | ready_for_pickup | reminder
- `recipient_email` - Email address
- `subject` - Email subject
- `message_body` - HTML email content
- `status` - pending | sent | failed
- `sent_at` - Timestamp when sent
- `error_message` - Error if failed

### custom_cake_daily_capacity
Tracks daily order capacity.

**Fields:**
- `capacity_date` - Date (UNIQUE)
- `max_orders` - Maximum orders allowed (default: 10)
- `current_orders` - Current count
- `is_fully_booked` - Boolean flag

### qr_code_sessions
Temporary QR session storage (30-minute expiry).

**Fields:**
- `session_token` - Unique 64-char hex
- `qr_code_data` - Base64 QR code image
- `editor_url` - Mobile editor URL
- `status` - active | used | expired
- `expires_at` - Expiry timestamp

---

## 🎯 Admin Price Setting

### Philosophy
The admin has **full control** over pricing. The system does NOT automatically calculate the final price based on ingredients, size, or complexity.

### Why?
- Custom cakes require human judgment
- Complexity varies (intricate designs vs. simple)
- Market pricing considerations
- Rush orders may cost more
- Customer negotiations

### How It Works

1. **Estimated Price** (shown to admin for reference):
   - Calculated automatically from: base (₱500) + layers + theme
   - This is just a **starting point** for the admin

2. **Approved Price** (what customer pays):
   - **Admin manually inputs** this during approval
   - Can be higher or lower than estimate
   - Based on admin's assessment of:
     - Design complexity
     - Time required
     - Special decorations
     - Market value

3. **Example:**
   ```
   Estimated Price: ₱950
   Admin Assessment:
     - 5-layer cake (very tall)
     - Intricate 3D decorations (extra work)
     - Wedding theme (premium)
     - Customer needs it in 2 days (rush)

   Admin Sets: ₱1,800
   ```

### Best Practices

- Review 3D screenshots carefully
- Consider preparation time
- Factor in decoration complexity
- Account for rush orders
- Communicate clearly with customer if price changes significantly from estimate

---

## 🧪 Testing

### 1. Test Email Service
```bash
# In server directory
node -e "
const { emailService } = require('./dist/services/email.service');
emailService.testConnection().then(result => {
  console.log('Test result:', result);
  process.exit(0);
});
"
```

### 2. Test Notification Flow
```bash
# Create a test custom cake request
# Submit it
# Check database: SELECT * FROM custom_cake_notifications;
# Trigger email processing
node -e "
const { emailService } = require('./dist/services/email.service');
emailService.processPendingNotifications().then(() => {
  console.log('Done');
  process.exit(0);
});
"
```

### 3. Test Capacity System
```bash
# Check available dates
curl http://localhost:5000/api/admin/capacity/available-dates?days=7

# Check specific date
curl http://localhost:5000/api/admin/capacity/check/2025-12-05

# Sync capacity
curl -X POST http://localhost:5000/api/admin/capacity/sync
```

### 4. Manual Trigger Reminder
```bash
node -e "
const { emailService } = require('./dist/services/email.service');
emailService.sendPickupReminders().then(() => {
  console.log('Reminders sent');
  process.exit(0);
});
"
```

---

## 🚀 Production Deployment

### Checklist

- [ ] Configure production email service (SendGrid recommended)
- [ ] Set strong email password (use secrets manager)
- [ ] Configure admin email address
- [ ] Test email delivery in production
- [ ] Set up monitoring for failed emails
- [ ] Configure backup email service (fallback)
- [ ] Set proper time zone for scheduler
- [ ] Test capacity limits under load
- [ ] Set up database backups
- [ ] Monitor notification queue

### SendGrid Setup (Recommended for Production)

1. Create SendGrid account
2. Generate API key
3. Update `.env`:
   ```env
   EMAIL_HOST=smtp.sendgrid.net
   EMAIL_PORT=587
   EMAIL_USER=apikey
   EMAIL_PASSWORD=your_sendgrid_api_key
   ```

### Monitoring

Monitor these metrics:
- Email delivery rate
- Failed notifications count
- Capacity utilization per day
- Average approval time
- Customer completion rate

---

## 📊 Summary

### ✅ What's Implemented

1. **Complete Workflow**: Kiosk → Mobile → Admin → Payment → Pickup
2. **Email Notifications**: All 5 types fully functional
3. **Pickup Reminders**: Automated daily (9 AM & 6 PM)
4. **Capacity Management**: Daily limits with validation
5. **Admin Price Control**: Manual price setting
6. **Scheduler**: 4 background jobs running automatically

### ⚙️ What Requires Configuration

1. Email credentials in `.env`
2. Admin email address
3. Business contact info
4. Daily capacity limits (optional, default: 10)

### 📈 Future Enhancements (Optional)

- SMS notifications (Twilio integration)
- WhatsApp notifications
- Customer portal (track order status)
- Multi-language support
- Online payment integration (advance deposit)
- Calendar view for capacity management
- Admin dashboard for analytics

---

## 🆘 Troubleshooting

### Emails Not Sending

1. Check `.env` configuration
2. Verify email credentials
3. Test connection: `emailService.testConnection()`
4. Check notification table: `SELECT * FROM custom_cake_notifications WHERE status='failed';`
5. View error messages in `error_message` column
6. Check server logs for errors

### Reminders Not Going Out

1. Verify scheduler is running (check startup logs)
2. Check if there are pickups scheduled for tomorrow
3. Manually trigger: `schedulerService.triggerJob('sendPickupReminders')`
4. Check notification table for 'reminder' type

### Capacity Not Validating

1. Sync capacity: `POST /api/admin/capacity/sync`
2. Check capacity table: `SELECT * FROM custom_cake_daily_capacity;`
3. Verify date format is correct (YYYY-MM-DD)

### QR Code Expired

- QR sessions expire after 30 minutes
- Generate new QR code at kiosk
- Increase expiry in `customCakeSession.controller.ts` if needed

---

## 📞 Support

For issues or questions:
1. Check server logs: `npm run dev` (look for errors)
2. Check database: Query relevant tables
3. Test individual components using manual triggers
4. Review this documentation

---

**Last Updated**: December 1, 2025
**Version**: 1.0.0
