# 🚀 Complete Menu Management System - Implementation Plan

## Database Schema Summary ✅

### Core Tables:
1. **menu_item** - Main items table with:
   - Stock management (stock_quantity, is_infinite_stock, min_stock_level)
   - Status tracking (available/sold_out/discontinued)
   - Popularity tracking (popularity_score, total_orders)
   - Customization (can_customize, can_preorder)
   - Rich metadata (allergen_info, nutritional_info, image_url)

2. **menu_item_price** - Price history with:
   - Date-based pricing
   - Price types (regular/promotion/seasonal/bulk)
   - Created by tracking

3. **inventory_transaction** - Stock history with:
   - Transaction types (in/out/adjustment/return/waste/transfer)
   - Previous/new quantity tracking
   - Reason codes
   - Performed by tracking (admin/cashier)

4. **inventory_alert** - Low stock alerts
5. **stock_adjustment_reason** - Reason codes for adjustments
6. **category_has_menu_item** - Category mapping

### Existing API Endpoints:
- ✅ POST /admin/menu - Create menu item
- ✅ PUT /admin/menu/:id - Update menu item
- ✅ DELETE /admin/menu/:id - Soft delete
- ✅ POST /admin/menu/prices - Add price
- ✅ POST /admin/inventory/adjust - Adjust stock
- ✅ GET /admin/inventory/alerts - Get alerts
- ✅ GET /kiosk/menu - Public menu listing

---

## Implementation Roadmap

### **PHASE 1: Foundation** (30 min)

#### 1.1 Kiosk Auto-Refresh
**File:** `client/Kiosk/app/menu/page.tsx`
**Changes:**
- Add `lastUpdated` state
- Extract `fetchData` function with `showLoading` param
- Add 30-second interval with cleanup
- Add "Last updated" indicator in UI

#### 1.2 Enhanced Types
**File:** `client/cashieradmin/types/api.ts`
**Add:**
```typescript
interface UpdateMenuItemRequest extends Partial<CreateMenuItemRequest> {
  status?: 'available' | 'unavailable' | 'out_of_stock';
}

interface StockAdjustment {
  menu_item_id: number;
  quantity: number;
  transaction_type: 'in' | 'out' | 'adjustment';
  reason_id?: number;
  notes?: string;
}

interface PriceUpdate {
  menu_item_id: number;
  price: number;
  start_date: string;
  end_date: string;
  price_type: 'regular' | 'promotion' | 'seasonal' | 'bulk';
}
```

---

### **PHASE 2: Core CRUD** (1 hour)

#### 2.1 Edit Menu Modal
**New File:** `client/cashieradmin/app/admin/menu/components/EditMenuModal.tsx`
**Features:**
- Pre-populated form with current values
- Tabbed interface:
  - Tab 1: General Info
  - Tab 2: Stock & Inventory
  - Tab 3: Pricing
  - Tab 4: Advanced
- Image preview with replace option
- Form validation
- Update API call

#### 2.2 Stock Quick Actions
**File:** `client/cashieradmin/app/admin/menu/page.tsx`
**Add:**
- Inline +/- buttons in stock column
- Direct stock adjustment (no modal)
- Optimistic UI updates
- API: POST /admin/inventory/adjust

#### 2.3 Service Layer Updates
**File:** `client/cashieradmin/services/menu.service.ts`
**Add methods:**
```typescript
static async quickStockAdjust(id: number, adjustment: number): Promise<ApiResponse>
static async getStockHistory(id: number): Promise<ApiResponse<InventoryTransaction[]>>
static async getPriceHistory(id: number): Promise<ApiResponse<MenuItemPrice[]>>
```

---

### **PHASE 3: Advanced Features** (1.5 hours)

#### 3.1 Search & Filter System
**New File:** `client/cashieradmin/app/admin/menu/hooks/useMenuFilters.ts`
**Features:**
- Debounced search (300ms)
- Filter by:
  - Item type (dropdown)
  - Status (chips)
  - Stock level (All/Low/Out)
  - Featured items (toggle)
- Sort by:
  - Name (A-Z, Z-A)
  - Price (High-Low, Low-High)
  - Stock (High-Low, Low-High)
  - Popularity (High-Low)
  - Date added (Newest, Oldest)

#### 3.2 Pagination
**Implementation:**
- Client-side pagination (simple)
- Items per page: 10/25/50/100
- Page navigator with jump-to-page
- Total count display
- Keyboard shortcuts (Prev/Next)

#### 3.3 Enhanced Table UI
**File:** `client/cashieradmin/app/admin/menu/components/MenuTable.tsx`
**Features:**
- Sticky header
- Image thumbnail column
- Sortable columns
- Row hover actions
- Expandable rows for details
- Color-coded stock levels:
  - 🟢 Green: > min_stock_level * 2
  - 🟡 Yellow: <= min_stock_level * 2
  - 🔴 Red: <= min_stock_level
  - ⚫ Gray: Out of stock

---

### **PHASE 4: Price Management** (45 min)

#### 4.1 Price Manager Modal
**New File:** `client/cashieradmin/app/admin/menu/components/PriceManager.tsx`
**Features:**
- Current price display
- Price history table
- Add new price form:
  - Price amount
  - Start date
  - End date
  - Price type (regular/promotion/seasonal)
- Active price indicator
- Future price preview
- Validation: end_date >= start_date

#### 4.2 Quick Price Edit
**Add to table:**
- Click price to edit inline
- Modal for detailed changes
- Price change confirmation

---

### **PHASE 5: Bulk Operations** (45 min)

#### 5.1 Selection System
**Features:**
- Checkbox column in table
- "Select All" header checkbox
- Selected count indicator
- Clear selection button

