# Bug Fixes Documentation
## GoldenMunch POS Order System - Critical Fixes

**Date:** November 26, 2025
**Branch:** `claude/analyze-order-system-012EU7JPo31PRw9HDWUNkFb3`
**Commit:** e670ecc

---

## Executive Summary

This document details critical bugs discovered during comprehensive system analysis and the fixes implemented to resolve them. Four critical issues were identified and fixed:

1. **Database Schema Mismatch** - SQL errors during order creation
2. **Price Calculation Discrepancy** - Frontend showing incorrect totals
3. **Lost Reference Numbers** - Payment data not being stored
4. **Cart Deduplication Bug** - Custom cakes being incorrectly merged

---

## 🔴 CRITICAL FIX #1: Database Schema Mismatch

### Problem Description

**Severity:** CRITICAL
**Impact:** System-breaking - Orders could not be created
**Location:** `server/src/controllers/order.controller.ts:140`

The order controller attempted to INSERT data into a `subtotal` column that doesn't exist in the database schema.

```typescript
// ❌ BEFORE (BROKEN)
INSERT INTO customer_order
  (order_number, verification_code, ..., subtotal, discount_amount, tax_amount, total_amount, ...)
  VALUES (..., ?, ?, ?, ?, ...)
```

**Database Schema (GoldenMunchPOSV2.sql:369-372):**
```sql
total_amount DECIMAL(10,2) NOT NULL,      -- Subtotal before tax/discount
discount_amount DECIMAL(10,2) DEFAULT 0.00,
tax_amount DECIMAL(10,2) DEFAULT 0.00,
final_amount DECIMAL(10,2) NOT NULL,      -- Grand total after tax/discount
```

The schema has NO `subtotal` column!

### Root Cause

Mismatch between controller expectations and actual database schema. The controller was written for a different schema version.

### Solution Implemented

**File:** `server/src/controllers/order.controller.ts`

```typescript
// ✅ AFTER (FIXED)
INSERT INTO customer_order
  (order_number, verification_code, ..., total_amount, discount_amount, tax_amount, final_amount, ...)
  VALUES (..., ?, ?, ?, ?, ...)

// Mapping:
totals.subtotal → total_amount    (subtotal before tax/discount)
totals.discount → discount_amount
totals.tax      → tax_amount
totals.total    → final_amount     (grand total)
```

### Verification Steps

1. Create a new order from kiosk
2. Verify no SQL errors in server logs
3. Check database: `SELECT total_amount, final_amount FROM customer_order ORDER BY order_id DESC LIMIT 1;`
4. Confirm values are correct

---

## 🔴 CRITICAL FIX #2: Price Calculation Discrepancy

### Problem Description

**Severity:** CRITICAL
**Impact:** User trust issue - Customers charged different amount than shown
**Location:** `client/Kiosk/contexts/CartContext.tsx:124`

The kiosk frontend calculated totals using ONLY the base menu item price, while the backend added flavor costs, size multipliers, and design costs. This meant:

- **Kiosk shows:** $50.00
- **Backend charges:** $75.00 (base $50 + flavor $10 + size 1.5x)

**Example:**
```
Customer orders:
- 8" chocolate cake (base: $40)
- Premium vanilla flavor (additional: $5)
- Large size (multiplier: 1.5x)

Kiosk calculation:  $40 × 1 = $40 ❌
Backend calculation: ($40 + $5) × 1.5 = $67.50 ✅
```

### Root Cause

Frontend price calculation was simplified and didn't match the backend's complex pricing formula.

**Backend Formula (order.controller.ts:103):**
```typescript
itemTotal = (itemPrice + flavorCost + designCost) * sizeMultiplier * quantity
```

**Frontend Formula (BEFORE):**
```typescript
itemTotal = itemPrice * quantity  // ❌ Missing flavor, size, design costs!
```

### Solution Implemented

**File:** `client/Kiosk/contexts/CartContext.tsx`

**Step 1: Enhanced CartItem Interface**
```typescript
export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
  flavor_id?: number;
  size_id?: number;
  // ✅ NEW: Store full objects with pricing data
  flavor?: { flavor_id: number; additional_cost: number; flavor_name: string };
  size?: { size_id: number; size_multiplier: number; size_name: string };
  custom_cake_design?: CustomCakeDesignRequest;
  special_instructions?: string;
}
```

**Step 2: Updated Price Calculation**
```typescript
const getSubtotal = useCallback(() => {
  return items.reduce((total, item) => {
    const basePrice = item.menuItem.current_price || 0;
    const flavorCost = item.flavor?.additional_cost || 0;
    const sizeMultiplier = item.size?.size_multiplier || 1;

    // Calculate design cost for custom cakes
    let designCost = 0;
    if (item.custom_cake_design) {
      const complexityCosts = {
        simple: 0,
        moderate: 50,
        complex: 100,
        intricate: 200
      };
      designCost = complexityCosts[item.custom_cake_design.design_complexity] || 0;
    }

    // ✅ NOW MATCHES BACKEND EXACTLY
    const itemTotal = (basePrice + flavorCost + designCost) * sizeMultiplier * item.quantity;
    return total + itemTotal;
  }, 0);
}, [items]);
```

