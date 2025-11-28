-- ============================================================================
-- MIGRATION: Fix customer_order Schema - V3 to V2 Compatibility
-- Issue: Code expects V2 schema columns, but V3 schema is missing them
-- Date: 2025-11-28
-- Priority: CRITICAL - Fixes order creation, payment verification, and more
-- ============================================================================

-- This migration adds all missing columns from V2 schema to V3 schema
-- to make the database compatible with the existing codebase

USE GoldenMunchPOS;

-- ============================================================================
-- DISABLE SAFE UPDATE MODE (Required for UPDATE statements without KEY columns)
-- ============================================================================
SET SQL_SAFE_UPDATES = 0;

-- ============================================================================
-- STEP 1: Add Missing Critical Columns (Direct SQL with checks)
-- ============================================================================

SELECT '═══════════════════════════════════════════════════' as '';
SELECT 'STEP 1: Adding missing columns to customer_order' as '';
SELECT '═══════════════════════════════════════════════════' as '';

-- verification_code
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'customer_order' AND COLUMN_NAME = 'verification_code');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE customer_order ADD COLUMN verification_code VARCHAR(6) NOT NULL DEFAULT ''000000'' COMMENT ''Random 6-digit code for order pickup'' AFTER order_number', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SELECT IF(@col_exists = 0, '✓ Added column: verification_code', '⊘ Column already exists: verification_code') as Status;

-- order_datetime
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'customer_order' AND COLUMN_NAME = 'order_datetime');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE customer_order ADD COLUMN order_datetime TIMESTAMP DEFAULT CURRENT_TIMESTAMP AFTER customer_id', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SELECT IF(@col_exists = 0, '✓ Added column: order_datetime', '⊘ Column already exists: order_datetime') as Status;

-- order_source
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'customer_order' AND COLUMN_NAME = 'order_source');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE customer_order ADD COLUMN order_source ENUM(''kiosk'', ''cashier'', ''admin'') NOT NULL DEFAULT ''kiosk'' AFTER order_type', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SELECT IF(@col_exists = 0, '✓ Added column: order_source', '⊘ Column already exists: order_source') as Status;

-- is_preorder
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'customer_order' AND COLUMN_NAME = 'is_preorder');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE customer_order ADD COLUMN is_preorder BOOLEAN DEFAULT FALSE AFTER order_source', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SELECT IF(@col_exists = 0, '✓ Added column: is_preorder', '⊘ Column already exists: is_preorder') as Status;

-- advance_payment_required
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'customer_order' AND COLUMN_NAME = 'advance_payment_required');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE customer_order ADD COLUMN advance_payment_required BOOLEAN DEFAULT FALSE AFTER is_preorder', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SELECT IF(@col_exists = 0, '✓ Added column: advance_payment_required', '⊘ Column already exists: advance_payment_required') as Status;

-- advance_payment_amount
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'customer_order' AND COLUMN_NAME = 'advance_payment_amount');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE customer_order ADD COLUMN advance_payment_amount DECIMAL(10,2) DEFAULT 0.00 AFTER advance_payment_required', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SELECT IF(@col_exists = 0, '✓ Added column: advance_payment_amount', '⊘ Column already exists: advance_payment_amount') as Status;

-- final_amount
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'customer_order' AND COLUMN_NAME = 'final_amount');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE customer_order ADD COLUMN final_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT ''Grand total = total_amount (same value for compatibility)'' AFTER total_amount', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SELECT IF(@col_exists = 0, '✓ Added column: final_amount', '⊘ Column already exists: final_amount') as Status;

-- gcash_reference_number
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'customer_order' AND COLUMN_NAME = 'gcash_reference_number');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE customer_order ADD COLUMN gcash_reference_number VARCHAR(100) NULL COMMENT ''GCash transaction reference'' AFTER payment_method', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SELECT IF(@col_exists = 0, '✓ Added column: gcash_reference_number', '⊘ Column already exists: gcash_reference_number') as Status;

-- paymaya_reference_number
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'customer_order' AND COLUMN_NAME = 'paymaya_reference_number');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE customer_order ADD COLUMN paymaya_reference_number VARCHAR(100) NULL COMMENT ''PayMaya transaction reference'' AFTER gcash_reference_number', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SELECT IF(@col_exists = 0, '✓ Added column: paymaya_reference_number', '⊘ Column already exists: paymaya_reference_number') as Status;

