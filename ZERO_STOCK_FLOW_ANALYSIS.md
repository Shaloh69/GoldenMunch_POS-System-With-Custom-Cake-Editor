# Zero Stock Flow Analysis

## Complete Flow: What Happens When Stock Reaches 0

### 1. Frontend: Stock Adjustment (Admin Menu Management)

**File:** `client/cashieradmin/app/admin/menu/page.tsx:482-523`

```typescript
const handleStockAdjust = async (itemId: number, adjustment: number) => {
  const item = items.find((i) => i.menu_item_id === itemId);
  const newStock = Math.max(0, toNumber(item.stock_quantity, 0) + adjustment);

  const updateData: any = {
    stock_quantity: newStock,
  };

  // AUTO STATUS CHANGE
  if (newStock === 0 && item.status === "available") {
    updateData.status = "sold_out";  // ✅ Sets status to sold_out
  } else if (newStock > 0 && item.status === "sold_out") {
    updateData.status = "available";  // ✅ Reverses when stock added
  }

  await MenuService.updateMenuItem(itemId, updateData);
  loadMenuItems();  // ✅ Refreshes data from backend
}
```

**What happens:**
1. User clicks `-` button to reduce stock
2. Stock reaches 0
3. Status automatically set to `"sold_out"`
4. Calls backend API to save changes
5. Refreshes menu items from backend

---

### 2. Backend: Update Menu Item

**File:** `server/src/controllers/admin.controller.ts:56-88`

```typescript
export const updateMenuItem = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const updates = req.body;  // { stock_quantity: 0, status: "sold_out" }

  const allowedColumns = [
    'name', 'description', 'item_type', 'unit_of_measure', 'stock_quantity',
    'is_infinite_stock', 'min_stock_level', 'status', // ✅ status is allowed
    ...
  ];

  const { setClause, values } = buildSafeUpdateQuery(updates, allowedColumns);

  // UPDATE menu_item SET stock_quantity = 0, status = 'sold_out' WHERE menu_item_id = ?
  await query(`UPDATE menu_item SET ${setClause} WHERE menu_item_id = ?`, [...values, id]);

  res.json(successResponse('Menu item updated'));
};
```

**What happens:**
1. Receives `{ stock_quantity: 0, status: "sold_out" }`
2. Validates that `status` is in allowed columns ✅
3. Executes UPDATE query to database
4. Item in database now has `stock_quantity = 0` and `status = 'sold_out'`

---

### 3. Frontend: Reload Menu Items

**File:** `client/cashieradmin/app/admin/menu/page.tsx:225-242`

```typescript
const loadMenuItems = async () => {
  const response = await MenuService.getMenuItems();  // Calls /admin/menu

  if (response.success && response.data) {
    setItems(response.data);  // ✅ Updates items state
  }
};
```

**File:** `client/cashieradmin/services/menu.service.ts:13-15`

```typescript
static async getMenuItems(params?: any) {
  return apiClient.get<MenuItem[]>("/admin/menu", { params });  // ✅ Calls ADMIN endpoint
}
```

**What happens:**
1. Calls `GET /api/admin/menu` endpoint
2. This is the **ADMIN** endpoint (not kiosk)
3. Should return ALL items including sold_out

---

### 4. Backend: Get All Menu Items (Admin Endpoint)

**File:** `server/src/controllers/admin.controller.ts:99-200`

```typescript
export const getAllMenuItems = async (req: AuthRequest, res: Response) => {
  let sql = `
    SELECT mi.*, (...price subquery...) as current_price
    FROM menu_item mi
    WHERE 1=1  // ✅ NO status filter!
  `;

  // Only filter deleted items
  if (include_deleted !== 'true') {
    sql += ` AND mi.is_deleted = FALSE`;  // ✅ Only filters is_deleted
  }

  // Optional filters (only if specified in query params)
  if (status) {  // ✅ Only filters if explicitly requested
    sql += ` AND mi.status = ?`;
  }

  // Sort: available → sold_out → discontinued
  sql += ` ORDER BY
    CASE mi.status
      WHEN 'available' THEN 1
      WHEN 'sold_out' THEN 2      // ✅ sold_out items come second
      WHEN 'discontinued' THEN 3
    END,
    mi.is_featured DESC,
    mi.popularity_score DESC`;

  const items = await query(sql, params);
  res.json(successResponse('Menu items retrieved', items));
};
```

**File:** `server/src/routes/index.ts:455`

```typescript
router.get('/admin/menu', authenticateAdmin, asyncHandler(adminController.getAllMenuItems));
```