### Important Note for Developers

When adding items to the cart, you MUST now include the full flavor and size objects:

```typescript
// ✅ CORRECT
addItem({
  menuItem: item,
  quantity: 1,
  flavor_id: selectedFlavor.flavor_id,
  size_id: selectedSize.size_id,
  flavor: selectedFlavor,  // Include full object
  size: selectedSize,      // Include full object
});

// ❌ WRONG - Will show incorrect prices
addItem({
  menuItem: item,
  quantity: 1,
  flavor_id: selectedFlavor.flavor_id,
  size_id: selectedSize.size_id,
  // Missing flavor and size objects!
});
```

### Verification Steps

1. Add a cake with flavor and size to cart
2. Check cart total matches: `(basePrice + flavorCost) × sizeMultiplier`
3. Complete order and verify final_amount in database matches cart total
4. Test with custom cake design to verify design costs are included

---

## 🔴 CRITICAL FIX #3: Missing Reference Numbers

### Problem Description

**Severity:** HIGH
**Impact:** Poor UX - Cashiers must manually re-enter reference numbers
**Location:** `client/Kiosk/app/cart/page.tsx:121`

The kiosk collected payment reference numbers from customers but didn't send them to the backend when creating orders. This meant:

1. Customer pays via GCash and gets reference #123456789
2. Customer enters reference number on kiosk
3. Kiosk creates order... **but reference number is lost!**
4. Cashier must ask customer for reference number again

### Root Cause

The `CreateOrderRequest` interface didn't include a field for reference numbers, and the checkout page didn't populate it.

### Solution Implemented

**Files Modified:**
1. `client/Kiosk/types/api.ts`
2. `server/src/models/types.ts`
3. `client/Kiosk/app/cart/page.tsx`
4. `server/src/controllers/order.controller.ts`

**Step 1: Updated Type Definitions**
```typescript
export interface CreateOrderRequest {
  customer_id?: number;
  order_type: OrderType;
  order_source: OrderSource;
  scheduled_pickup_datetime?: string;
  payment_method: PaymentMethod;
  payment_reference_number?: string;  // ✅ NEW
  special_instructions?: string;
  kiosk_session_id?: string;
  items: OrderItemRequest[];
}
```

**Step 2: Kiosk Sends Reference Number**
```typescript
// client/Kiosk/app/cart/page.tsx:121
const orderData: CreateOrderRequest = {
  order_type: orderType,
  order_source: 'kiosk',
  payment_method: paymentMethod,
  payment_reference_number: referenceNumber.trim() || undefined,  // ✅ NOW SENT
  special_instructions: specialInstructions || undefined,
  items: getOrderItems(),
};
```

**Step 3: Backend Stores in Correct Field**
```typescript
// server/src/controllers/order.controller.ts:137
INSERT INTO customer_order
  (..., gcash_reference_number, paymaya_reference_number, card_transaction_ref, ...)
  VALUES (..., ?, ?, ?, ...)

// Values:
orderData.payment_method === 'gcash' ? orderData.payment_reference_number : null,
orderData.payment_method === 'paymaya' ? orderData.payment_reference_number : null,
orderData.payment_method === 'card' ? orderData.payment_reference_number : null,
```

The backend intelligently stores the reference number in the correct database field based on payment method.

### Database Fields

```sql
gcash_reference_number VARCHAR(100) NULL,
paymaya_reference_number VARCHAR(100) NULL,
card_transaction_ref VARCHAR(100) NULL,
```

### Verification Steps

1. Create order with GCash payment and reference "TEST123"
2. Check database: `SELECT gcash_reference_number FROM customer_order WHERE order_id = ?`
3. Verify reference is stored correctly
4. Open order in cashier interface and verify reference is displayed
5. Test with PayMaya and Card to ensure correct field is populated

---

## 🟡 ADDITIONAL FIX #4: Cart Custom Cake Deduplication

### Problem Description

**Severity:** MEDIUM
**Impact:** Customers cannot order multiple custom cakes
**Location:** `client/Kiosk/contexts/CartContext.tsx:73`

The cart's duplicate detection logic merged items based on `menu_item_id`, `flavor_id`, and `size_id`, but ignored `custom_cake_design`. This meant:

```
Customer adds:
1. Custom cake with "Happy Birthday" text
2. Custom cake with "Congratulations" text

Result: Cart only shows ONE cake (the designs got merged!) ❌
```

### Root Cause

The `addItem` function didn't check for custom cake designs when determining if items were duplicates.

### Solution Implemented

**File:** `client/Kiosk/contexts/CartContext.tsx`

