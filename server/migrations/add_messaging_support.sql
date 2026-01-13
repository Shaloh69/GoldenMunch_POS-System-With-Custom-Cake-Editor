-- Migration: Add messaging support to custom_cake_notifications table
-- This enables threaded conversations between customers and admin

-- Drop stored procedure if it exists
DROP PROCEDURE IF EXISTS add_messaging_columns;

DELIMITER //
CREATE PROCEDURE add_messaging_columns()
BEGIN
    -- Check and add sender_type column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'custom_cake_notifications'
        AND COLUMN_NAME = 'sender_type'
    ) THEN
        ALTER TABLE custom_cake_notifications
        ADD COLUMN sender_type ENUM('customer', 'admin', 'system') DEFAULT 'system' AFTER notification_type;
    END IF;

    -- Check and add parent_notification_id column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'custom_cake_notifications'
        AND COLUMN_NAME = 'parent_notification_id'
    ) THEN
        ALTER TABLE custom_cake_notifications
        ADD COLUMN parent_notification_id INT NULL AFTER notification_id;
    END IF;

    -- Check and add is_read column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'custom_cake_notifications'
        AND COLUMN_NAME = 'is_read'
    ) THEN
        ALTER TABLE custom_cake_notifications
        ADD COLUMN is_read BOOLEAN DEFAULT FALSE AFTER status;
    END IF;

    -- Check and add read_at column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'custom_cake_notifications'
        AND COLUMN_NAME = 'read_at'
    ) THEN
        ALTER TABLE custom_cake_notifications
        ADD COLUMN read_at TIMESTAMP NULL AFTER sent_at;
    END IF;

    -- Check and add sender_name column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'custom_cake_notifications'
        AND COLUMN_NAME = 'sender_name'
    ) THEN
        ALTER TABLE custom_cake_notifications
        ADD COLUMN sender_name VARCHAR(255) NULL AFTER sender_type;
    END IF;

    -- Add foreign key constraint if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.TABLE_CONSTRAINTS
        WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'custom_cake_notifications'
        AND CONSTRAINT_NAME = 'fk_parent_notification'
    ) THEN
        ALTER TABLE custom_cake_notifications
        ADD CONSTRAINT fk_parent_notification
        FOREIGN KEY (parent_notification_id) REFERENCES custom_cake_notifications(notification_id)
        ON DELETE CASCADE;
    END IF;
END//
DELIMITER ;

-- Execute the procedure
CALL add_messaging_columns();

-- Drop the procedure after use
DROP PROCEDURE IF EXISTS add_messaging_columns;

-- Add indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_request_sender ON custom_cake_notifications(request_id, sender_type);
CREATE INDEX IF NOT EXISTS idx_request_unread ON custom_cake_notifications(request_id, is_read);
CREATE INDEX IF NOT EXISTS idx_parent_notification ON custom_cake_notifications(parent_notification_id);

-- Update existing notifications to have sender_type = 'system'
UPDATE custom_cake_notifications
SET sender_type = 'system', sender_name = 'GoldenMunch System'
WHERE sender_type IS NULL;

-- Create a view for easier message thread queries
CREATE OR REPLACE VIEW message_threads AS
SELECT
  n.notification_id,
  n.request_id,
  n.notification_type,
  n.sender_type,
  n.sender_name,
  n.recipient_email,
  n.subject,
  n.message_body,
  n.status,
  n.is_read,
  n.sent_at,
  n.read_at,
  n.parent_notification_id,
  ccr.customer_name,
  ccr.customer_email,
  ccr.status as request_status
FROM custom_cake_notifications n
INNER JOIN custom_cake_request ccr ON n.request_id = ccr.request_id
ORDER BY n.request_id, n.sent_at ASC;
