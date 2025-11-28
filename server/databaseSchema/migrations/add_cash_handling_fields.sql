-- Migration: Add cash handling fields to customer_order table
-- Created: 2025-11-28
-- Purpose: Support modern cashier workflow with cash tendering and change calculation

-- Check if columns exist and add them if they don't
SET @dbname = DATABASE();
SET @tablename = 'customer_order';

-- Add amount_paid column
SET @column_exists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = @dbname
    AND TABLE_NAME = @tablename
    AND COLUMN_NAME = 'amount_paid'
);

SET @sql = IF(@column_exists = 0,
    'ALTER TABLE customer_order ADD COLUMN amount_paid DECIMAL(10,2) DEFAULT 0 COMMENT ''Amount tendered by customer for cash payments'' AFTER payment_method',
    'SELECT ''Column amount_paid already exists'' AS msg'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add change_amount column
SET @column_exists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = @dbname
    AND TABLE_NAME = @tablename
    AND COLUMN_NAME = 'change_amount'
);

SET @sql = IF(@column_exists = 0,
    'ALTER TABLE customer_order ADD COLUMN change_amount DECIMAL(10,2) DEFAULT 0 COMMENT ''Change to return to customer'' AFTER amount_paid',
    'SELECT ''Column change_amount already exists'' AS msg'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Update existing orders to set amount_paid = final_amount for paid orders
UPDATE customer_order
SET amount_paid = final_amount
WHERE payment_status IN ('paid', 'partial_paid')
AND amount_paid = 0;

SELECT 'Migration completed: Cash handling fields added successfully' AS status;