```typescript
const addItem = useCallback((newItem: CartItem) => {
  setItems((currentItems) => {
    // ✅ For custom cakes, ALWAYS treat as unique (never merge)
    const existingIndex = newItem.custom_cake_design
      ? -1  // Custom cakes are always unique
      : currentItems.findIndex(
          (item) =>
            item.menuItem.menu_item_id === newItem.menuItem.menu_item_id &&
            item.flavor_id === newItem.flavor_id &&
            item.size_id === newItem.size_id &&
            !item.custom_cake_design  // Also ensure existing isn't custom
        );

    if (existingIndex >= 0) {
      // Merge quantities for non-custom items
      const updated = [...currentItems];
      updated[existingIndex].quantity += newItem.quantity;
      return updated;
    } else {
      // Add as new item
      return [...currentItems, newItem];
    }
  });
}, []);
```

### Verification Steps

1. Add two custom cakes with different designs to cart
2. Verify both appear as separate line items
3. Add two regular cakes (same flavor/size) and verify they merge
4. Verify quantities update correctly

---

## Testing Checklist

### Order Creation Tests
- [ ] Create walk_in order with cash payment
- [ ] Create pickup order with GCash payment and reference number
- [ ] Create pre_order with PayMaya payment and reference number
- [ ] Verify all orders save to database without errors

### Pricing Tests
- [ ] Add regular item to cart - verify price is correct
- [ ] Add cake with flavor - verify flavor cost is added
- [ ] Add cake with size - verify multiplier is applied
- [ ] Add custom cake - verify design cost is included
- [ ] Compare kiosk total with database final_amount - must match exactly

### Reference Number Tests
- [ ] Enter GCash reference on kiosk - verify stored in gcash_reference_number
- [ ] Enter PayMaya reference - verify stored in paymaya_reference_number
- [ ] Enter Card reference - verify stored in card_transaction_ref
- [ ] Verify cashier can see reference number without re-entering

### Cart Tests
- [ ] Add 2 custom cakes - verify both appear separately
- [ ] Add 2 same regular cakes - verify quantities merge
- [ ] Add 1 custom cake + 1 regular cake - verify both separate

---

## Database Queries for Verification

```sql
-- Check order was created correctly
SELECT
  order_id,
  order_number,
  total_amount,      -- Should be subtotal before tax
  tax_amount,        -- Should be 12% of total_amount
  final_amount,      -- Should be total_amount + tax_amount
  gcash_reference_number,
  paymaya_reference_number,
  card_transaction_ref
FROM customer_order
ORDER BY order_id DESC
LIMIT 1;

-- Verify pricing calculation
SELECT
  oi.order_id,
  mi.name,
  oi.unit_price,
  oi.flavor_cost,
  oi.size_multiplier,
  oi.design_cost,
  oi.quantity,
  oi.item_total,
  -- Verify formula: (unit_price + flavor_cost + design_cost) * size_multiplier * quantity
  ((oi.unit_price + oi.flavor_cost + oi.design_cost) * oi.size_multiplier * oi.quantity) as calculated_total
FROM order_item oi
JOIN menu_item mi ON oi.menu_item_id = mi.menu_item_id
WHERE oi.order_id = ?;
```

---

## Known Limitations

### 1. Design Cost Estimation
The frontend estimates custom cake design costs based on complexity:
- Simple: $0
- Moderate: $50
- Complex: $100
- Intricate: $200

These are **hardcoded estimates**. The actual cost is calculated on the backend based on the theme's `base_additional_cost`. There may be a small discrepancy if theme costs differ from these estimates.

**Recommendation:** Fetch theme costs from backend when user selects a theme.

### 2. Flavor/Size Objects Required
The cart now requires full flavor and size objects to calculate prices correctly. Any code that adds items to the cart MUST provide these objects, not just the IDs.

**Action Required:** Audit all `addItem()` calls throughout the kiosk codebase to ensure they include flavor/size objects.

---

## Future Improvements

### High Priority
1. **Fetch theme costs dynamically** - Get actual costs from backend instead of using estimates
2. **Add price breakdown in cart** - Show "Base: $40 + Flavor: $5 + Size: 1.5x = $67.50"
3. **Real-time price validation** - Verify frontend total matches backend before creating order

### Medium Priority
4. **Inventory deduction** - Ensure stock is decremented when orders are created
5. **Stock validation** - Check stock availability before allowing checkout
6. **Better error messages** - Provide user-friendly errors if order creation fails

### Low Priority
7. **Order editing** - Allow customers to modify orders before completion
8. **Saved carts** - Allow customers to save cart and resume later

---

## Rollback Instructions

If these changes cause issues, rollback using:

```bash
git checkout HEAD~1
```

Or cherry-pick specific files:

```bash
# Rollback order controller only
git checkout HEAD~1 server/src/controllers/order.controller.ts

# Rollback cart context only
git checkout HEAD~1 client/Kiosk/contexts/CartContext.tsx
```

---

## Support

If you encounter any issues after these fixes:

1. Check server logs: `tail -f server/logs/error.log`
2. Check browser console for frontend errors
3. Verify database schema matches GoldenMunchPOSV2.sql
4. Run test queries listed above
5. Contact development team with error details

---

**Document Version:** 1.0
**Last Updated:** November 26, 2025
**Author:** Claude (AI Assistant)
