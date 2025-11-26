# Database Setup Guide

## Quick Fix for "Access Denied" Error

If you're getting the error:
```
Access denied for user 'root'@'localhost' (using password: NO)
```

This means the `.env` file is missing or not configured properly.

### Solution Steps

1. **Ensure `.env` file exists** in the `server/` directory
   ```bash
   cd server
   cp .env.example .env  # If .env doesn't exist
   ```

2. **Configure database password** in `server/.env`:
   - If your MySQL root user has **no password** (common in XAMPP/development):
     ```env
     DB_PASSWORD=
     ```
   - If your MySQL root user **has a password**:
     ```env
     DB_PASSWORD=your_actual_password
     ```

## Complete Database Setup

### Step 1: Ensure MySQL is Running

**XAMPP Users (Windows):**
- Start XAMPP Control Panel
- Click "Start" for MySQL module
- Verify it shows "Running" status

**Other MySQL Installations:**
- Check MySQL service is running
- Default port should be 3306

### Step 2: Create the Database

Open MySQL command line or phpMyAdmin and run:

```sql
CREATE DATABASE IF NOT EXISTS GoldenMunchPOS CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Or use the provided schema file:

```bash
# From project root
mysql -u root -p < server/databaseSchema/GoldenMunchPOSV2.sql
```

**Note:** If you have no password, just press Enter when prompted for password, or use:
```bash
mysql -u root < server/databaseSchema/GoldenMunchPOSV2.sql
```

### Step 3: Seed Initial Data

From the `server/` directory:

```bash
cd server
npm run seed
```

This will populate:
- Default categories
- Sample menu items
- Cake customization options (flavors, sizes, themes, frostings, toppings)
- Admin credentials (username: `admin`, password: `password`)
- Cashier credentials (code: `CASH001`, PIN: `1234`)

### Step 4: Verify Database Connection

```bash
cd server
npm run db:verify
```

This will check:
- Database connectivity
- Required tables exist
- Basic data integrity

### Step 5: Start the Server

```bash
cd server
npm run dev  # Development mode with hot reload
# OR
npm start    # Production mode
```

## Troubleshooting

### Error: "Database 'GoldenMunchPOS' does not exist"

Run the schema file or create the database manually (see Step 2).

### Error: "Access denied for user 'root'@'localhost'"

**With password: NO**
- Your `.env` file is missing or `DB_PASSWORD` is not set
- Solution: Set `DB_PASSWORD=` (empty) in `server/.env` if you have no password

**With password: YES**
- Wrong password in `.env` file
- Solution: Update `DB_PASSWORD` with correct password in `server/.env`

### Error: "connect ECONNREFUSED 127.0.0.1:3306"

- MySQL service is not running
- Solution: Start MySQL via XAMPP or your MySQL service manager

### Error: "ER_NOT_SUPPORTED_AUTH_MODE"

- MySQL 8+ uses caching_sha2_password by default, but older clients expect mysql_native_password
- Solution: Run this in MySQL:
  ```sql
  ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY '';
  FLUSH PRIVILEGES;
  ```

## Environment Configuration

The `server/.env` file should contain at minimum:

```env
# Application
NODE_ENV=development
PORT=5000

# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=         # Empty for no password, or your actual password
DB_NAME=GoldenMunchPOS

# JWT Secrets (change these!)
JWT_SECRET=your_jwt_secret_key_change_this
ADMIN_JWT_SECRET=your_admin_jwt_secret_change_this
CASHIER_JWT_SECRET=your_cashier_jwt_secret_change_this
```

## Default Credentials After Seeding

### Admin Login
- **Username:** `admin`
- **Password:** `password`

### Cashier Login
- **Cashier Code:** `CASH001`
- **PIN:** `1234`

**IMPORTANT:** Change these credentials in production!

## Database Verification Commands

Check if database exists:
```bash
mysql -u root -e "SHOW DATABASES LIKE 'GoldenMunchPOS';"
```

Check tables:
```bash
mysql -u root GoldenMunchPOS -e "SHOW TABLES;"
```

Check admin user:
```bash
mysql -u root GoldenMunchPOS -e "SELECT admin_id, username FROM admin;"
```

## Need Help?

- Check that MySQL is running on port 3306
- Verify `server/.env` file exists and has correct credentials
- Run `npm run db:verify` to diagnose issues
- Check server logs for detailed error messages
