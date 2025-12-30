# GoldenMunch POS - Stock Deduction Analysis

## Complete Order Flow & Stock Management

### Database Schema

#### menu_item table:
```sql
stock_quantity INT NOT NULL DEFAULT 0
is_infinite_stock BOOLEAN DEFAULT FALSE
min_stock_level INT DEFAULT 5
status ENUM('available', 'sold_out', 'discontinued')
```

#### customer_order table:
```sql
order_status ENUM('pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled')
payment_status ENUM('unpaid', 'partial', 'paid', 'refunded')
```

---

## Order Lifecycle & Stock Deduction

### Phase 1: Order Creation (Kiosk/Mobile)
**Endpoint:** `POST /api/kiosk/orders`
**Controller:** `order.controller.ts → createOrder()`

**What Happens:**
1. Customer places order through Kiosk or Mobile app
2. Order is created with:
   - `order_status = 'pending'`
   - `payment_status = 'unpaid'`
3. Order items are saved to `order_item` table

**Stock Status:** ❌ **NO stock deduction yet**

**Why?** Orders can be cancelled, payment can fail, or order may not be completed. Deducting stock here would cause inventory issues.

---

### Phase 2: Payment Verification (Cashier)
**Endpoint:** `POST /api/cashier/payment/verify`
**Controller:** `order.controller.ts → verifyPayment()`

**What Happens:**
1. Cashier verifies payment (cash/GCash/PayMaya)
2. System checks stock availability
3. **✅ STOCK IS DEDUCTED HERE** (Current implementation)
4. Payment status updated:
   - `payment_status = 'paid'`
5. Payment transaction recorded

**Stock Deduction Logic:**
```typescript
// For each item in the order
for (const item of orderItems) {
  const menuItem = await getMenuItemById(item.menu_item_id);

  // Skip infinite stock items
  if (menuItem.is_infinite_stock) {
    continue;
  }

  // Validate sufficient stock
  if (menuItem.stock_quantity < item.quantity) {
    throw new Error('Insufficient stock');
  }

  // Deduct stock
  UPDATE menu_item
  SET stock_quantity = stock_quantity - item.quantity
  WHERE menu_item_id = item.menu_item_id;
}
```

**Stock Status:** ✅ **Stock is now deducted**

---

### Phase 3: Order Confirmation (Auto)
**Endpoint:** `PATCH /api/cashier/orders/:id/status`
**Controller:** `order.controller.ts → updateOrderStatus()`

**What Happens:**
1. After payment verification, order status updated:
   - `order_status = 'confirmed'`
   - `payment_status = 'paid'` (auto-set)
2. Order moves to Active Orders list
3. Receipt is printed

**Stock Status:** ✅ **Already deducted in Phase 2**

---

### Phase 4: Order Completion
**Endpoint:** `PATCH /api/cashier/orders/:id/status`
**Controller:** `order.controller.ts → updateOrderStatus()`

**What Happens:**
1. Cashier marks order as completed
2. Order status updated:
   - `order_status = 'completed'`
3. Order moves to Completed Orders list

**Stock Status:** ✅ **Already deducted in Phase 2**

**Why not deduct here?** Stock was already deducted when payment was verified. Deducting again would cause double deduction.

---

## Current Stock Deduction Point

### ✅ Correct Implementation

**Stock deduction happens at:** **Payment Verification** (Phase 2)

**Location:** `server/src/controllers/order.controller.ts` lines 358-397

```typescript
export const verifyPayment = async (req: AuthRequest, res: Response) => {
  await transaction(async (conn: PoolConnection) => {
    // ... payment processing ...

    // ✅ STOCK DEDUCTION
    const [orderItemsRows] = await conn.query(
      'SELECT menu_item_id, quantity FROM order_item WHERE order_id = ?',
      [order_id]
    );
    const orderItems = orderItemsRows as any[];

    for (const item of orderItems) {
      const [menuItemRows] = await conn.query(
        'SELECT is_infinite_stock, stock_quantity, name FROM menu_item WHERE menu_item_id = ?',
        [item.menu_item_id]
      );
      const menuItem = getFirstRow<any>(menuItemRows);

      if (!menuItem) {
        throw new AppError(`Menu item ${item.menu_item_id} not found`, 404);
      }

      // Skip infinite stock items
      if (menuItem.is_infinite_stock) {
        continue;
      }

      // Validate sufficient stock
      const currentStock = parseInt(menuItem.stock_quantity || 0);
      const requestedQty = parseInt(item.quantity || 0);

      if (currentStock < requestedQty) {
        throw new AppError(
          `Insufficient stock for ${menuItem.name}. Available: ${currentStock}, Required: ${requestedQty}`,
          400
        );
      }

      // Deduct stock
      await conn.query(
        'UPDATE menu_item SET stock_quantity = stock_quantity - ? WHERE menu_item_id = ?',
        [requestedQty, item.menu_item_id]
      );
    }

    // ... update payment status ...
  });
};
```

