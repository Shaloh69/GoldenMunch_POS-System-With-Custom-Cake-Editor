-- ============================================================================
-- Migration: Refactor Payment System to Cash and Cashless Only
-- Date: 2026-01-14
-- Description: Simplifies payment system to use only Cash and Cashless (Xendit)
-- This migration consolidates all payment reference fields into one unified field
-- ============================================================================

USE defaultdb;

-- Step 1: Add new payment_reference_number column
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'customer_order' AND COLUMN_NAME = 'payment_reference_number');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE customer_order ADD COLUMN payment_reference_number VARCHAR(255) NULL COMMENT ''Unified payment reference for cashless payments (Xendit invoice ID)'' AFTER payment_status', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SELECT IF(@col_exists = 0, '✓ Added column: payment_reference_number', '⊘ Column already exists: payment_reference_number') as Status;

-- Step 2: Migrate existing reference data to new column
-- Priority: xendit > paymaya > gcash > card
UPDATE customer_order
SET payment_reference_number = COALESCE(xendit_reference_number, paymaya_reference_number, gcash_reference_number, card_transaction_ref)
WHERE payment_reference_number IS NULL
  AND (xendit_reference_number IS NOT NULL OR paymaya_reference_number IS NOT NULL OR gcash_reference_number IS NOT NULL OR card_transaction_ref IS NOT NULL);

SELECT CONCAT('✓ Migrated ', ROW_COUNT(), ' payment references') as Status;

-- Step 3: Drop old reference columns
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'customer_order' AND COLUMN_NAME = 'gcash_reference_number');
SET @sql = IF(@col_exists > 0, 'ALTER TABLE customer_order DROP COLUMN gcash_reference_number', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SELECT IF(@col_exists > 0, '✓ Dropped column: gcash_reference_number', '⊘ Column already removed: gcash_reference_number') as Status;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'customer_order' AND COLUMN_NAME = 'paymaya_reference_number');
SET @sql = IF(@col_exists > 0, 'ALTER TABLE customer_order DROP COLUMN paymaya_reference_number', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SELECT IF(@col_exists > 0, '✓ Dropped column: paymaya_reference_number', '⊘ Column already removed: paymaya_reference_number') as Status;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'customer_order' AND COLUMN_NAME = 'xendit_reference_number');
SET @sql = IF(@col_exists > 0, 'ALTER TABLE customer_order DROP COLUMN xendit_reference_number', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SELECT IF(@col_exists > 0, '✓ Dropped column: xendit_reference_number', '⊘ Column already removed: xendit_reference_number') as Status;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'customer_order' AND COLUMN_NAME = 'card_transaction_ref');
SET @sql = IF(@col_exists > 0, 'ALTER TABLE customer_order DROP COLUMN card_transaction_ref', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SELECT IF(@col_exists > 0, '✓ Dropped column: card_transaction_ref', '⊘ Column already removed: card_transaction_ref') as Status;

-- Step 4: Drop old indexes
SET @idx_exists = (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'customer_order' AND INDEX_NAME = 'idx_gcash_ref');
SET @sql = IF(@idx_exists > 0, 'ALTER TABLE customer_order DROP INDEX idx_gcash_ref', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SELECT IF(@idx_exists > 0, '✓ Dropped index: idx_gcash_ref', '⊘ Index already removed: idx_gcash_ref') as Status;

SET @idx_exists = (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'customer_order' AND INDEX_NAME = 'idx_paymaya_ref');
SET @sql = IF(@idx_exists > 0, 'ALTER TABLE customer_order DROP INDEX idx_paymaya_ref', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SELECT IF(@idx_exists > 0, '✓ Dropped index: idx_paymaya_ref', '⊘ Index already removed: idx_paymaya_ref') as Status;

SET @idx_exists = (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'customer_order' AND INDEX_NAME = 'idx_xendit_ref');
SET @sql = IF(@idx_exists > 0, 'ALTER TABLE customer_order DROP INDEX idx_xendit_ref', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SELECT IF(@idx_exists > 0, '✓ Dropped index: idx_xendit_ref', '⊘ Index already removed: idx_xendit_ref') as Status;

-- Step 5: Add new index for payment_reference_number
SET @idx_exists = (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'customer_order' AND INDEX_NAME = 'idx_payment_ref');
SET @sql = IF(@idx_exists = 0, 'ALTER TABLE customer_order ADD INDEX idx_payment_ref (payment_reference_number)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SELECT IF(@idx_exists = 0, '✓ Added index: idx_payment_ref', '⊘ Index already exists: idx_payment_ref') as Status;

-- Step 6: Update payment_method ENUM to only allow 'cash' and 'cashless'
-- Note: This step should be done carefully as it will fail if there are existing invalid values
-- First, standardize existing payment methods
UPDATE customer_order
SET payment_method = 'cashless'
WHERE payment_method IN ('gcash', 'paymaya', 'xendit', 'credit_card', 'debit_card', 'card', 'bank_transfer');

SELECT CONCAT('✓ Standardized ', ROW_COUNT(), ' payment methods to cashless') as Status;

-- Now modify the ENUM (this will fail if there are still invalid values)
ALTER TABLE customer_order MODIFY COLUMN payment_method ENUM('cash', 'cashless') NULL;
SELECT '✓ Updated payment_method ENUM to (cash, cashless)' as Status;

-- Step 7: Do the same for payment_transaction table if it exists
SET @table_exists = (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'payment_transaction');

SET @sql = IF(@table_exists > 0,
  "UPDATE payment_transaction SET payment_method = 'cashless' WHERE payment_method IN ('gcash', 'paymaya', 'xendit', 'credit_card', 'debit_card', 'card', 'bank_transfer')",
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = IF(@table_exists > 0,
  "ALTER TABLE payment_transaction MODIFY COLUMN payment_method ENUM('cash', 'cashless') NOT NULL",
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SELECT IF(@table_exists > 0, '✓ Updated payment_transaction.payment_method ENUM', '⊘ payment_transaction table does not exist') as Status;

-- Final verification
SELECT
  COLUMN_NAME,
  DATA_TYPE,
  COLUMN_TYPE,
  IS_NULLABLE
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'customer_order'
  AND COLUMN_NAME IN ('payment_method', 'payment_reference_number')
ORDER BY ORDINAL_POSITION;

SELECT '✅ Migration completed: Payment system refactored to Cash and Cashless only' as Status;
