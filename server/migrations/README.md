# Database Migrations

This directory contains SQL migration scripts for the GoldenMunch POS system.

## How to Run Migrations

### Option 1: Using MySQL CLI (Recommended)
```bash
# From the server directory
mysql -u your_username -p your_database_name < migrations/add_messaging_support.sql

# Or if you're already in MySQL:
mysql> USE your_database_name;
mysql> SOURCE migrations/add_messaging_support.sql;
```

### Option 2: Using MySQL Workbench
1. Open MySQL Workbench and connect to your database
2. Click "File" > "Open SQL Script"
3. Select `server/migrations/add_messaging_support.sql`
4. Click the lightning bolt icon to execute

### Option 3: Using phpMyAdmin
1. Log in to phpMyAdmin
2. Select your database from the left sidebar
3. Click the "Import" tab
4. Choose the file `migrations/add_messaging_support.sql`
5. Click "Go" to execute

### Option 4: Using the Node.js script
```bash
cd server
node scripts/run-messaging-migration.js
```

## Available Migrations

### add_messaging_support.sql
**Purpose**: Adds messaging/threading support to the custom_cake_notifications table

**Changes**:
- Adds `sender_type` column (customer/admin/system)
- Adds `parent_notification_id` for threaded conversations
- Adds `is_read` and `read_at` for read tracking
- Adds `sender_name` for display purposes
- Creates indexes for efficient querying
- Creates `message_threads` view for easier queries

**To Run**: Execute this migration before using the messaging features.

**Status**: Required for v1.1.0+ (Messaging Feature)

## Notes

- Always backup your database before running migrations
- Migrations are designed to be idempotent (safe to run multiple times)
- Check the migration file content before executing
- Test migrations in a development environment first
