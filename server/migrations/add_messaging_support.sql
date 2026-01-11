-- Migration: Add messaging support to custom_cake_notifications table
-- This enables threaded conversations between customers and admin

-- Add new columns to support threaded messaging
ALTER TABLE custom_cake_notifications
ADD COLUMN IF NOT EXISTS sender_type ENUM('customer', 'admin', 'system') DEFAULT 'system' AFTER notification_type,
ADD COLUMN IF NOT EXISTS parent_notification_id INT NULL AFTER notification_id,
ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE AFTER status,
ADD COLUMN IF NOT EXISTS read_at TIMESTAMP NULL AFTER sent_at,
ADD COLUMN IF NOT EXISTS sender_name VARCHAR(255) NULL AFTER sender_type;

-- Add foreign key constraint for threaded replies
ALTER TABLE custom_cake_notifications
ADD CONSTRAINT fk_parent_notification
FOREIGN KEY (parent_notification_id) REFERENCES custom_cake_notifications(notification_id)
ON DELETE CASCADE;

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
