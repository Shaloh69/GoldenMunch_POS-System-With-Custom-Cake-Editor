# Payment Page Debugging Guide

## Issue
Cash orders are showing in `/cashier/orders` but NOT in `/cashier/payment`.

## Analysis Completed

### 1. Backend Verification ✅

**Order Creation (`server/src/controllers/order.controller.ts:123`):**
```typescript
VALUES (?, ?, ?, ?, ?, 'unpaid', 'pending', ?, ?, ?, ?, ?, ?, ?, ?, ?)
```
- Orders are created with `payment_status = 'unpaid'` ✅

**Database Schema (`server/databaseSchema/GoldenMunchPOSV3.sql:515`):**
```sql
payment_status ENUM('unpaid', 'partial', 'paid', 'refunded') DEFAULT 'unpaid'
```
- Valid enum values confirmed ✅

**API Endpoint (`server/src/controllers/order.controller.ts:329-399`):**
```typescript
export const getOrders = async (req: AuthRequest, res: Response) => {
  // Accepts: status, payment_status, order_type, date_from, date_to, page, limit
  let sql = `SELECT co.*, c.name, c.phone FROM customer_order co ...`
}
```
- Endpoint accepts `payment_status` filter (but frontend doesn't use it) ✅
- Returns all columns from customer_order table ✅

### 2. Frontend Verification ✅

**Payment Page Filter (`client/cashieradmin/app/cashier/payment/page.tsx:79`):**
```typescript
const pending = orders.filter(
  (order: CustomerOrder) => order.payment_status === 'unpaid'
);
```
- Filter changed from 'pending' to 'unpaid' ✅
- Matches backend creation value ✅

### 3. Debug Logging Added 🔍

I've added comprehensive logging to help diagnose the issue. The logs will show:

#### When Payment Page Loads:
```
📥 Full API Response: { success: true, data: {...}, message: "..." }
📦 Total orders received: X
📋 Orders data: [...]
Order 1: ID=123, Number=ORD-XXX, Payment Status="unpaid"
Order 2: ID=124, Number=ORD-YYY, Payment Status="paid"
...
💰 Filtered unpaid orders: X
💳 Unpaid orders: [...]
```

#### For Recent Payments:
```
📅 Today's date for filtering: 2025-11-28
Order ORD-123: payment_status="paid", date=2025-11-28, isPaid=true, isToday=true
✅ Recent paid orders today: X
```

## Testing Instructions

### Step 1: Open Browser Console
1. Go to `http://localhost:3000/cashier/payment`
2. Open Developer Tools (F12)
3. Go to Console tab
4. Clear console (trash icon)
5. Refresh the page (F5)

### Step 2: Analyze Console Output

Look for these key indicators:

#### ✅ **Good Signs:**
```
📦 Total orders received: 5
Order 1: ID=123, Number=ORD-123, Payment Status="unpaid"
💰 Filtered unpaid orders: 1
```
- This means the API returned orders
- One order has `payment_status = "unpaid"`
- It should appear in the payment page

#### ❌ **Problem Indicators:**

**No Orders Received:**
```
📦 Total orders received: 0
💰 Filtered unpaid orders: 0
```
- **Likely Cause:** Authentication issue, or database is empty
- **Action:** Check if you're logged in as cashier, check database

**Orders Received but Wrong Status:**
```
📦 Total orders received: 5
Order 1: ID=123, Number=ORD-123, Payment Status="pending"
Order 2: ID=124, Number=ORD-124, Payment Status="paid"
💰 Filtered unpaid orders: 0
```
- **Likely Cause:** Database has old data with 'pending' instead of 'unpaid'
- **Action:** Check actual database values

**Orders Received but payment_status is undefined:**
```
Order 1: ID=123, Number=ORD-123, Payment Status="undefined"
```
- **Likely Cause:** Database column mismatch or API not returning payment_status
- **Action:** Check backend SQL query

### Step 3: Create Test Order

1. Go to Kiosk: `http://localhost:3001` (or whatever port)
2. Add item to cart
3. Checkout with CASH payment
4. Complete order
5. Go back to cashier payment page
6. Refresh and check console

### Step 4: Check Database Directly

If still not working, check the database:

```sql
SELECT
    order_id,
    order_number,
    payment_status,
    payment_method,
    final_amount,
    created_at
FROM customer_order
WHERE payment_status = 'unpaid'
ORDER BY created_at DESC
LIMIT 10;
```

Expected result:
- Should see orders with `payment_status = 'unpaid'`
- Should see recently created orders

## Potential Issues & Fixes

### Issue 1: Field Name Mismatch

**Problem:** Database has `created_at` but frontend expects `order_datetime`

**Backend Query:**
```sql
SELECT co.*, c.name, c.phone  -- Returns created_at
```

**Frontend Usage:**
```typescript
const orderDate = new Date(order.order_datetime).toISOString()  // May be undefined!
```

**Fix:** Update backend to alias:
```sql
SELECT
    co.*,
    co.created_at AS order_datetime,  -- Add alias
    c.name,
    c.phone
```

### Issue 2: Authentication

**Problem:** Cashier not authenticated

**Check:** Look for errors in console like:
```
401 Unauthorized
403 Forbidden
Failed to load payment data
```

**Fix:** Re-login to cashier account

### Issue 3: CORS or Network Error

**Problem:** API request blocked

**Check:** Network tab in DevTools, look for failed requests

**Fix:** Ensure backend is running on correct port, check CORS settings

### Issue 4: Empty Database

**Problem:** No orders in database at all

**Check:** Console shows `Total orders received: 0`

**Fix:** Create a test order from kiosk

## Quick Diagnostic Commands

### Check Backend is Running
```bash
curl http://localhost:8000/api/health
```

### Check Orders Endpoint (with auth token)
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:8000/api/cashier/orders
```

### Check Database
```bash
mysql -u root -p -e "USE GoldenMunchPOS; SELECT COUNT(*) FROM customer_order WHERE payment_status='unpaid';"
```

## Next Steps

1. **Run the test** - Create an order from kiosk
2. **Check console** - Look for the debug logs
3. **Report findings** - Share the console output

The logs will tell us exactly:
- Is the API being called? ✅
- Is data being returned? ✅
- How many orders? ✅
- What are their payment_status values? ✅
- Are they being filtered correctly? ✅

## Commits Made

1. `64eecf4` - Fixed filter from 'pending' to 'unpaid'
2. `61c0677` - Added comprehensive debug logging

Both pushed to: `claude/fix-cashier-console-errors-01TNN3uGxUGGRT4ctHY7W3vS`
