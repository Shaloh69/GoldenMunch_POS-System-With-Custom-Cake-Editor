# Cash Payment Workflow Documentation
## Kiosk to Cashier Payment Process

**Last Updated:** November 26, 2025
**System:** GoldenMunch POS - Kiosk & Cashier Integration

---

## Overview

This document explains how cash payments are handled when customers order from the kiosk, from order creation through payment completion at the cashier counter.

---

## 🔄 Complete Cash Payment Workflow

### **Step 1: Customer Places Order at Kiosk**

**Location:** Kiosk Terminal (`/menu` → `/cart`)

**Actions:**
1. Customer browses menu and adds items to cart
2. Customer proceeds to checkout (`/cart` page)
3. Customer enters optional information:
   - Name (optional)
   - Phone (optional)
   - Special instructions (optional)
4. Customer selects order type:
   - Walk-in (eat here)
   - Pickup (take away)
   - Pre-order (scheduled pickup)
5. Customer selects **"Cash"** as payment method
6. Customer clicks **"Complete Order"**

**What Happens:**
```typescript
// Order created with payment_status = 'pending'
POST /api/kiosk/orders
{
  payment_method: 'cash',
  payment_status: 'pending',  // ← Not yet paid
  order_status: 'pending',    // ← Not yet confirmed
  items: [...],
  total_amount: 500.00,
  final_amount: 560.00  // With 12% VAT
}
```

**Database State:**
```sql
INSERT INTO customer_order (
  payment_method = 'cash',
  payment_status = 'pending',   -- Customer hasn't paid yet
  order_status = 'pending'      -- Order not confirmed
);
```

---

### **Step 2: Receipt/Order Slip Printed**

**Location:** Kiosk Terminal (automatically after order creation)

**What Prints:**
```
╔══════════════════════════════════════════╗
║        GOLDENMUNCH BAKERY & CAFE         ║
║              ORDER SLIP                  ║
╠══════════════════════════════════════════╣
║                                          ║
║  Order #: ORD-20251126-001              ║
║  Verification Code: ABC123               ║
║  Date: Nov 26, 2025 2:30 PM             ║
║  Type: Walk-in                          ║
║                                          ║
╠══════════════════════════════════════════╣
║  ITEMS:                                  ║
║                                          ║
║  1x Chocolate Cake               ₱400.00║
║  2x Coffee                       ₱100.00║
║                                          ║
╠══════════════════════════════════════════╣
║                                          ║
║  Subtotal:                       ₱500.00║
║  Tax (12%):                       ₱60.00║
║  ─────────────────────────────────────  ║
║  TOTAL:                          ₱560.00║
║                                          ║
╠══════════════════════════════════════════╣
║  Payment Method: CASH                    ║
║  Status: PENDING PAYMENT                 ║
║                                          ║
║  ⚠️  PLEASE PROCEED TO CASHIER           ║
║      TO COMPLETE PAYMENT                 ║
║                                          ║
║  Show this slip to the cashier           ║
╚══════════════════════════════════════════╝
```

**Receipt Data:**
- ✅ Order Number (e.g., "ORD-20251126-001")
- ✅ Verification Code (e.g., "ABC123")
- ✅ Order Date & Time
- ✅ Items with quantities and prices
- ✅ Subtotal, Tax, Total
- ✅ Payment Method (CASH)
- ✅ Status (PENDING PAYMENT)

---

### **Step 3: Customer Goes to Cashier Counter**

**Customer Actions:**
1. Customer takes printed slip
2. Customer goes to cashier counter
3. Customer shows slip to cashier
4. Customer prepares cash payment

**What Slip Contains:**
- Order details for cashier to verify
- Total amount to collect
- Order number for lookup
- Verification code for confirmation

---

### **Step 4: Cashier Receives Customer & Slip**

**Location:** Cashier Terminal (`/cashier/payment` or `/cashier/orders`)

**Cashier Has Two Options:**

#### **Option A: Use Payment Page** (Recommended)
**URL:** `/cashier/payment`

**Steps:**
1. Cashier opens Payment Management page
2. Cashier enters order number in quick search
   - Enter "ORD-20251126-001" OR
   - Enter verification code "ABC123"
3. Click "Search & Verify"
4. System opens verification modal
5. Cashier verifies:
   - Order details match slip
   - Items are correct
   - Total amount is ₱560.00
6. Cashier collects ₱560.00 cash from customer
7. Cashier clicks "Verify Payment"
8. System marks order as PAID

#### **Option B: Use Orders Page**
**URL:** `/cashier/orders`

**Steps:**
1. Cashier opens Orders page
2. Filters to "Pending" orders
3. Finds order by number or verification code
4. Clicks order to view details
5. Clicks "Verify Payment" button
6. Enters payment confirmation
7. Order marked as PAID

---

### **Step 5: Payment Verification Process**

**What Happens When Cashier Verifies:**

```typescript
POST /api/cashier/payment/verify
{
  order_id: 123,
  payment_method: 'cash',
  reference_number: null  // Not needed for cash
}
```

