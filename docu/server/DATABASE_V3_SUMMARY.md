# 🎯 GoldenMunchPOS V3 - Unified Database Schema

## ✨ What's New

**ONE FILE TO RULE THEM ALL!**

Instead of running 4 separate SQL files, you now have **ONE comprehensive schema** that does everything.

### Before (V2):
```bash
mysql -u root -p GoldenMunchPOS < GoldenMunchPOSV2.sql
mysql -u root -p GoldenMunchPOS < custom_cake_request_migration.sql
mysql -u root -p GoldenMunchPOS < create_temp_data.sql
mysql -u root -p GoldenMunchPOS < update_credentials.sql
```

### Now (V3):
```bash
mysql -u root -p < GoldenMunchPOSV3.sql
```

**That's it! Done! ✅**

---

## 📦 What's Included

### 🗄️ Complete Database Structure

**40 Tables:**
1. User Management (3 tables)
   - `roles` - User roles
   - `admin` - Admin users
   - `cashier` - Cashier users

2. Product Catalog (6 tables)
   - `suppliers` - Inventory suppliers
   - `category` - Product categories
   - `menu_item` - Products/items
   - `menu_item_price` - Pricing tiers
   - `category_has_menu_item` - Many-to-many relationship
   - `promotion_rules` - Discounts and promotions
   - `promotion_applicable_items` - Promotion items
   - `promotion_applicable_categories` - Promotion categories
   - `tax_rules` - Tax configuration

3. Custom Cake System (9 tables)
   - `cake_flavors` - Available flavors
   - `cake_sizes` - Available sizes
   - `custom_cake_theme` - Themes (birthday, wedding, etc.)
   - `custom_cake_design` - Pre-made templates
   - `custom_cake_daily_capacity` - Production limits
   - `qr_code_sessions` - 30-minute QR sessions
   - `custom_cake_request` - Main custom orders
   - `custom_cake_request_images` - 3D screenshots
   - `custom_cake_notifications` - Email notifications

4. Orders & Payments (8 tables)
   - `customer` - Customer information
   - `customer_order` - Main orders
   - `order_item` - Order line items
   - `order_timeline` - Status history
   - `payment_transaction` - Payment records
   - `refund_request` - Refund management
   - `customer_feedback` - Ratings and reviews
   - `promotion_usage_log` - Promo usage tracking

5. Inventory (4 tables)
   - `stock_adjustment_reason` - Adjustment categories
   - `inventory_transaction` - Stock movements
   - `inventory_alert` - Low stock alerts
   - `waste_tracking` - Waste management

6. Analytics (2 tables)
   - `menu_item_daily_stats` - Daily performance
   - `popularity_history` - Trend tracking

7. Kiosk (2 tables)
   - `kiosk_settings` - Kiosk configuration
   - `kiosk_session` - Customer sessions

**2 Views:**
- `v_pending_custom_cakes` - Pending review requests
- `v_approved_custom_cakes` - Approved requests

**2 Triggers:**
- `trg_calculate_estimated_price` - Auto-calculate price on submission
- `trg_update_qr_session_on_submit` - Mark QR session as used

**2 Stored Procedures:**
- `sp_expire_qr_sessions()` - Expire old QR sessions
- `sp_get_custom_cake_details(request_id)` - Get complete cake details

### 🎨 Initial Data Included

**Pre-loaded and ready to use:**

✅ **Roles:**
- Super Admin
- Manager
- Supervisor

✅ **Default Admin:**
- Username: `admin`
- Password: `admin123`
- Email: admin@goldenmunch.com

✅ **Default Cashier:**
- Code: `CASH001`
- PIN: `1234`
- Email: cashier@goldenmunch.com

✅ **Stock Adjustment Reasons:**
- Purchase Order Received
- Sales
- Spoilage
- Damaged in Transit
- Expired
- Theft/Loss
- Customer Return
- Inventory Count Adjustment
- Production

✅ **Suppliers:**
- Manila Bakery Supplies Inc.
- Premium Flour Mills
- Chocolate Dreams Co.

✅ **Categories:**
- Cakes
- Pastries
- Breads
- Beverages
- Custom Cakes

