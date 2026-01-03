-- Migration: Remove UNIQUE constraint from customer.phone
-- Date: 2026-01-03
-- Reason: Allow multiple customers with same phone number for custom cake orders
-- This fixes the "Duplicate entry for key 'customer.phone'" error

-- Check if the unique constraint exists and drop it
-- MySQL uses the column name as the index name for UNIQUE constraints
ALTER TABLE customer DROP INDEX phone;

-- The regular index idx_customer_phone will remain for query performance
-- No need to recreate it as it already exists

-- Note: After running this migration, customers with the same phone number
-- will be allowed. The system will create separate customer records for each order.
