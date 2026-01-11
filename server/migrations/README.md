# Database Migrations

This directory contains SQL migration scripts for the GoldenMunch POS system.

## How to Run Migrations

### Option 1: Using MySQL CLI
```bash
mysql -u your_username -p your_database_name < migrations/add_messaging_support.sql
```

### Option 2: Using a MySQL client
1. Open your MySQL client (MySQL Workbench, phpMyAdmin, etc.)
2. Connect to your database
3. Execute the SQL file: `migrations/add_messaging_support.sql`

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