**What happens:**
1. Executes query that returns ALL items (available, sold_out, discontinued)
2. Only filters out items where `is_deleted = TRUE`
3. Sorts items: available first, sold_out second, discontinued third
4. Returns array of ALL menu items including sold_out items ✅

---

### 5. Frontend: Filter and Display

**File:** `client/cashieradmin/app/admin/menu/page.tsx:154-213`

```typescript
const filteredAndPaginatedItems = useMemo(() => {
  // Filter
  let filtered = items.filter((item) => {
    const matchesSearch = /* ...search logic... */;
    const matchesType = filterType === "all" || item.item_type === filterType;
    const matchesStatus = filterStatus === "all" || item.status === filterStatus;

    return matchesSearch && matchesType && matchesStatus;
  });

  // Sort: sold_out items always last
  filtered.sort((a, b) => {
    const aOutOfStock = a.status === "sold_out" || a.status === "discontinued";
    const bOutOfStock = b.status === "sold_out" || b.status === "discontinued";

    if (aOutOfStock && !bOutOfStock) return 1;  // ✅ sold_out goes to end
    if (!aOutOfStock && bOutOfStock) return -1;

    // Normal sort for items with same status
    ...
  });

  return {
    items: filtered.slice(startIndex, endIndex),
    total: filtered.length,
  };
}, [items, searchQuery, filterType, filterStatus, sortBy, sortOrder, currentPage]);
```

**Initial State:**
```typescript
const [filterStatus, setFilterStatus] = useState<string>("all");  // ✅ Defaults to "all"
```

**What happens:**
1. Receives ALL items from backend (including sold_out)
2. Applies filters:
   - If `filterStatus === "all"` → shows ALL statuses ✅
   - If `filterStatus === "sold_out"` → shows only sold_out
   - If `filterStatus === "available"` → shows only available
3. Sorts items to put sold_out at the end
4. Displays filtered and paginated items

---

## Expected Behavior:

### Admin Menu Management (cashieradmin):
1. ✅ Stock reaches 0
2. ✅ Status automatically changes to "sold_out"
3. ✅ Item stays visible in the list (appears at bottom)
4. ✅ Shows orange "Sold Out" badge
5. ✅ Can still edit, manage, and increase stock

### Kiosk (Kiosk_Web):
1. ✅ Stock reaches 0
2. ✅ Status automatically changes to "sold_out"
3. ✅ Item disappears from kiosk menu (correct!)
4. ✅ Customers can't see or order sold-out items

---

## Debugging Steps:

### If items are still disappearing in Admin Panel:

1. **Check Backend Response:**
   ```bash
   # Run server
   cd server && npm run dev

   # Make request
   curl -H "Authorization: Bearer YOUR_TOKEN" \
        http://localhost:5000/api/admin/menu
   ```

   Expected: Should return items with `"status": "sold_out"`

2. **Check Frontend API Call:**
   - Open browser DevTools → Network tab
   - Click to refresh menu items
   - Look for request to `/api/admin/menu`
   - Verify response includes sold_out items

3. **Check Status Filter:**
   - In Admin Menu Management page
   - Check current filter value (should be "All Status")
   - Try selecting "Sold Out" filter explicitly
   - See if items appear

4. **Check Browser Console:**
   ```javascript
   // In browser console, check state
   // The items should include sold_out status
   ```

5. **Clear Cache:**
   - Hard refresh: Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac)
   - Clear localStorage: `localStorage.clear()`
   - Restart development server

---

## Common Issues:

### Issue 1: Server not restarted
**Solution:** Restart backend server to load new code
```bash
cd server
npm run dev
```

### Issue 2: Old frontend code cached
**Solution:** Clear browser cache and rebuild frontend
```bash
cd client/cashieradmin
rm -rf .next
npm run build
npm run dev
```

### Issue 3: Wrong filter selected
**Solution:** Ensure "All Status" is selected in filter dropdown

### Issue 4: Database not updated
**Solution:** Check database directly
```sql
SELECT menu_item_id, name, stock_quantity, status
FROM menu_item
WHERE stock_quantity = 0;
```
Should show `status = 'sold_out'`

---

## API Endpoints Summary:

| Endpoint | Used By | Returns |
|----------|---------|---------|
| `GET /api/kiosk/menu` | Kiosk_Web | Only `status = 'available'` AND `stock > 0` |
| `GET /api/admin/menu` | cashieradmin | ALL statuses (available, sold_out, discontinued) |

This separation ensures:
- ✅ Customers only see available items
- ✅ Admins see everything for management