✅ **Cake Flavors (7 flavors):**
- Chocolate ($100/tier)
- Vanilla ($80/tier)
- Strawberry ($90/tier)
- Red Velvet ($120/tier) - Premium
- Ube ($110/tier) - Specialty
- Mocha ($115/tier) - Premium
- Lemon ($85/tier)

✅ **Cake Sizes (5 sizes):**
- 6" Small (8 servings) - 1.0x price
- 8" Medium (16 servings) - 1.5x price
- 10" Large (24 servings) - 2.0x price
- 12" XL (36 servings) - 2.5x price
- 14" Party (48 servings) - 3.0x price

✅ **Custom Cake Themes (7 themes):**
- Birthday (+₱200)
- Wedding (+₱500)
- Anniversary (+₱300)
- Baby Shower (+₱250)
- Graduation (+₱250)
- Corporate (+₱400)
- Christmas (+₱300)

✅ **Tax Rules:**
- VAT 12% (Not inclusive)
- Service Charge 5% (Dine-in only, inactive by default)

---

## 🔑 Database Normalization

**V3 is fully normalized following database best practices:**

### 1st Normal Form (1NF) ✓
- All tables have primary keys
- No repeating groups
- Atomic values only

### 2nd Normal Form (2NF) ✓
- All non-key attributes depend on entire primary key
- No partial dependencies

### 3rd Normal Form (3NF) ✓
- No transitive dependencies
- Proper foreign key relationships
- Data integrity enforced

### Key Features:
- ✅ **Proper Foreign Keys** - All relationships defined with ON DELETE/ON UPDATE rules
- ✅ **Cascading Deletes** - Related data cleaned up automatically
- ✅ **Indexes** - Performance optimized with strategic indexes
- ✅ **FULLTEXT Indexes** - Fast searching on name, description, phone, email
- ✅ **CHECK Constraints** - Data validation at database level
- ✅ **ENUM Types** - Controlled vocabulary for statuses
- ✅ **JSON Fields** - Flexible data for decorations, configurations
- ✅ **Timestamps** - Audit trail with created_at/updated_at
- ✅ **InnoDB Engine** - ACID compliance and foreign key support

---

## 🎯 Integration with System

### Perfect Alignment with Code

**1. TypeScript Types Match Database:**
```typescript
// client/cashieradmin/types/api.ts
export interface CustomCakeRequest {
    request_id: number;
    session_token: string;
    // ... exactly matches database columns
}
```

**2. API Endpoints Match Tables:**
```typescript
// All endpoints query the correct tables
GET  /api/custom-cake/session/:token     → qr_code_sessions
GET  /api/custom-cake/options             → cake_flavors, cake_sizes, themes
POST /api/custom-cake/save-draft          → custom_cake_request
POST /api/custom-cake/submit              → Updates status to 'pending_review'
```

**3. Views Match Dashboard Queries:**
```sql
-- Admin dashboard uses:
SELECT * FROM v_pending_custom_cakes;
SELECT * FROM v_approved_custom_cakes;
```

**4. Triggers Match Business Logic:**
```sql
-- When status changes from 'draft' to 'pending_review':
- Auto-calculates estimated_price
- Sets submitted_at timestamp
- Marks QR session as 'used'
```

---

## 📊 Database Size & Performance

### Estimated Size:
- **Empty schema:** ~2 MB
- **With initial data:** ~2.5 MB
- **After 1000 orders:** ~15-20 MB
- **After 10,000 orders:** ~150-200 MB

### Performance Optimizations:
✅ **40+ Indexes** strategically placed
✅ **FULLTEXT search** on customer/product names
✅ **Composite indexes** for common query patterns
✅ **Foreign key indexes** for JOIN performance
✅ **Partitioning ready** for large tables (orders, transactions)

### Recommended Maintenance:
```sql
-- Weekly: Optimize tables
OPTIMIZE TABLE customer_order, order_item, custom_cake_request;

-- Monthly: Analyze tables
ANALYZE TABLE menu_item, customer, payment_transaction;

-- Expire old QR sessions (can run via cron)
CALL sp_expire_qr_sessions();
```

---

## 🚀 Deployment Guide

### Quick Start:
```bash
# 1. Navigate to schema directory
cd server/databaseSchema

# 2. Run V3 schema (creates everything)
mysql -u root -p < GoldenMunchPOSV3.sql

# 3. Verify
mysql -u root -p GoldenMunchPOS -e "SHOW TABLES;"
```

