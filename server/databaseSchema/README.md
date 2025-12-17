# GoldenMunch POS - Database Schema Documentation

## Overview

This directory contains the database schemas for the GoldenMunch POS system. Multiple versions are available depending on your deployment needs.

---

## Schema Versions

### 📦 GoldenMunchPOSV5_Production.sql (RECOMMENDED FOR PRODUCTION)

**Purpose:** Clean, production-ready schema without test data

**Includes:**
- ✅ All table definitions (40+ tables)
- ✅ All stored procedures and triggers
- ✅ All views for analytics
- ✅ Essential seed data:
  - User roles (Super Admin, Manager, Supervisor)
  - Default admin account (username: `admin`, password: `admin123`)
  - Default cashier account (code: `CASH001`, PIN: `1234`)
  - Stock adjustment reasons
  - Default suppliers (3)
  - Product categories (5: Cakes, Pastries, Breads, Beverages, Custom Cakes)
  - Cake flavors (7: Chocolate, Vanilla, Strawberry, Red Velvet, Ube, Mocha, Lemon)
  - Cake sizes (5: from 6" to 14")
  - Custom cake themes (7: Birthday, Wedding, Anniversary, etc.)
  - Tax rules (VAT 12%)
  - System settings and payment configurations
- ❌ **NO test data** (customers, orders, menu items, transactions)

**Use this when:**
- Deploying to production
- Starting fresh with a new bakery/restaurant
- You want to add your own menu items and data
- You need a clean database without dummy data

**File size:** ~2007 lines

---

### 🧪 GoldenMunchPOSV4.sql (DEVELOPMENT/TESTING)

**Purpose:** Complete schema with sample data for testing and development

**Includes:**
- ✅ Everything in V5 Production
- ✅ Sample test data:
  - 10 menu items with prices
  - 4 discount types (Student, Senior Citizen, PWD, Military)
  - 10 sample customers
  - 25 sample orders with order items
  - Sample waste tracking records
  - Sample payment transactions

**Use this when:**
- Setting up a development environment
- Testing the system
- Learning how the system works
- Demonstrating features with sample data

**File size:** ~2100 lines

---

### 📜 GoldenMunchPOSV3.sql (LEGACY)

**Purpose:** Previous version of the schema

**Note:** This is an older version. Use V4 or V5 instead.

---

## Quick Start

### For Production Deployment

```bash
# Import the production schema
mysql -u your_username -p defaultdb < GoldenMunchPOSV5_Production.sql

# Or if defaultdb doesn't exist yet (schema will create it):
mysql -u your_username -p < GoldenMunchPOSV5_Production.sql
```

### For Development/Testing

```bash
# Import the development schema with test data
mysql -u your_username -p < GoldenMunchPOSV4.sql
```

---

## Default Credentials

⚠️ **IMPORTANT:** Change these credentials immediately after deployment!

### Admin Login (Web Portal)
- **Username:** `admin`
- **Password:** `admin123`
- **Email:** `admin@goldenmunch.com`

### Cashier Login (POS Terminal)
- **Code:** `CASH001`
- **PIN:** `1234`
- **Email:** `cashier@goldenmunch.com`

---

## Database Structure

### Core Modules

1. **User Management**
   - Roles, Admin, Cashier tables
   - Authentication and authorization

2. **Product Catalog**
   - Menu items, Categories
   - Pricing with validity periods
   - Inventory management

3. **Order Processing**
   - Customer orders
   - Order items
   - Order timeline tracking
   - Payment verification

4. **Custom Cake System**
   - QR-based ordering flow
   - 3D cake editor integration
   - Flavor, size, and theme configuration
   - Admin approval workflow

5. **Payments & Discounts**
   - Multiple payment methods (Cash, GCash, PayMaya)
   - Customer discount types
   - Tax calculations
   - Refund management

6. **Inventory**
   - Stock tracking
   - Adjustment reasons
   - Waste tracking
   - Supplier management

7. **Analytics**
   - Sales reports
   - Trending items
   - Customer analytics
   - Performance metrics

---

## Migration Notes

### From V3 to V4/V5

The schema includes automatic migration scripts that:
- Check if columns exist before adding them
- Use `INSERT IGNORE` and `ON DUPLICATE KEY UPDATE` for safe data insertion
- Automatically handle column additions and modifications

You can safely run V4 or V5 on an existing V3 database.

---

## Post-Installation Steps

After importing the schema:

1. **Change Default Credentials**
   ```sql
   -- Change admin password
   UPDATE admin
   SET password_hash = '$2b$10$YOUR_NEW_BCRYPT_HASH'
   WHERE username = 'admin';

   -- Change cashier PIN
   UPDATE cashier
   SET pin_hash = '$2b$10$YOUR_NEW_BCRYPT_HASH'
   WHERE cashier_code = 'CASH001';
   ```

2. **Add Menu Items** (Production only)
   - Use the Admin panel to add your menu items
   - Set prices and stock levels
   - Upload product images

3. **Configure Payment Settings**
   - Update GCash QR code URL
   - Update PayMaya QR code URL
   - Set payment method availability

4. **Set Up Discount Types** (Optional)
   - Add your discount types via Admin panel
   - Configure percentage and ID requirements

5. **Test All Features**
   - Test kiosk ordering
   - Test custom cake flow
   - Test payment verification
   - Test discount application

---

## System Requirements

- **MySQL:** 5.7+ or MariaDB 10.3+
- **Character Set:** UTF8MB4
- **Collation:** utf8mb4_unicode_ci
- **Storage Engine:** InnoDB

---

## Features Included

### ✨ Complete Features

- 🛍️ Point of Sale (POS) system
- 📱 Kiosk self-service ordering
- 🎂 Custom cake 3D editor integration
- 📋 Order management and tracking
- 💳 Multiple payment methods
- 💰 Discount and promotion system
- 📊 Inventory management
- 📈 Analytics and reporting
- 👥 Customer management
- 👨‍💼 Staff management (Admin/Cashier roles)
- 🔔 Real-time order notifications
- ♻️ Refund processing
- 📱 QR code integration
- 🎨 Custom cake approval workflow

---

## Support

For issues, questions, or contributions:
- Review the schema comments for table/column documentation
- Check the stored procedures for business logic
- Examine the triggers for automated workflows

---

## Version History

| Version | Date | Description |
|---------|------|-------------|
| V5.0 | 2025-12-17 | Production-ready schema without test data |
| V4.0 | 2025-12-17 | Complete schema with sample data and discount support |
| V3.0 | 2025-12-16 | Initial unified schema with custom cake features |

---

## License

Copyright © 2025 GoldenMunch POS System. All rights reserved.
