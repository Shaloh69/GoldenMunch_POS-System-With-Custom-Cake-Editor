# Quick Fix Reference Guide

## Critical Fixes Applied - November 26, 2025

### 🔴 Fix #1: Database Schema Mismatch
**Changed:** `subtotal` → `total_amount`, added `final_amount`
**File:** `server/src/controllers/order.controller.ts:140`
**Test:** Create order and verify no SQL errors

### 🔴 Fix #2: Price Calculation
**Changed:** Added flavor/size costs to frontend calculations
**File:** `client/Kiosk/contexts/CartContext.tsx:126`
**Test:** Add cake with flavor+size, verify total matches backend

### 🔴 Fix #3: Reference Numbers
**Changed:** Kiosk now sends payment reference with order
**Files:**
- `client/Kiosk/app/cart/page.tsx:125`
- `server/src/controllers/order.controller.ts:154-156`
**Test:** Order with GCash, verify reference stored in database

### 🟡 Fix #4: Custom Cake Deduplication
**Changed:** Custom cakes always treated as unique
**File:** `client/Kiosk/contexts/CartContext.tsx:76`
**Test:** Add 2 custom cakes, verify both appear in cart

---

## Important: Update Required for Cart Operations

If you have code that adds items to cart, UPDATE IT:

```typescript
// ❌ OLD WAY (Will show wrong prices)
addItem({
  menuItem: item,
  quantity: 1,
  flavor_id: 5,
  size_id: 2
});

// ✅ NEW WAY (Correct prices)
addItem({
  menuItem: item,
  quantity: 1,
  flavor_id: 5,
  size_id: 2,
  flavor: selectedFlavor,  // ADD THIS - full object
  size: selectedSize       // ADD THIS - full object
});
```

---

## Quick Test Commands

```bash
# Test order creation
curl -X POST http://localhost:3001/api/kiosk/orders \
  -H "Content-Type: application/json" \
  -d '{"order_type":"walk_in","order_source":"kiosk","payment_method":"cash","items":[{"menu_item_id":1,"quantity":1}]}'

# Check database
mysql -u root -p goldenmunch_pos -e "SELECT order_id, total_amount, final_amount, gcash_reference_number FROM customer_order ORDER BY order_id DESC LIMIT 1;"

# Check pricing
mysql -u root -p goldenmunch_pos -e "SELECT unit_price, flavor_cost, size_multiplier, item_total FROM order_item ORDER BY order_item_id DESC LIMIT 1;"
```

---

For full details, see: **BUG_FIXES_DOCUMENTATION.md**