**Backend Processing:**
```typescript
// order.controller.ts:verifyPayment()
1. Validate order exists
2. Check payment method is 'cash'
3. Update order:
   - payment_status = 'paid'
   - payment_verified_by = <cashier_id>
   - payment_verified_at = NOW()
4. Create payment_transaction record
5. Return success
```

**Database Updates:**
```sql
-- Update order
UPDATE customer_order
SET
  payment_status = 'paid',
  payment_verified_by = 5,  -- Cashier ID
  payment_verified_at = '2025-11-26 14:35:00'
WHERE order_id = 123;

-- Insert payment transaction
INSERT INTO payment_transaction (
  order_id,
  payment_method,
  amount,
  payment_status,
  verified_by,
  verified_at
) VALUES (
  123,
  'cash',
  560.00,
  'verified',
  5,
  NOW()
);
```

---

### **Step 6: Order Status Progression**

**After Payment Verified:**

```
payment_status: pending → paid ✅
order_status: pending → confirmed → preparing → ready → completed
```

**Cashier Next Actions:**
1. Mark order as "Confirmed" (if not auto-confirmed)
2. Send to kitchen/preparation
3. Update status as food is prepared
4. Call customer when ready
5. Complete order when picked up

---

## 📱 Cashier Payment Page Features

### **Quick Search & Verify**
- Search by order number or verification code
- Instant modal with order details
- One-click verification
- No reference number needed for cash

### **Pending Payments Tab**
- Shows all orders awaiting payment
- Displays order slip details
- Amount clearly visible
- Direct verify button

### **Statistics Dashboard**
- Pending payments count
- Amount waiting verification
- Today's verified count
- Verification rate

---

## 🎯 Key Points for Cashiers

### **What to Check:**
1. ✅ Order number on slip matches system
2. ✅ Verification code is correct
3. ✅ Items on slip match order details
4. ✅ Total amount is correct
5. ✅ Customer provides exact amount shown

### **What to Collect:**
- Exact amount shown on slip (₱560.00)
- If customer pays more, give change
- Keep slip for reconciliation

### **After Verification:**
- Order automatically moves to "Verified Today" tab
- Order can progress through preparation stages
- Customer can track order status
- Receipt already printed at kiosk (no duplicate needed)

---

## 📊 Payment Verification Examples

### **Example 1: Simple Cash Payment**

**Customer Slip:**
```
Order: ORD-001
Code: ABC123
Total: ₱250.00
Payment: Cash
```

**Cashier Actions:**
1. Search "ORD-001" or "ABC123"
2. Verify total is ₱250.00
3. Collect ₱250.00 from customer
4. Click "Verify Payment"
5. Done! ✅

**Time:** ~15 seconds

---

### **Example 2: Customer Pays with Large Bill**

**Customer Slip:**
```
Order: ORD-002
Total: ₱375.00
Payment: Cash
```

**Customer Gives:** ₱500.00

**Cashier Actions:**
1. Search order
2. Verify total ₱375.00
3. Collect ₱500.00
4. Calculate change: ₱500 - ₱375 = ₱125.00
5. Give customer ₱125.00 change
6. Click "Verify Payment"
7. Done! ✅

**Time:** ~30 seconds

---

### **Example 3: Customer Needs Breakdown**

**Customer:** "Can you explain the charges?"

**Cashier:**
1. Search order
2. View order details in modal:
   ```
   Items:
   - 1x Chocolate Cake   ₱400.00
   - 1x Coffee           ₱100.00
   Subtotal:             ₱500.00
   Tax (12%):             ₱60.00
   TOTAL:                ₱560.00
   ```
3. Explain: "Your cake is ₱400, coffee ₱100, plus 12% tax"
4. Collect payment
5. Verify
6. Done! ✅

---

## 🚨 Common Scenarios & Solutions

### **Scenario 1: Customer Lost Slip**
**Problem:** Customer doesn't have physical slip

**Solution:**
1. Ask for order number or verification code
2. Customer might remember or have photo on phone
3. Search by customer name if provided
4. Verify details with customer verbally
5. Complete payment verification

---

### **Scenario 2: Order Not Found**
**Problem:** Cashier can't find order in system

**Possible Causes:**
- Wrong order number entered
- Order created on different kiosk/session
- System sync delay

**Solution:**
1. Double-check order number with customer
2. Try verification code instead
3. Check "All" orders (not just pending)
4. Refresh page (auto-refreshes every 30 sec)
5. Check with admin if still not found

---

### **Scenario 3: Amount Doesn't Match**
**Problem:** Slip shows different amount than system

**Possible Causes:**
- Price changed between order and payment
- Slip printed incorrectly
- Order modified by admin

**Solution:**
1. Check order details in system (source of truth)
2. Explain discrepancy to customer
3. If system is higher: Customer pays system amount
4. If system is lower: Customer pays lower amount
5. Note discrepancy for admin review

---

### **Scenario 4: Customer Wants to Cancel**
**Problem:** Customer decides not to complete order

