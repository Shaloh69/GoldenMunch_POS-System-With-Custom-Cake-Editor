-- ============================================================================
-- FIX ADMIN AND CASHIER CREDENTIALS
-- This script updates credentials to the correct bcrypt hashes
-- ============================================================================

USE GoldenMunchPOS;

-- Update Admin password (password: admin123)
-- Bcrypt hash for 'admin123' with salt rounds 10
UPDATE admin
SET password_hash = '$2b$10$CXizOigTmnkp0RTmFSF2D.rfmDhi9A4TTLK0CFmHNhRWMhQAT5DYG'
WHERE username = 'admin';

-- Verify admin update
SELECT
    admin_id,
    username,
    name,
    email,
    is_active,
    CONCAT(SUBSTRING(password_hash, 1, 29), '...') as password_hash_preview
FROM admin
WHERE username = 'admin';

-- Update Cashier PIN (PIN: 1234)
-- Bcrypt hash for '1234' with salt rounds 10
UPDATE cashier
SET pin_hash = '$2b$10$fEDASegIWOnbGTzD0pEA9u/5rHLpLAS2tEqn8782ryWHLp1eYYsTG'
WHERE cashier_code = 'CASH001';

-- Verify cashier update
SELECT
    cashier_id,
    name,
    cashier_code,
    is_active,
    CONCAT(SUBSTRING(pin_hash, 1, 29), '...') as pin_hash_preview
FROM cashier
WHERE cashier_code = 'CASH001';

-- Show results
SELECT '✅ Credentials updated successfully!' as Status;
SELECT 'Username: admin, Password: admin123' as Admin_Credentials;
SELECT 'Cashier Code: CASH001, PIN: 1234' as Cashier_Credentials;