### Verification Checklist:
```bash
# Check table count (should be 40)
mysql -u root -p GoldenMunchPOS -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='GoldenMunchPOS';"

# Check views (should be 2)
mysql -u root -p GoldenMunchPOS -e "SHOW FULL TABLES WHERE table_type='VIEW';"

# Check triggers (should be 2)
mysql -u root -p GoldenMunchPOS -e "SHOW TRIGGERS;"

# Check procedures (should be 2)
mysql -u root -p GoldenMunchPOS -e "SHOW PROCEDURE STATUS WHERE db='GoldenMunchPOS';"

# Test login
mysql -u root -p GoldenMunchPOS -e "SELECT * FROM admin WHERE username='admin';"
```

### Post-Setup:
```bash
# 1. Update backend .env
cd ../../server
cp .env.example .env
nano .env  # Set DB_PASSWORD

# 2. Test connection
npm install
npm run build
npm start

# Should see: "Database connection established"
```

---

## 🔧 Maintenance & Backups

### Daily Backup:
```bash
# Full backup
mysqldump -u root -p GoldenMunchPOS > backup_$(date +%Y%m%d).sql

# Compressed backup
mysqldump -u root -p GoldenMunchPOS | gzip > backup_$(date +%Y%m%d).sql.gz
```

### Restore from Backup:
```bash
# Restore
mysql -u root -p GoldenMunchPOS < backup_20251123.sql

# Or restore compressed
gunzip < backup_20251123.sql.gz | mysql -u root -p GoldenMunchPOS
```

### Selective Table Backup:
```bash
# Backup only custom cake data
mysqldump -u root -p GoldenMunchPOS \
  custom_cake_request \
  custom_cake_request_images \
  qr_code_sessions \
  > custom_cakes_backup.sql
```

---

## 📝 Common Queries

### Check Recent Orders:
```sql
SELECT
    order_number,
    order_type,
    total_amount,
    payment_status,
    created_at
FROM customer_order
ORDER BY created_at DESC
LIMIT 10;
```

### Check Custom Cake Requests:
```sql
SELECT * FROM v_pending_custom_cakes;
SELECT * FROM v_approved_custom_cakes;
```

### Sales Summary:
```sql
SELECT
    DATE(created_at) as date,
    COUNT(*) as orders,
    SUM(total_amount) as revenue
FROM customer_order
WHERE payment_status = 'paid'
GROUP BY DATE(created_at)
ORDER BY date DESC
LIMIT 30;
```

### Popular Items:
```sql
SELECT
    mi.name,
    SUM(oi.quantity) as total_sold,
    SUM(oi.subtotal) as revenue
FROM order_item oi
JOIN menu_item mi ON oi.menu_item_id = mi.menu_item_id
GROUP BY mi.menu_item_id
ORDER BY total_sold DESC
LIMIT 10;
```

---

## ⚠️ Important Notes

### Security:
- ✅ Change default credentials immediately after first login
- ✅ Use strong passwords (not admin123/1234)
- ✅ Limit database access to backend server only
- ✅ Regular backups to prevent data loss
- ✅ Enable MySQL slow query log to monitor performance

### Credentials to Change:
```sql
-- Change admin password
UPDATE admin
SET password_hash = '$2b$10$NEW_HASH_HERE'
WHERE username = 'admin';

-- Change cashier PIN
UPDATE cashier
SET pin_hash = '$2b$10$NEW_HASH_HERE'
WHERE cashier_code = 'CASH001';
```

### Data Retention:
- Orders: Keep indefinitely (archive yearly)
- QR Sessions: Auto-expire after 30 minutes
- Payment Transactions: Keep for 7 years (compliance)
- Feedback: Keep for 2 years
- Waste Tracking: Keep for 1 year

---

## 🎉 Success!

Your database is now:
- ✅ Fully normalized
- ✅ Production-ready
- ✅ Aligned with entire system
- ✅ Optimized for performance
- ✅ Loaded with test data
- ✅ Ready to use!

**Next Step:** Follow `COMPLETE_SETUP_GUIDE.md` to set up the rest of the system!

---

**Schema Version:** 3.0
**Created:** November 23, 2025
**Tables:** 40
**Views:** 2
**Triggers:** 2
**Procedures:** 2
**Lines of Code:** 1,160+
