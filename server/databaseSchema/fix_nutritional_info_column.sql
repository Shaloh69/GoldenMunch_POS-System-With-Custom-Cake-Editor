-- Fix nutritional_info column to accept string input instead of JSON
-- This allows users to input nutritional information as plain text

USE GoldenMunchPOS;

-- Change nutritional_info from JSON to TEXT to allow string input
ALTER TABLE menu_item MODIFY COLUMN nutritional_info TEXT NULL;

-- Add comment to clarify the field accepts text
ALTER TABLE menu_item MODIFY COLUMN nutritional_info TEXT NULL COMMENT 'Nutritional information as plain text (e.g., Calories: 250, Protein: 5g)';

-- Verify the change
DESCRIBE menu_item;
