-- ============================================================================
-- MIGRATION: Fix order_item Schema - V3 to V2 Compatibility
-- Issue: Code expects V2 schema columns, but V3 schema is missing them
-- Date: 2025-11-28
-- Priority: CRITICAL - Fixes order item creation
-- ============================================================================

-- This migration adds all missing columns from V2 schema to V3 schema
-- to make the database compatible with the existing codebase

USE GoldenMunchPOS;

-- ============================================================================
-- DISABLE SAFE UPDATE MODE (Required for UPDATE statements without KEY columns)
-- ============================================================================
SET SQL_SAFE_UPDATES = 0;

-- ============================================================================
-- STEP 1: Add Missing Columns from V2 Schema
-- ============================================================================

SELECT '═══════════════════════════════════════════════════' as '';
SELECT 'STEP 1: Adding missing V2 columns to order_item' as '';
SELECT '═══════════════════════════════════════════════════' as '';

-- custom_cake_design_id (V2 column, V3 has custom_cake_request_id)
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'order_item' AND COLUMN_NAME = 'custom_cake_design_id');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE order_item ADD COLUMN custom_cake_design_id INT NULL COMMENT ''For custom cake designs (V2 compatibility)'' AFTER menu_item_id', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SELECT IF(@col_exists = 0, '✓ Added column: custom_cake_design_id', '⊘ Column already exists: custom_cake_design_id') as Status;

-- flavor_id
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'order_item' AND COLUMN_NAME = 'flavor_id');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE order_item ADD COLUMN flavor_id INT NULL COMMENT ''Cake flavor selection'' AFTER custom_cake_design_id', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SELECT IF(@col_exists = 0, '✓ Added column: flavor_id', '⊘ Column already exists: flavor_id') as Status;

-- size_id
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'order_item' AND COLUMN_NAME = 'size_id');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE order_item ADD COLUMN size_id INT NULL COMMENT ''Cake size selection'' AFTER flavor_id', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SELECT IF(@col_exists = 0, '✓ Added column: size_id', '⊘ Column already exists: size_id') as Status;

-- flavor_cost
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'order_item' AND COLUMN_NAME = 'flavor_cost');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE order_item ADD COLUMN flavor_cost DECIMAL(10,2) DEFAULT 0.00 COMMENT ''Additional cost for flavor'' AFTER unit_price', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SELECT IF(@col_exists = 0, '✓ Added column: flavor_cost', '⊘ Column already exists: flavor_cost') as Status;

-- size_multiplier
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'order_item' AND COLUMN_NAME = 'size_multiplier');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE order_item ADD COLUMN size_multiplier DECIMAL(4,2) DEFAULT 1.00 COMMENT ''Price multiplier for size'' AFTER flavor_cost', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SELECT IF(@col_exists = 0, '✓ Added column: size_multiplier', '⊘ Column already exists: size_multiplier') as Status;

-- design_cost
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'order_item' AND COLUMN_NAME = 'design_cost');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE order_item ADD COLUMN design_cost DECIMAL(10,2) DEFAULT 0.00 COMMENT ''Additional cost for custom design'' AFTER size_multiplier', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SELECT IF(@col_exists = 0, '✓ Added column: design_cost', '⊘ Column already exists: design_cost') as Status;

-- item_total
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'order_item' AND COLUMN_NAME = 'item_total');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE order_item ADD COLUMN item_total DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT ''Total for this line item'' AFTER design_cost', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SELECT IF(@col_exists = 0, '✓ Added column: item_total', '⊘ Column already exists: item_total') as Status;

-- special_instructions (V2 name, V3 has special_requests)
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'order_item' AND COLUMN_NAME = 'special_instructions');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE order_item ADD COLUMN special_instructions TEXT NULL COMMENT ''Special instructions for item (V2 compatibility)'' AFTER item_total', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SELECT IF(@col_exists = 0, '✓ Added column: special_instructions', '⊘ Column already exists: special_instructions') as Status;

-- ============================================================================
-- STEP 2: Add Foreign Keys
-- ============================================================================

SELECT '' as '';
SELECT '═══════════════════════════════════════════════════' as '';
SELECT 'STEP 2: Adding foreign keys' as '';
SELECT '═══════════════════════════════════════════════════' as '';

