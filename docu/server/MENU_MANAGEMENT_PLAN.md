# Menu Management Enhancement Plan

## Current Status ✅
- ✅ Basic Create functionality
- ✅ Delete functionality
- ✅ Display with price/stock/status
- ✅ Safe data handling
- ✅ Error handling

## Enhancements Needed 🚀

### 1. **Kiosk Auto-Refresh** (High Priority)
**Status:** Ready to implement
**Changes:**
- Add interval-based polling every 30 seconds
- Silent background refresh without loading spinner
- Show "last updated" timestamp
- Cleanup interval on component unmount

**File:** `client/Kiosk/app/menu/page.tsx`

**Implementation:**
```typescript
// Add state for last updated
const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

// Refactor fetch into reusable function
const fetchData = async (showLoading = true) => {
  if (showLoading) setLoading(true);
  // ... fetch logic
  setLastUpdated(new Date());
};

// Auto-refresh effect
useEffect(() => {
  const interval = setInterval(() => {
    fetchData(false); // Silent refresh
  }, 30000); // 30 seconds

  return () => clearInterval(interval);
}, []);
```

### 2. **Admin Menu - Full CRUD Operations**

#### A. **Edit Functionality** ⭐
- Edit modal similar to create modal
- Pre-populate form with current values
- Update API call with PUT /admin/menu/:id
- Image replacement option
- Show current image preview

#### B. **Stock Management** 📦
**Quick Stock Adjust:**
- Inline stock increment/decrement buttons
- Bulk stock update modal
- Stock history log
- Low stock alerts with visual indicators

**Features:**
- +/- buttons for quick adjustments
- Modal for detailed stock management
- Infinite stock toggle
- Stock transaction history

#### C. **Price Management** 💰
**Features:**
- Current price display with edit capability
- Price history
- Promotional pricing
- Bulk price updates
- Price change confirmation

#### D. **Advanced Features**
1. **Search & Filter:**
   - Search by name/description
   - Filter by item type
   - Filter by status
   - Filter by stock level
   - Sort by various fields

2. **Bulk Operations:**
   - Bulk delete with selection
   - Bulk status update
   - Bulk price adjustment
   - Export to CSV

3. **Image Management:**
   - Image preview in table
   - Image upload with drag-drop
   - Image cropping tool
   - Multiple image support

4. **Advanced Editing:**
   - Customization options toggle
   - Pre-order settings
   - Preparation time setting
   - Allergen information
   - Nutritional facts

### 3. **UI/UX Improvements** 🎨

#### Table Enhancements:
- **Sticky header** for long lists
- **Pagination** (10/25/50 per page)
- **Column sorting** (click headers)
- **Row actions dropdown** (Edit/Delete/Duplicate)
- **Inline editing** for stock/price
- **Expandable rows** for details
- **Image thumbnails** in table
- **Status badges** with colors
- **Stock level indicators** (low/medium/high)

#### Modal Improvements:
- **Tabbed interface** in edit modal:
  - General Info
  - Pricing
  - Stock & Inventory
  - Images
  - Advanced Options
- **Form validation** with visual feedback
- **Auto-save draft** capability
- **Unsaved changes warning**
- **Field-level help text**

#### Visual Design:
- **Card-based layout** option
- **Grid/List view toggle**
- **Color-coded categories**
- **Charts for analytics**:
  - Stock levels chart
  - Price distribution
  - Sales performance per item
- **Empty states** with helpful actions
- **Loading skeletons** instead of spinners

### 4. **Data Handling Improvements** 🔧

**Already Implemented:** ✅
- Safe price formatting
- Safe number conversion
- Null/undefined handling
- String to number conversion

**Additional:**
- Form validation schema (Zod/Yup)
- Optimistic UI updates
- Real-time validation
- Debounced search

### 5. **API Enhancements Needed** 🔌

**Backend endpoints to add:**
```typescript
// Stock management
PATCH /admin/menu/:id/stock (adjust stock)
GET /admin/menu/:id/stock-history (stock history)

// Price management
GET /admin/menu/:id/prices (price history)
POST /admin/menu/prices/bulk (bulk price update)

// Bulk operations
POST /admin/menu/bulk-update (bulk status/price updates)
POST /admin/menu/bulk-delete (bulk delete)

// Search and filter
GET /admin/menu?search=query&type=cake&status=available&sort=name&order=asc
```

## Implementation Priority 📋

### Phase 1 (Immediate - 1 hour)
1. ✅ Kiosk auto-refresh
2. ⚡ Edit functionality in admin menu
3. ⚡ Stock quick-adjust buttons

### Phase 2 (Next - 2 hours)
4. Search and filter
5. Image preview in table
6. Pagination
7. Better modal UI

### Phase 3 (Later - 3 hours)
8. Price management modal
9. Bulk operations
10. Stock history
11. Advanced analytics

## File Structure

```
client/cashieradmin/app/admin/menu/
├── page.tsx (main component)
├── components/
│   ├── MenuTable.tsx (table component)
│   ├── MenuCard.tsx (card view component)
│   ├── EditMenuModal.tsx (edit modal)
│   ├── StockManager.tsx (stock management)
│   ├── PriceManager.tsx (price management)
│   └── BulkActions.tsx (bulk operations)
└── hooks/
    ├── useMenuItems.ts (data fetching)
    ├── useMenuFilters.ts (filtering logic)
    └── useStockManagement.ts (stock operations)
```

## Tech Stack Additions

- **@tanstack/react-table** for advanced table features
- **react-hook-form** for better form handling
- **zod** for validation schemas
- **react-dropzone** for drag-drop uploads
- **react-hot-toast** for notifications
- **swr** or **@tanstack/react-query** for data fetching

## Testing Checklist

- [ ] Create new menu item
- [ ] Edit existing menu item
- [ ] Delete menu item
- [ ] Update stock (increment/decrement)
- [ ] Update price
- [ ] Upload/replace image
- [ ] Search functionality
- [ ] Filter by type/status
- [ ] Sort columns
- [ ] Pagination navigation
- [ ] Bulk operations
- [ ] Kiosk auto-refresh works
- [ ] Responsive design on mobile
- [ ] Error handling for all operations
- [ ] Loading states for all async operations

## Next Steps

Would you like me to implement:
1. **Quick Win:** Kiosk auto-refresh + Edit functionality (30 min)
2. **Full Package:** All Phase 1 + Phase 2 features (3 hours)
3. **Complete System:** Everything including Phase 3 (6+ hours)

Please let me know which approach you'd prefer, and I'll implement it immediately!
