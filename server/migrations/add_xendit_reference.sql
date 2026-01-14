-- ============================================================================
-- Migration: Add Xendit payment reference support
-- Date: 2026-01-14
-- Description: Adds xendit_reference_number column to customer_order table
-- ============================================================================

USE defaultdb;

-- Add xendit_reference_number column
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'customer_order' AND COLUMN_NAME = 'xendit_reference_number');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE customer_order ADD COLUMN xendit_reference_number VARCHAR(100) NULL COMMENT ''Xendit transaction reference (invoice ID)'' AFTER paymaya_reference_number', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SELECT IF(@col_exists = 0, '✓ Added column: xendit_reference_number', '⊘ Column already exists: xendit_reference_number') as Status;

-- Add index for xendit_reference_number for faster lookups
SET @idx_exists = (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'customer_order' AND INDEX_NAME = 'idx_xendit_ref');
SET @sql = IF(@idx_exists = 0, 'ALTER TABLE customer_order ADD INDEX idx_xendit_ref (xendit_reference_number)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SELECT IF(@idx_exists = 0, '✓ Added index: idx_xendit_ref', '⊘ Index already exists: idx_xendit_ref') as Status;

-- Update payment_method enum to include 'xendit' if not already present
-- Note: MySQL doesn't allow easy ENUM modification, so this requires recreating the column
-- This migration assumes 'xendit' will be added manually or in future schema updates
-- For production, you may need to run:
-- ALTER TABLE customer_order MODIFY payment_method ENUM('cash', 'credit_card', 'debit_card', 'gcash', 'paymaya', 'xendit', 'bank_transfer', 'loyalty_points', 'other') NULL;

SELECT '✓ Migration completed: Xendit support added to customer_order table' as Status;