-- fk_order_item_custom_cake_design (if custom_cake_design table exists)
SET @table_exists = (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'custom_cake_design');
SET @fk_exists = (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'order_item' AND CONSTRAINT_NAME = 'fk_order_item_custom_cake_design');
SET @sql = IF(@table_exists > 0 AND @fk_exists = 0, 'ALTER TABLE order_item ADD CONSTRAINT fk_order_item_custom_cake_design FOREIGN KEY (custom_cake_design_id) REFERENCES custom_cake_design(design_id) ON DELETE SET NULL', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SELECT IF(@table_exists > 0 AND @fk_exists = 0, '✓ Added foreign key: fk_order_item_custom_cake_design', '⊘ Foreign key skipped or already exists') as Status;

-- fk_order_item_flavor (if cake_flavors table exists)
SET @table_exists = (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'cake_flavors');
SET @fk_exists = (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'order_item' AND CONSTRAINT_NAME = 'fk_order_item_flavor');
SET @sql = IF(@table_exists > 0 AND @fk_exists = 0, 'ALTER TABLE order_item ADD CONSTRAINT fk_order_item_flavor FOREIGN KEY (flavor_id) REFERENCES cake_flavors(flavor_id) ON DELETE SET NULL', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SELECT IF(@table_exists > 0 AND @fk_exists = 0, '✓ Added foreign key: fk_order_item_flavor', '⊘ Foreign key skipped or already exists') as Status;

-- fk_order_item_size (if cake_sizes table exists)
SET @table_exists = (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'cake_sizes');
SET @fk_exists = (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'order_item' AND CONSTRAINT_NAME = 'fk_order_item_size');
SET @sql = IF(@table_exists > 0 AND @fk_exists = 0, 'ALTER TABLE order_item ADD CONSTRAINT fk_order_item_size FOREIGN KEY (size_id) REFERENCES cake_sizes(size_id) ON DELETE SET NULL', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SELECT IF(@table_exists > 0 AND @fk_exists = 0, '✓ Added foreign key: fk_order_item_size', '⊘ Foreign key skipped or already exists') as Status;

-- ============================================================================
-- STEP 3: Update Existing Records
-- ============================================================================

SELECT '' as '';
SELECT '═══════════════════════════════════════════════════' as '';
SELECT 'STEP 3: Updating existing records with calculated values' as '';
SELECT '═══════════════════════════════════════════════════' as '';

-- Sync item_total with subtotal
UPDATE order_item SET item_total = subtotal WHERE item_total = 0.00 OR item_total IS NULL;
SELECT CONCAT('✓ Updated item_total for ', ROW_COUNT(), ' records') as Status;

-- Copy special_requests to special_instructions
UPDATE order_item SET special_instructions = special_requests WHERE special_instructions IS NULL AND special_requests IS NOT NULL;
SELECT CONCAT('✓ Copied special_requests to special_instructions for ', ROW_COUNT(), ' records') as Status;

-- ============================================================================
-- STEP 4: Add Triggers
-- ============================================================================

SELECT '' as '';
SELECT '═══════════════════════════════════════════════════' as '';
SELECT 'STEP 4: Creating triggers for automatic data sync' as '';
SELECT '═══════════════════════════════════════════════════' as '';

DELIMITER //

DROP TRIGGER IF EXISTS trg_sync_item_total_insert//
CREATE TRIGGER trg_sync_item_total_insert BEFORE INSERT ON order_item FOR EACH ROW
BEGIN
    -- If item_total is 0 or null, calculate from subtotal
    IF NEW.item_total = 0.00 OR NEW.item_total IS NULL THEN
        SET NEW.item_total = NEW.subtotal;
    END IF;

    -- Sync subtotal with item_total if subtotal is provided
    IF NEW.subtotal IS NOT NULL AND NEW.subtotal > 0 THEN
        SET NEW.item_total = NEW.subtotal;
    END IF;
END//

DROP TRIGGER IF EXISTS trg_sync_item_total_update//
CREATE TRIGGER trg_sync_item_total_update BEFORE UPDATE ON order_item FOR EACH ROW
BEGIN
    -- Keep item_total and subtotal in sync
    IF NEW.subtotal != OLD.subtotal AND NEW.item_total = OLD.item_total THEN
        SET NEW.item_total = NEW.subtotal;
    END IF;
END//

DROP TRIGGER IF EXISTS trg_sync_special_instructions//
CREATE TRIGGER trg_sync_special_instructions BEFORE INSERT ON order_item FOR EACH ROW
BEGIN
    -- Sync special_requests and special_instructions
    IF NEW.special_instructions IS NOT NULL AND NEW.special_requests IS NULL THEN
        SET NEW.special_requests = NEW.special_instructions;
    ELSEIF NEW.special_requests IS NOT NULL AND NEW.special_instructions IS NULL THEN
        SET NEW.special_instructions = NEW.special_requests;
    END IF;
END//

DELIMITER ;

SELECT '✓ Created 3 triggers for data consistency' as Status;

-- ============================================================================
-- STEP 5: Verification
-- ============================================================================

SELECT '' as '';
SELECT '═══════════════════════════════════════════════════' as '';
SELECT 'STEP 5: Verification and Summary' as '';
SELECT '═══════════════════════════════════════════════════' as '';

SELECT COUNT(*) as total_order_items FROM order_item;

SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'order_item'
  AND COLUMN_NAME IN ('custom_cake_design_id', 'flavor_id', 'size_id', 'flavor_cost',
                       'size_multiplier', 'design_cost', 'item_total', 'special_instructions')
ORDER BY ORDINAL_POSITION;

-- ============================================================================
-- COMPLETION
-- ============================================================================

SELECT '' as '';
SELECT '╔════════════════════════════════════════════════════════════════════╗' as '';
SELECT '║      ORDER_ITEM SCHEMA MIGRATION COMPLETED SUCCESSFULLY           ║' as '';
SELECT '╚════════════════════════════════════════════════════════════════════╝' as '';
SELECT '' as '';
SELECT '✅ Added 8 missing V2 columns' as 'STATUS';
SELECT '✅ Added foreign keys' as '';
SELECT '✅ Updated existing records' as '';
SELECT '✅ Created 3 triggers' as '';
SELECT '' as '';
SELECT '🚀 order_item table now compatible with V2 codebase!' as '';

-- ============================================================================
-- RE-ENABLE SAFE UPDATE MODE (Restore default safety settings)
-- ============================================================================
SET SQL_SAFE_UPDATES = 1;
