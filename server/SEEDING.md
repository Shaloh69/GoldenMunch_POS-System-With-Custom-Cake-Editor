# Database Seeding Guide

This guide explains how to seed your Golden Munch POS database with demo data.

## Seeder Options

### 🚀 Option 1: Complete Database Seeder (Recommended for New Setup)

Seeds everything you need to get started:
- ✅ Admin and Cashier credentials
- ✅ Product categories (Cakes, Pastries, Breads, Beverages)
- ✅ 16+ Menu items with prices
- ✅ Cake flavors (Chocolate, Vanilla, Red Velvet, etc.)
- ✅ Cake sizes (6", 8", 10", 12", sheets)
- ✅ Custom cake themes (Birthday, Wedding, etc.)

```bash
cd server
node seedDatabase.js
# OR
npm run seed
```

### 🔐 Option 2: Credentials Only

If you only need to fix/reset login credentials:

```bash
cd server
node seedCredentials.js
# OR
npm run seed:credentials
```

## Why Use These Seeders?

The seeders create data with **Node.js bcrypt hashes** that are guaranteed to work with the authentication system:

- ✅ Correct hash format (`$2b$` instead of PHP's `$2y$`)
- ✅ Automatic verification after seeding
- ✅ Works with both new and existing databases
- ✅ Updates existing data instead of duplicating
- ✅ No manual SQL execution needed

## Prerequisites

1. MySQL server running
2. Database created: `CREATE DATABASE GoldenMunchPOS;`
3. Tables created (run the schema SQL first)
4. `.env` file configured with database credentials

## Quick Start (Full Setup)

**Step 1: Verify your database structure (Recommended)**

```bash
cd server
node verifyDatabase.js
# OR
npm run db:verify
```

This will check that all required tables exist with correct columns.

**Step 2: Seed the database**

```bash
node seedDatabase.js
# OR
npm run seed
```

This will:
- Connect to your database
- Create admin and cashier credentials
- Seed all categories and menu items with proper relationships
- Create cake customization options
- Generate secure credential hashes
- Link everything together correctly
- Display a summary

## Default Credentials

After seeding, you can login with:

### Admin Login
- **URL**: http://localhost:5000/admin
- **Username**: `admin`
- **Password**: `password`

### Cashier Login
- **URL**: http://localhost:5000/pos
- **Cashier Code**: `CASH001`
- **PIN**: `1234`

## ⚠️ Security Warning

**These are default credentials for development only!**

After your first login, immediately:
1. Change the admin password
2. Change the cashier PIN
3. Create new accounts with secure credentials

## Troubleshooting

### "Connection refused" error
- Make sure MySQL is running
- Check your DB_HOST, DB_PORT in `.env`

### "Database doesn't exist" error
```sql
CREATE DATABASE GoldenMunchPOS;
```

### "Table doesn't exist" error
Run the schema SQL file first:
```bash
mysql -u root -p GoldenMunchPOS < databaseSchema/GoldenMunchPOSV2.sql
```

### "Invalid credentials" after seeding
This should not happen with the seeder! If it does:
1. Run the seeder again
2. Check the verification output
3. Check server logs for detailed error messages

## What the Seeder Does

1. **Connects** to your MySQL database
2. **Generates** bcrypt hashes using Node.js bcrypt (10 rounds)
3. **Updates** existing credentials OR **creates** new ones if they don't exist
4. **Verifies** the credentials by comparing the plain passwords with the hashes
5. **Displays** success message with login information

## What Gets Seeded?

### Complete Database Seeder (`seedDatabase.js`)

**Categories (5):**
- Cakes
- Pastries
- Breads
- Beverages
- Custom Cakes

**Menu Items (16):**
- Chocolate Fudge Cake, Red Velvet Cake, Vanilla Birthday Cake, Strawberry Shortcake
- Croissant, Chocolate Danish, Apple Turnover, Almond Bear Claw
- Sourdough Loaf, Baguette, Cinnamon Raisin Bread
- Cappuccino, Latte, Hot Chocolate, Iced Coffee
- Custom Designed Cake

**Cake Flavors (8):**
- Chocolate, Vanilla, Red Velvet, Strawberry, Lemon, Carrot, Marble, Coconut

**Cake Sizes (6):**
- 6 inch, 8 inch, 10 inch, 12 inch, Quarter Sheet, Half Sheet

**Custom Cake Themes (10):**
- Birthday, Wedding, Anniversary, Baby Shower, Graduation, Sports, Floral, Cartoon, Elegant, Rustic

**Credentials:**
- 1 Admin account
- 1 Cashier account

### Credentials Only Seeder (`seedCredentials.js`)

Only seeds admin and cashier login credentials.

## Files

- `seedDatabase.js` - **Complete database seeder** (Recommended for new setup)
- `seedCredentials.js` - **Credentials only seeder** (Quick credential reset)
- `src/seeders/seedAdminAndCashier.ts` - TypeScript credentials seeder (requires ts-node)
- `generateHash.js` - Hash generator utility (for manual hash generation)

## Need Help?

If you encounter any issues:
1. Check the error message carefully
2. Verify your database is running and accessible
3. Ensure your `.env` file has correct credentials
4. Make sure tables exist in the database