**Solution:**
1. Don't verify payment (leave as pending)
2. Navigate to Orders page
3. Find the order
4. Click "Update Status" → "Cancelled"
5. Order marked as cancelled
6. No payment recorded

---

### **Scenario 5: Partial Payment**
**Problem:** Customer wants to pay partial now, rest later

**Note:** Current system doesn't support partial payments for cash

**Solution:**
1. Explain full payment required for cash
2. If customer insists:
   - Collect what they can pay now
   - Note amount in special instructions
   - Don't verify payment yet
   - Customer returns to pay remainder
   - Then verify payment

**Better:** Suggest pre-order type for split payments

---

## 🔐 Security & Audit Trail

### **What Gets Logged:**
- Order creation timestamp
- Payment verification timestamp
- Cashier who verified (cashier_id)
- Payment amount
- Payment method
- Order status changes

### **Audit Query:**
```sql
-- Check payment verification
SELECT
  o.order_number,
  o.final_amount,
  o.payment_status,
  o.payment_verified_by,
  o.payment_verified_at,
  c.name AS verified_by_cashier
FROM customer_order o
LEFT JOIN cashier c ON o.payment_verified_by = c.cashier_id
WHERE o.payment_method = 'cash'
  AND o.payment_status = 'paid'
ORDER BY o.payment_verified_at DESC;
```

---

## 📈 Daily Reconciliation

### **End-of-Day Cash Count:**

**Steps:**
1. Open Payment Management page
2. Check "Verified Today" tab
3. Filter to show only cash payments
4. Sum total cash received
5. Count physical cash in register
6. Amounts should match

**Report Query:**
```sql
SELECT
  COUNT(*) as total_orders,
  SUM(final_amount) as total_cash_collected
FROM customer_order
WHERE payment_method = 'cash'
  AND payment_status = 'paid'
  AND DATE(payment_verified_at) = CURDATE();
```

**Expected Output:**
```
Total Cash Orders: 45
Total Cash Collected: ₱28,450.00
```

**Physical Count Should Match:** ₱28,450.00

---

## ⚡ Quick Reference for Cashiers

### **Fast Verification (15 seconds):**
```
1. Customer hands slip
2. Enter order number
3. Press Enter
4. Collect cash
5. Click "Verify Payment"
6. Done!
```

### **Keyboard Shortcuts:**
- **Enter** in search box → Search order
- **Esc** in modal → Close without saving
- **Tab** → Navigate between fields

### **What's on the Slip:**
- Order Number (search with this)
- Verification Code (or search with this)
- Total Amount (collect this amount)
- Items (verify these match)

---

## 🎓 Training Points for New Cashiers

### **Day 1: Basics**
- [ ] Understand kiosk prints slip
- [ ] Customer brings slip to counter
- [ ] Search by order number
- [ ] Verify total amount
- [ ] Collect cash
- [ ] Click verify button

### **Day 2: Common Scenarios**
- [ ] Customer pays exact amount
- [ ] Customer needs change
- [ ] Customer lost slip
- [ ] Order not found
- [ ] Customer wants to cancel

### **Day 3: Advanced**
- [ ] Handle amount discrepancies
- [ ] Explain charges to customer
- [ ] Use order details modal
- [ ] Navigate between tabs
- [ ] End-of-day reconciliation

---

## 🛠️ Troubleshooting

### **Verify Button Not Working**
1. Check internet connection
2. Refresh page
3. Try searching order again
4. Check browser console for errors
5. Contact admin

### **Slip Not Printing at Kiosk**
1. Check if printer is connected
2. Check printer has paper
3. Order still created (use order number manually)
4. Customer can use verification code

### **Can't Find Order**
1. Verify order number is correct
2. Try verification code
3. Check if order was actually created
4. Refresh payment page
5. Check all orders (not just pending)

---

## 📞 Support

**For Cashiers:**
- Payment issues → Contact supervisor
- System errors → Note order number, contact IT
- Customer disputes → Escalate to manager

**For Admins:**
- Check audit logs for verification
- Review payment_transaction table
- Verify database integrity
- Check printer connectivity

---

## Summary: The Complete Flow

```
┌─────────────┐
│   KIOSK     │
│             │
│ 1. Order    │
│ 2. Print    │ ← Receipt prints with order #, code, total
│ 3. Slip     │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  CUSTOMER   │
│             │
│ Takes slip  │
│ Goes to     │ ← Customer walks to cashier
│ counter     │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   CASHIER   │
│             │
│ 1. Search   │ ← Enter order # or code
│ 2. Verify   │ ← Check details match
│ 3. Collect  │ ← Get cash from customer
│ 4. Confirm  │ ← Click "Verify Payment"
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  DATABASE   │
│             │
│ payment_    │
│ status:     │ ← Updated to 'paid'
│ PAID ✅     │
└─────────────┘
```

**Total Time:** 30-60 seconds from slip to verified payment

---

**Document Version:** 1.0
**Last Updated:** November 26, 2025
**Related:** PAYMENT_PAGE_DOCUMENTATION.md