-- card_transaction_ref
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'customer_order' AND COLUMN_NAME = 'card_transaction_ref');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE customer_order ADD COLUMN card_transaction_ref VARCHAR(100) NULL COMMENT ''Card payment reference'' AFTER paymaya_reference_number', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SELECT IF(@col_exists = 0, '✓ Added column: card_transaction_ref', '⊘ Column already exists: card_transaction_ref') as Status;

-- payment_verified_at
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'customer_order' AND COLUMN_NAME = 'payment_verified_at');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE customer_order ADD COLUMN payment_verified_at TIMESTAMP NULL AFTER payment_status', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SELECT IF(@col_exists = 0, '✓ Added column: payment_verified_at', '⊘ Column already exists: payment_verified_at') as Status;

-- payment_verified_by
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'customer_order' AND COLUMN_NAME = 'payment_verified_by');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE customer_order ADD COLUMN payment_verified_by INT NULL COMMENT ''Cashier who verified payment'' AFTER payment_verified_at', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SELECT IF(@col_exists = 0, '✓ Added column: payment_verified_by', '⊘ Column already exists: payment_verified_by') as Status;

-- kiosk_session_id
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'customer_order' AND COLUMN_NAME = 'kiosk_session_id');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE customer_order ADD COLUMN kiosk_session_id VARCHAR(100) NULL COMMENT ''Kiosk session identifier'' AFTER kiosk_id', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SELECT IF(@col_exists = 0, '✓ Added column: kiosk_session_id', '⊘ Column already exists: kiosk_session_id') as Status;

-- is_printed
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'customer_order' AND COLUMN_NAME = 'is_printed');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE customer_order ADD COLUMN is_printed BOOLEAN DEFAULT FALSE COMMENT ''Has receipt been printed'' AFTER completed_at', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SELECT IF(@col_exists = 0, '✓ Added column: is_printed', '⊘ Column already exists: is_printed') as Status;

-- is_deleted
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'customer_order' AND COLUMN_NAME = 'is_deleted');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE customer_order ADD COLUMN is_deleted BOOLEAN DEFAULT FALSE AFTER is_printed', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SELECT IF(@col_exists = 0, '✓ Added column: is_deleted', '⊘ Column already exists: is_deleted') as Status;

-- ============================================================================
-- STEP 2: Rename Columns to Match Code Expectations
-- ============================================================================

SELECT '' as '';
SELECT '═══════════════════════════════════════════════════' as '';
SELECT 'STEP 2: Renaming columns to match code expectations' as '';
SELECT '═══════════════════════════════════════════════════' as '';