---

## Why This Is the Correct Approach

### ✅ Advantages:

1. **Payment-Based Deduction**
   - Stock only deducts when payment is confirmed
   - Prevents inventory issues from unpaid/cancelled orders
   - Ensures cash flow matches inventory movement

2. **Transaction Safety**
   - All operations happen in a database transaction
   - If stock deduction fails → entire payment verification fails
   - Atomic operation: either everything succeeds or nothing changes

3. **Stock Validation**
   - Checks stock availability BEFORE accepting payment
   - Prevents overselling
   - Immediate feedback if item is out of stock

4. **Infinite Stock Support**
   - Items marked as `is_infinite_stock` never deplete
   - Useful for beverages, coffee, etc.

### ❌ Why NOT to deduct at order creation:

- Orders can be cancelled
- Payment may fail
- Customer may abandon order
- Would need complex stock reservation system
- Would cause "phantom" stock depletion

### ❌ Why NOT to deduct at order completion:

- Order is already paid
- Stock was already consumed/sold
- Would delay inventory accuracy
- Cashier might forget to mark as completed

---

## Stock Flow Example

### Example Order: 2x Chocolate Cake

**Initial State:**
- Menu Item: "Chocolate Cake"
- Stock: 10 units
- Status: available

**Step 1: Customer Places Order (Kiosk)**
- Order created (pending)
- **Stock:** 10 units (unchanged) ✅

**Step 2: Cashier Verifies Payment**
- Payment verified
- **Stock:** 10 - 2 = 8 units ✅
- Order status → confirmed
- Receipt printed

**Step 3: Cashier Prepares Order**
- (No stock change)
- **Stock:** 8 units ✅

**Step 4: Cashier Marks as Completed**
- Order status → completed
- **Stock:** 8 units ✅

**Final State:**
- Menu Item: "Chocolate Cake"
- Stock: 8 units
- Status: available (or sold_out if stock = 0)

---

## Edge Cases Handled

### 1. Insufficient Stock
```
Customer orders: 5x Chocolate Cake
Available stock: 3

Result: Payment verification FAILS
Error: "Insufficient stock for Chocolate Cake. Available: 3, Required: 5"
Stock: Unchanged (3 units)
```

### 2. Infinite Stock Items
```
Customer orders: 10x Coffee
Menu item: is_infinite_stock = TRUE

Result: Payment verification SUCCEEDS
Stock: Unchanged (infinite)
```

### 3. Mixed Order
```
Order:
- 2x Chocolate Cake (finite stock: 5 available)
- 3x Coffee (infinite stock)

Result:
- Chocolate Cake stock: 5 - 2 = 3 units
- Coffee stock: Unchanged (infinite)
```

### 4. Transaction Rollback
```
Order with 3 items:
- Item 1: Stock deducted successfully
- Item 2: Insufficient stock → ERROR

Result: Transaction rolls back
- Item 1 stock: Reverted to original
- Order payment status: Still unpaid
```

---

## Monitoring & Alerts

### Low Stock Detection
When `stock_quantity` falls below `min_stock_level`, item should be flagged for restocking.

### Out of Stock
When `stock_quantity = 0`, item status should auto-update to `'sold_out'`.

### Stock Movement Audit
Every stock deduction should be traceable to:
- Order ID
- Timestamp
- Cashier who verified payment
- Quantities sold

---

## Conclusion

✅ **Stock deduction is correctly implemented**

**Current behavior:**
- Stock deducts when cashier verifies payment
- Transaction-safe with rollback on failure
- Validates stock availability before accepting payment
- Supports infinite stock items
- Prevents double deduction

**This is the optimal approach for a POS system.**

No changes needed - the implementation is working as designed.
