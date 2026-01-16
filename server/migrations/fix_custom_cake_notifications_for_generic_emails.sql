-- Migration: Allow generic emails not tied to custom cake requests
-- This allows the email composer to send emails independently

-- Make request_id nullable for generic emails
ALTER TABLE custom_cake_notifications
  MODIFY COLUMN request_id INT NULL COMMENT 'NULL for generic emails, set for custom cake-related emails';

-- Add 'admin_message' to notification_type ENUM for generic admin emails
ALTER TABLE custom_cake_notifications
  MODIFY COLUMN notification_type ENUM(
    'submission_received',
    'approved',
    'rejected',
    'ready_for_pickup',
    'reminder',
    'admin_message',
    'customer_message'
  ) NOT NULL;