-- scheduled_pickup_time → scheduled_pickup_datetime
SET @old_col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'customer_order' AND COLUMN_NAME = 'scheduled_pickup_time');
SET @new_col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'customer_order' AND COLUMN_NAME = 'scheduled_pickup_datetime');
SET @sql = IF(@old_col_exists > 0 AND @new_col_exists = 0, 'ALTER TABLE customer_order CHANGE COLUMN scheduled_pickup_time scheduled_pickup_datetime TIMESTAMP NULL', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SELECT IF(@old_col_exists > 0 AND @new_col_exists = 0, '✓ Renamed: scheduled_pickup_time → scheduled_pickup_datetime', '⊘ Rename not needed or already done') as Status;

-- actual_pickup_time → actual_pickup_datetime
SET @old_col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'customer_order' AND COLUMN_NAME = 'actual_pickup_time');
SET @new_col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'customer_order' AND COLUMN_NAME = 'actual_pickup_datetime');
SET @sql = IF(@old_col_exists > 0 AND @new_col_exists = 0, 'ALTER TABLE customer_order CHANGE COLUMN actual_pickup_time actual_pickup_datetime TIMESTAMP NULL', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SELECT IF(@old_col_exists > 0 AND @new_col_exists = 0, '✓ Renamed: actual_pickup_time → actual_pickup_datetime', '⊘ Rename not needed or already done') as Status;

-- ============================================================================
-- STEP 3: Add Indexes for Performance
-- ============================================================================

SELECT '' as '';
SELECT '═══════════════════════════════════════════════════' as '';
SELECT 'STEP 3: Adding indexes for performance' as '';
SELECT '═══════════════════════════════════════════════════' as '';

-- idx_verification_code
SET @idx_exists = (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'customer_order' AND INDEX_NAME = 'idx_verification_code');
SET @sql = IF(@idx_exists = 0, 'ALTER TABLE customer_order ADD INDEX idx_verification_code (verification_code)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SELECT IF(@idx_exists = 0, '✓ Added index: idx_verification_code', '⊘ Index already exists: idx_verification_code') as Status;

-- idx_order_datetime
SET @idx_exists = (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'customer_order' AND INDEX_NAME = 'idx_order_datetime');
SET @sql = IF(@idx_exists = 0, 'ALTER TABLE customer_order ADD INDEX idx_order_datetime (order_datetime)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SELECT IF(@idx_exists = 0, '✓ Added index: idx_order_datetime', '⊘ Index already exists: idx_order_datetime') as Status;

-- idx_gcash_ref
SET @idx_exists = (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'customer_order' AND INDEX_NAME = 'idx_gcash_ref');
SET @sql = IF(@idx_exists = 0, 'ALTER TABLE customer_order ADD INDEX idx_gcash_ref (gcash_reference_number)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SELECT IF(@idx_exists = 0, '✓ Added index: idx_gcash_ref', '⊘ Index already exists: idx_gcash_ref') as Status;

-- idx_paymaya_ref
SET @idx_exists = (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'customer_order' AND INDEX_NAME = 'idx_paymaya_ref');
SET @sql = IF(@idx_exists = 0, 'ALTER TABLE customer_order ADD INDEX idx_paymaya_ref (paymaya_reference_number)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SELECT IF(@idx_exists = 0, '✓ Added index: idx_paymaya_ref', '⊘ Index already exists: idx_paymaya_ref') as Status;

-- idx_order_source
SET @idx_exists = (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'customer_order' AND INDEX_NAME = 'idx_order_source');
SET @sql = IF(@idx_exists = 0, 'ALTER TABLE customer_order ADD INDEX idx_order_source (order_source)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SELECT IF(@idx_exists = 0, '✓ Added index: idx_order_source', '⊘ Index already exists: idx_order_source') as Status;

-- idx_preorder
SET @idx_exists = (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'customer_order' AND INDEX_NAME = 'idx_preorder');
SET @sql = IF(@idx_exists = 0, 'ALTER TABLE customer_order ADD INDEX idx_preorder (is_preorder)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SELECT IF(@idx_exists = 0, '✓ Added index: idx_preorder', '⊘ Index already exists: idx_preorder') as Status;

-- idx_kiosk_session
SET @idx_exists = (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'customer_order' AND INDEX_NAME = 'idx_kiosk_session');
SET @sql = IF(@idx_exists = 0, 'ALTER TABLE customer_order ADD INDEX idx_kiosk_session (kiosk_session_id)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SELECT IF(@idx_exists = 0, '✓ Added index: idx_kiosk_session', '⊘ Index already exists: idx_kiosk_session') as Status;

-- idx_is_deleted
SET @idx_exists = (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'customer_order' AND INDEX_NAME = 'idx_is_deleted');
SET @sql = IF(@idx_exists = 0, 'ALTER TABLE customer_order ADD INDEX idx_is_deleted (is_deleted)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SELECT IF(@idx_exists = 0, '✓ Added index: idx_is_deleted', '⊘ Index already exists: idx_is_deleted') as Status;

-- idx_verification_date (composite index)
SET @idx_exists = (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'customer_order' AND INDEX_NAME = 'idx_verification_date');
SET @sql = IF(@idx_exists = 0, 'ALTER TABLE customer_order ADD INDEX idx_verification_date (verification_code, created_at)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SELECT IF(@idx_exists = 0, '✓ Added index: idx_verification_date', '⊘ Index already exists: idx_verification_date') as Status;

-- ============================================================================
-- STEP 4: Add Foreign Keys
-- ============================================================================

SELECT '' as '';
SELECT '═══════════════════════════════════════════════════' as '';
SELECT 'STEP 4: Adding foreign keys' as '';
SELECT '═══════════════════════════════════════════════════' as '';

-- fk_payment_verified_by
SET @fk_exists = (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'customer_order' AND CONSTRAINT_NAME = 'fk_payment_verified_by');
SET @sql = IF(@fk_exists = 0, 'ALTER TABLE customer_order ADD CONSTRAINT fk_payment_verified_by FOREIGN KEY (payment_verified_by) REFERENCES cashier(cashier_id) ON DELETE SET NULL', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SELECT IF(@fk_exists = 0, '✓ Added foreign key: fk_payment_verified_by', '⊘ Foreign key already exists: fk_payment_verified_by') as Status;

-- ============================================================================
-- STEP 5: Update Existing Records
-- ============================================================================

SELECT '' as '';
SELECT '═══════════════════════════════════════════════════' as '';
SELECT 'STEP 5: Updating existing records with default values' as '';
SELECT '═══════════════════════════════════════════════════' as '';

-- Sync final_amount with total_amount
UPDATE customer_order SET final_amount = total_amount WHERE final_amount = 0.00 OR final_amount IS NULL;
SELECT CONCAT('✓ Updated final_amount for ', ROW_COUNT(), ' records') as Status;

-- Generate verification codes
UPDATE customer_order SET verification_code = LPAD(FLOOR(100000 + RAND() * 900000), 6, '0') WHERE verification_code = '000000' OR verification_code IS NULL OR verification_code = '';
SELECT CONCAT('✓ Generated verification codes for ', ROW_COUNT(), ' records') as Status;

-- Set order_datetime from created_at
UPDATE customer_order SET order_datetime = created_at WHERE order_datetime IS NULL;
SELECT CONCAT('✓ Set order_datetime for ', ROW_COUNT(), ' records') as Status;

-- ============================================================================
-- STEP 6: Add Triggers
-- ============================================================================

SELECT '' as '';
SELECT '═══════════════════════════════════════════════════' as '';
SELECT 'STEP 6: Creating triggers for automatic data sync' as '';
SELECT '═══════════════════════════════════════════════════' as '';

DELIMITER //

DROP TRIGGER IF EXISTS trg_sync_final_amount_insert//
CREATE TRIGGER trg_sync_final_amount_insert BEFORE INSERT ON customer_order FOR EACH ROW
BEGIN
    IF NEW.final_amount = 0.00 OR NEW.final_amount IS NULL THEN SET NEW.final_amount = NEW.total_amount; END IF;
END//

DROP TRIGGER IF EXISTS trg_sync_final_amount_update//
CREATE TRIGGER trg_sync_final_amount_update BEFORE UPDATE ON customer_order FOR EACH ROW
BEGIN
    IF NEW.total_amount != OLD.total_amount AND NEW.final_amount = OLD.final_amount THEN SET NEW.final_amount = NEW.total_amount; END IF;
END//

DROP TRIGGER IF EXISTS trg_generate_verification_code//
CREATE TRIGGER trg_generate_verification_code BEFORE INSERT ON customer_order FOR EACH ROW
BEGIN
    IF NEW.verification_code = '000000' OR NEW.verification_code IS NULL OR NEW.verification_code = '' THEN
        SET NEW.verification_code = LPAD(FLOOR(100000 + RAND() * 900000), 6, '0');
    END IF;
END//

DROP TRIGGER IF EXISTS trg_set_order_datetime//
CREATE TRIGGER trg_set_order_datetime BEFORE INSERT ON customer_order FOR EACH ROW
BEGIN
    IF NEW.order_datetime IS NULL THEN SET NEW.order_datetime = CURRENT_TIMESTAMP; END IF;
END//

DELIMITER ;

SELECT '✓ Created 4 triggers for data consistency' as Status;

-- ============================================================================
-- STEP 7: Verification
-- ============================================================================

SELECT '' as '';
SELECT '═══════════════════════════════════════════════════' as '';
SELECT 'STEP 7: Verification and Summary' as '';
SELECT '═══════════════════════════════════════════════════' as '';

SELECT COUNT(*) as total_orders FROM customer_order;

SELECT order_id, order_number, verification_code, order_datetime, order_source, total_amount, final_amount, payment_status, order_status
FROM customer_order ORDER BY order_id DESC LIMIT 5;

SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'customer_order'
  AND COLUMN_NAME IN ('verification_code', 'order_datetime', 'final_amount', 'kiosk_session_id', 'is_preorder',
                       'gcash_reference_number', 'paymaya_reference_number', 'payment_verified_at', 'payment_verified_by',
                       'order_source', 'is_deleted')
ORDER BY ORDINAL_POSITION;

-- ============================================================================
-- COMPLETION
-- ============================================================================

SELECT '' as '';
SELECT '╔════════════════════════════════════════════════════════════════════╗' as '';
SELECT '║     CUSTOMER_ORDER SCHEMA MIGRATION COMPLETED SUCCESSFULLY        ║' as '';
SELECT '╚════════════════════════════════════════════════════════════════════╝' as '';
SELECT '' as '';
SELECT '✅ Added 15 missing columns' as 'STATUS';
SELECT '✅ Added 9 indexes' as '';
SELECT '✅ Added foreign key' as '';
SELECT '✅ Updated existing records' as '';
SELECT '✅ Created 4 triggers' as '';
SELECT '' as '';
SELECT '🚀 Database now compatible with existing codebase!' as '';

-- ============================================================================
-- RE-ENABLE SAFE UPDATE MODE (Restore default safety settings)
-- ============================================================================
SET SQL_SAFE_UPDATES = 1;