#### 5.2 Bulk Actions Bar
**Appears when items selected:**
- Bulk delete (with confirmation)
- Bulk status update:
  - Set as Available
  - Set as Unavailable
  - Mark as Featured
- Bulk stock adjustment:
  - Add quantity to all
  - Subtract quantity from all
- Export to CSV

---

### **PHASE 6: Stock Management** (45 min)

#### 6.1 Stock Manager Modal
**New File:** `client/cashieradmin/app/admin/menu/components/StockManager.tsx`
**Features:**
- Current stock display
- Stock adjustment form:
  - Transaction type (in/out/adjustment)
  - Quantity input
  - Reason dropdown
  - Notes textarea
- Stock history table:
  - Date/Time
  - Type
  - Quantity change
  - Previous → New
  - Performed by
  - Reason
  - Notes
- Low stock alerts
- Min stock level editor

#### 6.2 Stock History Endpoint
**Backend:** Add to `admin.controller.ts`
```typescript
export const getStockHistory = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const history = await query(
    `SELECT it.*, sar.reason_description, a.name as admin_name, c.name as cashier_name
     FROM inventory_transaction it
     LEFT JOIN stock_adjustment_reason sar ON it.reason_id = sar.reason_id
     LEFT JOIN admin a ON it.performed_by = a.admin_id AND it.performed_by_role = 'admin'
     LEFT JOIN cashier c ON it.performed_by = c.cashier_id AND it.performed_by_role = 'cashier'
     WHERE it.menu_item_id = ?
     ORDER BY it.created_at DESC
     LIMIT 50`,
    [id]
  );
  res.json(successResponse('Stock history retrieved', history));
};
```

---

### **PHASE 7: UI/UX Polish** (30 min)

#### 7.1 Beautiful Modals
- Smooth animations
- Loading states with skeletons
- Success/error toasts
- Unsaved changes warning
- Keyboard shortcuts (Esc to close, Ctrl+S to save)

#### 7.2 Empty States
- Custom illustrations
- Helpful CTAs
- Feature suggestions

#### 7.3 Responsive Design
- Mobile-optimized modals
- Touch-friendly buttons
- Swipe gestures for mobile

#### 7.4 Performance
- Virtualized table rows (for 100+ items)
- Image lazy loading
- Debounced search
- Optimistic UI updates

---

### **PHASE 8: Analytics Dashboard** (30 min)

#### 8.1 Menu Analytics
**New section in page:**
- Total items count
- Low stock count
- Out of stock count
- Most popular items (top 5)
- Stock value calculation
- Charts:
  - Items by type (pie chart)
  - Stock levels (bar chart)
  - Price distribution (histogram)

---

## File Structure

```
client/cashieradmin/app/admin/menu/
├── page.tsx (main component - 500 lines)
├── components/
│   ├── EditMenuModal.tsx (250 lines)
│   ├── MenuTable.tsx (300 lines)
│   ├── StockManager.tsx (200 lines)
│   ├── PriceManager.tsx (180 lines)
│   ├── BulkActionsBar.tsx (120 lines)
│   ├── FiltersBar.tsx (150 lines)
│   └── MenuAnalytics.tsx (100 lines)
├── hooks/
│   ├── useMenuItems.ts (80 lines)
│   ├── useMenuFilters.ts (120 lines)
│   └── useStockManagement.ts (100 lines)
└── utils/
    ├── menuHelpers.ts (50 lines)
    └── csvExport.ts (60 lines)

client/Kiosk/app/menu/
└── page.tsx (updated with auto-refresh)

server/src/
├── controllers/admin.controller.ts (add stock history endpoint)
└── routes/index.ts (add new route)
```

---

## Testing Checklist

### Kiosk:
- [ ] Auto-refresh works every 30 seconds
- [ ] Last updated time displays
- [ ] Silent refresh doesn't flash UI
- [ ] New items appear automatically
- [ ] Stock changes reflect

### Admin Menu - CRUD:
- [ ] Create item with all fields
- [ ] Edit item with all fields
- [ ] Delete item (soft delete)
- [ ] View item details

### Stock Management:
- [ ] Quick +/- adjustments
- [ ] Stock manager modal
- [ ] View stock history
- [ ] Low stock alerts
- [ ] Min stock level updates

### Price Management:
- [ ] View current price
- [ ] View price history
- [ ] Add new price
- [ ] Edit existing price
- [ ] Date validation

### Search & Filter:
- [ ] Search by name
- [ ] Filter by type
- [ ] Filter by status
- [ ] Filter by stock level
- [ ] Sort by all columns
- [ ] Clear filters

### Pagination:
- [ ] Navigate pages
- [ ] Change items per page
- [ ] Jump to page
- [ ] Keyboard navigation

### Bulk Operations:
- [ ] Select multiple items
- [ ] Select all
- [ ] Bulk delete
- [ ] Bulk status update
- [ ] Bulk stock adjust
- [ ] Export to CSV

### UI/UX:
- [ ] Responsive on mobile
- [ ] Smooth animations
- [ ] Loading states
- [ ] Error handling
- [ ] Success messages
- [ ] Keyboard shortcuts

---

## Implementation Order

1. ✅ Create this plan
2. 🔄 Phase 1: Foundation (Kiosk auto-refresh + types)
3. 🔄 Phase 2: Core CRUD (Edit modal + quick actions)
4. 🔄 Phase 3: Advanced features (Search/filter/pagination)
5. 🔄 Phase 4: Price management
6. 🔄 Phase 5: Bulk operations
7. 🔄 Phase 6: Stock management
8. 🔄 Phase 7: UI polish
9. 🔄 Phase 8: Analytics

**Estimated Total Time:** 5-6 hours
**Start Implementation:** NOW
