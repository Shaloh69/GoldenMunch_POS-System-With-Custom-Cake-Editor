-- Migration: Update custom_cake_request_images for Supabase storage
-- Issue: Previously storing base64 data in database (inefficient)
-- Solution: Upload images to Supabase Storage, store URLs in database
--
-- This migration:
-- 1. Changes image_url back to VARCHAR(500) (URLs are short)
-- 2. Cleans up any existing base64 data (if any)
--
-- Note: The application code now uploads images to Supabase automatically

USE GoldenMunchPOS;

-- Change image_url column back to VARCHAR(500) for storing Supabase URLs
ALTER TABLE custom_cake_request_images
MODIFY COLUMN image_url VARCHAR(500) NOT NULL COMMENT 'Supabase storage URL';

-- Optional: Clean up any existing base64 data (if migration is run after previous fix)
-- Delete rows with base64 data (they will be re-uploaded via Supabase on next submission)
DELETE FROM custom_cake_request_images
WHERE image_url LIKE 'data:image%';

-- Verify the change
DESCRIBE custom_cake_request_images;

-- Expected output:
-- image_url | varchar(500) | NO | | NULL |
