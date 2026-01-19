-- Migration: Add notification_read_status table
-- Purpose: Track which notifications users have marked as read
-- Date: 2026-01-19

-- Create notification_read_status table
CREATE TABLE IF NOT EXISTS notification_read_status (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  notification_id VARCHAR(255) NOT NULL,
  read_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_user_notification (user_id, notification_id),
  INDEX idx_user_id (user_id),
  INDEX idx_notification_id (notification_id),
  INDEX idx_read_at (read_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Note: user_id will reference cashier_id or admin_id depending on who is logged in
-- notification_id format: "type-entity_id" (e.g., "new_order-123", "low_stock-456")
