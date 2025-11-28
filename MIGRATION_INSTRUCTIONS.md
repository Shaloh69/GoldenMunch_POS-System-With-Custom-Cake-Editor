# 🚨 CRITICAL: Database Migration Required

## Issue
Your order creation is failing because the database schema (V3) doesn't match what the code expects (V2).

**Error:** `Unknown column 'custom_cake_design_id' in 'field list'`

## Solution
Run the database migration to add the missing columns.

---

## Option 1: Using MySQL CLI (Recommended)

If you have direct access to your MySQL database:

```bash
# Connect to your database
mysql -h your-mysql-host -P 27245 -u username -p --ssl-mode=REQUIRED

# Or for local database:
mysql -u root -p

# Then run the migration
mysql -h your-mysql-host -P 27245 -u username -p --ssl-mode=REQUIRED < server/databaseSchema/migrations/002_fix_order_item_schema_v3_to_v2_compatibility.sql
```

---

## Option 2: Using Node.js Script

```bash
cd server

# Make sure dependencies are installed
npm install

# Set your database connection in .env file or environment variables:
# DB_HOST=your-host
# DB_PORT=27245
# DB_USER=your-user
# DB_PASSWORD=your-password
# DB_NAME=GoldenMunchPOS

# Run the migration
node run-migration.js
```

---

## Option 3: Manual SQL Execution

1. Copy the contents of `server/databaseSchema/migrations/002_fix_order_item_schema_v3_to_v2_compatibility.sql`
2. Open your database management tool (phpMyAdmin, MySQL Workbench, DBeaver, Aiven Console, etc.)
3. Select the `GoldenMunchPOS` database
4. Paste and execute the SQL

---

## What This Migration Does

Adds 8 missing columns to the `order_item` table:
- ✅ `custom_cake_design_id` - Links to custom cake designs
- ✅ `flavor_id` - Cake flavor selection
- ✅ `size_id` - Cake size selection
- ✅ `flavor_cost` - Additional flavor cost
- ✅ `size_multiplier` - Size price multiplier
- ✅ `design_cost` - Custom design cost
- ✅ `item_total` - Line item total
- ✅ `special_instructions` - Item-specific instructions

---

## Verification

After running the migration, test order creation:

1. Go to your Kiosk application
2. Add an item to cart
3. Try to complete an order (cash payment, dine-in)
4. Order should be created successfully ✅

---

## For Render/Aiven Deployment

### Using Aiven Console:
1. Log into your Aiven account
2. Go to your MySQL service
3. Click on "Query Editor" or "Tools"
4. Paste the migration SQL
5. Execute

### Using Render Environment:
1. Set up a one-time job in Render
2. Command: `cd server && npm install && node run-migration.js`
3. Or SSH into your Render instance and run manually

---

## Rollback (if needed)

⚠️ Only if something goes wrong:

```sql
ALTER TABLE order_item
  DROP COLUMN custom_cake_design_id,
  DROP COLUMN flavor_id,
  DROP COLUMN size_id,
  DROP COLUMN flavor_cost,
  DROP COLUMN size_multiplier,
  DROP COLUMN design_cost,
  DROP COLUMN item_total,
  DROP COLUMN special_instructions;
```

---

## Need Help?

The migration is **safe and idempotent** - you can run it multiple times without issues.

All existing data will be preserved, and the migration includes automatic triggers to keep data consistent.
