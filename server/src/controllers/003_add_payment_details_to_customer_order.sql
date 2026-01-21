-- Migration: 003_add_payment_details_to_customer_order.sql
-- Adds 'amount_paid' and 'change_given' columns to the 'customer_order' table.

-- Check if 'amount_paid' column already exists
DELIMITER //

CREATE PROCEDURE AddPaymentDetailsColumnsIfNotExists()
BEGIN
    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS
                   WHERE TABLE_SCHEMA = DATABASE()
                   AND TABLE_NAME = 'customer_order'
                   AND COLUMN_NAME = 'amount_paid') THEN
        ALTER TABLE customer_order
        ADD COLUMN amount_paid DECIMAL(10, 2) NULL DEFAULT NULL AFTER final_amount;
        SELECT 'Column amount_paid added to customer_order table.' AS 'Migration Status';
    END IF;

    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS
                   WHERE TABLE_SCHEMA = DATABASE()
                   AND TABLE_NAME = 'customer_order'
                   AND COLUMN_NAME = 'change_given') THEN
        ALTER TABLE customer_order
        ADD COLUMN change_given DECIMAL(10, 2) NULL DEFAULT NULL AFTER amount_paid;
        SELECT 'Column change_given added to customer_order table.' AS 'Migration Status';
    END IF;
END //

DELIMITER ;

CALL AddPaymentDetailsColumnsIfNotExists();

DROP PROCEDURE AddPaymentDetailsColumnsIfNotExists;