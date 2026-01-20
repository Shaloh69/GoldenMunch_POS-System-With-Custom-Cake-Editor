-- Migration: Fix custom_cake_request_images.image_url column size
-- Issue: VARCHAR(500) is too small for base64-encoded images
-- Base64 images are typically 70,000 - 280,000 characters
-- Solution: Change to MEDIUMTEXT (up to 16MB)

USE GoldenMunchPOS;

-- Change image_url column to MEDIUMTEXT to support base64 images
ALTER TABLE custom_cake_request_images
MODIFY COLUMN image_url MEDIUMTEXT NOT NULL COMMENT 'URL or base64 data - supports large base64-encoded images';

-- Verify the change
DESCRIBE custom_cake_request_images;

-- Expected output:
-- image_url | mediumtext | NO | | NULL |
