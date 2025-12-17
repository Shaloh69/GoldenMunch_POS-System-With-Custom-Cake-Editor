-- ============================================================================
-- MIGRATION: Seed Sample Data for Testing
-- Description: Add sample orders, customers, menu items for testing dashboards
-- Date: 2025-12-17
-- ============================================================================

USE defaultdb;

-- ============================================================================
-- STEP 1: Add Sample Menu Items (if not exists)
-- ============================================================================

INSERT IGNORE INTO menu_item (menu_item_id, name, description, item_type, unit_of_measure, stock_quantity, is_infinite_stock, status, popularity_score)
VALUES
(1, 'Chocolate Cake (Regular)', 'Classic chocolate cake', 'cake', 'piece', 50, TRUE, 'available', 85.5),
(2, 'Vanilla Cupcake', 'Fluffy vanilla cupcake', 'cake', 'piece', 100, TRUE, 'available', 92.3),
(3, 'Strawberry Shortcake', 'Fresh strawberry cake', 'cake', 'piece', 30, TRUE, 'available', 78.2),
(4, 'Red Velvet Cake', 'Premium red velvet', 'cake', 'piece', 20, FALSE, 'available', 95.8),
(5, 'Coffee Latte', 'Hot or iced latte', 'beverage', 'cup', 200, TRUE, 'available', 88.7),
(6, 'Croissant', 'Butter croissant', 'pastry', 'piece', 50, FALSE, 'available', 76.4),
(7, 'Blueberry Muffin', 'Fresh blueberry muffin', 'pastry', 'piece', 60, FALSE, 'available', 82.1),
(8, 'Cheese Danish', 'Sweet cheese danish', 'pastry', 'piece', 40, FALSE, 'available', 71.5),
(9, 'Ube Cake', 'Filipino ube cake', 'cake', 'piece', 25, FALSE, 'available', 89.2),
(10, 'Lemon Tart', 'Tangy lemon tart', 'pastry', 'piece', 30, FALSE, 'available', 74.3);

-- Add prices for menu items
INSERT IGNORE INTO menu_item_price (menu_item_id, price_type, unit_price, cost_price, is_active)
VALUES
(1, 'base', 250.00, 100.00, TRUE),
(2, 'base', 80.00, 30.00, TRUE),
(3, 'base', 320.00, 150.00, TRUE),
(4, 'base', 450.00, 200.00, TRUE),
(5, 'base', 120.00, 40.00, TRUE),
(6, 'base', 95.00, 35.00, TRUE),
(7, 'base', 110.00, 45.00, TRUE),
(8, 'base', 105.00, 40.00, TRUE),
(9, 'base', 380.00, 170.00, TRUE),
(10, 'base', 130.00, 50.00, TRUE);

-- ============================================================================
-- STEP 2: Add Sample Customers
-- ============================================================================

INSERT IGNORE INTO customer (customer_id, name, phone, email, loyalty_points, total_spent, customer_tier)
VALUES
(1, 'Juan Dela Cruz', '+63-917-111-1111', 'juan@example.com', 250, 5500.00, 'gold'),
(2, 'Maria Santos', '+63-917-222-2222', 'maria@example.com', 180, 3200.00, 'silver'),
(3, 'Pedro Reyes', '+63-917-333-3333', 'pedro@example.com', 90, 1200.00, 'regular'),
(4, 'Ana Garcia', '+63-917-444-4444', 'ana@example.com', 320, 7800.00, 'platinum'),
(5, 'Carlos Martinez', '+63-917-555-5555', 'carlos@example.com', 150, 2500.00, 'silver'),
(6, 'Sofia Rodriguez', '+63-917-666-6666', 'sofia@example.com', 45, 800.00, 'regular'),
(7, 'Miguel Torres', '+63-917-777-7777', 'miguel@example.com', 210, 4100.00, 'gold'),
(8, 'Isabella Lopez', '+63-917-888-8888', 'isabella@example.com', 75, 1000.00, 'regular'),
(9, 'Diego Hernandez', '+63-917-999-9999', 'diego@example.com', 140, 2800.00, 'silver'),
(10, 'Lucia Gonzales', '+63-917-101-1010', 'lucia@example.com', 280, 5900.00, 'gold');

-- ============================================================================
-- STEP 3: Add Sample Orders (Last 30 Days)
-- ============================================================================

-- Helper: Generate orders over the past 30 days
SET @base_date = DATE_SUB(CURDATE(), INTERVAL 30 DAY);

-- Week 1 Orders (30-24 days ago)
INSERT INTO customer_order (order_number, order_type, customer_id, cashier_id, order_status, payment_status, payment_method, subtotal, tax_amount, discount_amount, total_amount, final_amount, amount_paid, change_amount, order_datetime, verification_code, order_source, created_at)
VALUES
('ORD-001', 'kiosk', 1, 1, 'completed', 'paid', 'cash', 500.00, 60.00, 0, 560.00, 560.00, 600.00, 40.00, DATE_ADD(@base_date, INTERVAL 1 DAY), '123456', 'kiosk', DATE_ADD(@base_date, INTERVAL 1 DAY)),
('ORD-002', 'kiosk', 2, 1, 'completed', 'paid', 'gcash', 320.00, 38.40, 0, 358.40, 358.40, 358.40, 0, DATE_ADD(@base_date, INTERVAL 2 DAY), '234567', 'kiosk', DATE_ADD(@base_date, INTERVAL 2 DAY)),
('ORD-003', 'kiosk', 3, 1, 'completed', 'paid', 'cash', 450.00, 54.00, 0, 504.00, 504.00, 600.00, 96.00, DATE_ADD(@base_date, INTERVAL 3 DAY), '345678', 'kiosk', DATE_ADD(@base_date, INTERVAL 3 DAY)),
('ORD-004', 'kiosk', 4, 1, 'completed', 'paid', 'paymaya', 850.00, 102.00, 50.00, 902.00, 902.00, 902.00, 0, DATE_ADD(@base_date, INTERVAL 4 DAY), '456789', 'kiosk', DATE_ADD(@base_date, INTERVAL 4 DAY)),
('ORD-005', 'kiosk', 5, 1, 'completed', 'paid', 'cash', 270.00, 32.40, 0, 302.40, 302.40, 310.00, 7.60, DATE_ADD(@base_date, INTERVAL 5 DAY), '567890', 'kiosk', DATE_ADD(@base_date, INTERVAL 5 DAY));

-- Week 2 Orders (23-17 days ago)
INSERT INTO customer_order (order_number, order_type, customer_id, cashier_id, order_status, payment_status, payment_method, subtotal, tax_amount, discount_amount, total_amount, final_amount, amount_paid, change_amount, order_datetime, verification_code, order_source, created_at)
VALUES
('ORD-006', 'kiosk', 6, 1, 'completed', 'paid', 'cash', 410.00, 49.20, 0, 459.20, 459.20, 500.00, 40.80, DATE_ADD(@base_date, INTERVAL 8 DAY), '678901', 'kiosk', DATE_ADD(@base_date, INTERVAL 8 DAY)),
('ORD-007', 'kiosk', 7, 1, 'completed', 'paid', 'gcash', 680.00, 81.60, 30.00, 731.60, 731.60, 731.60, 0, DATE_ADD(@base_date, INTERVAL 9 DAY), '789012', 'kiosk', DATE_ADD(@base_date, INTERVAL 9 DAY)),
('ORD-008', 'kiosk', 8, 1, 'completed', 'paid', 'cash', 190.00, 22.80, 0, 212.80, 212.80, 220.00, 7.20, DATE_ADD(@base_date, INTERVAL 10 DAY), '890123', 'kiosk', DATE_ADD(@base_date, INTERVAL 10 DAY)),
('ORD-009', 'kiosk', 9, 1, 'completed', 'paid', 'cash', 560.00, 67.20, 0, 627.20, 627.20, 700.00, 72.80, DATE_ADD(@base_date, INTERVAL 11 DAY), '901234', 'kiosk', DATE_ADD(@base_date, INTERVAL 11 DAY)),
('ORD-010', 'kiosk', 10, 1, 'completed', 'paid', 'paymaya', 920.00, 110.40, 40.00, 990.40, 990.40, 990.40, 0, DATE_ADD(@base_date, INTERVAL 12 DAY), '012345', 'kiosk', DATE_ADD(@base_date, INTERVAL 12 DAY));

-- Week 3 Orders (16-10 days ago)
INSERT INTO customer_order (order_number, order_type, customer_id, cashier_id, order_status, payment_status, payment_method, subtotal, tax_amount, discount_amount, total_amount, final_amount, amount_paid, change_amount, order_datetime, verification_code, order_source, created_at)
VALUES
('ORD-011', 'kiosk', 1, 1, 'completed', 'paid', 'cash', 350.00, 42.00, 0, 392.00, 392.00, 400.00, 8.00, DATE_ADD(@base_date, INTERVAL 15 DAY), '112233', 'kiosk', DATE_ADD(@base_date, INTERVAL 15 DAY)),
('ORD-012', 'kiosk', 2, 1, 'completed', 'paid', 'gcash', 480.00, 57.60, 20.00, 517.60, 517.60, 517.60, 0, DATE_ADD(@base_date, INTERVAL 16 DAY), '223344', 'kiosk', DATE_ADD(@base_date, INTERVAL 16 DAY)),
('ORD-013', 'kiosk', 3, 1, 'completed', 'paid', 'cash', 220.00, 26.40, 0, 246.40, 246.40, 250.00, 3.60, DATE_ADD(@base_date, INTERVAL 17 DAY), '334455', 'kiosk', DATE_ADD(@base_date, INTERVAL 17 DAY)),
('ORD-014', 'kiosk', 4, 1, 'completed', 'paid', 'cash', 750.00, 90.00, 0, 840.00, 840.00, 850.00, 10.00, DATE_ADD(@base_date, INTERVAL 18 DAY), '445566', 'kiosk', DATE_ADD(@base_date, INTERVAL 18 DAY)),
('ORD-015', 'kiosk', 5, 1, 'completed', 'paid', 'paymaya', 390.00, 46.80, 0, 436.80, 436.80, 436.80, 0, DATE_ADD(@base_date, INTERVAL 19 DAY), '556677', 'kiosk', DATE_ADD(@base_date, INTERVAL 19 DAY));

-- Week 4 & Recent Orders (9-0 days ago)
INSERT INTO customer_order (order_number, order_type, customer_id, cashier_id, order_status, payment_status, payment_method, subtotal, tax_amount, discount_amount, total_amount, final_amount, amount_paid, change_amount, order_datetime, verification_code, order_source, created_at)
VALUES
('ORD-016', 'kiosk', 6, 1, 'completed', 'paid', 'cash', 290.00, 34.80, 0, 324.80, 324.80, 350.00, 25.20, DATE_ADD(@base_date, INTERVAL 22 DAY), '667788', 'kiosk', DATE_ADD(@base_date, INTERVAL 22 DAY)),
('ORD-017', 'kiosk', 7, 1, 'completed', 'paid', 'gcash', 620.00, 74.40, 30.00, 664.40, 664.40, 664.40, 0, DATE_ADD(@base_date, INTERVAL 23 DAY), '778899', 'kiosk', DATE_ADD(@base_date, INTERVAL 23 DAY)),
('ORD-018', 'kiosk', 8, 1, 'completed', 'paid', 'cash', 180.00, 21.60, 0, 201.60, 201.60, 210.00, 8.40, DATE_ADD(@base_date, INTERVAL 24 DAY), '889900', 'kiosk', DATE_ADD(@base_date, INTERVAL 24 DAY)),
('ORD-019', 'kiosk', 9, 1, 'completed', 'paid', 'cash', 530.00, 63.60, 0, 593.60, 593.60, 600.00, 6.40, DATE_ADD(@base_date, INTERVAL 25 DAY), '990011', 'kiosk', DATE_ADD(@base_date, INTERVAL 25 DAY)),
('ORD-020', 'kiosk', 10, 1, 'completed', 'paid', 'paymaya', 880.00, 105.60, 40.00, 945.60, 945.60, 945.60, 0, DATE_ADD(@base_date, INTERVAL 26 DAY), '001122', 'kiosk', DATE_ADD(@base_date, INTERVAL 26 DAY)),
('ORD-021', 'kiosk', 1, 1, 'completed', 'paid', 'cash', 420.00, 50.40, 0, 470.40, 470.40, 500.00, 29.60, DATE_ADD(@base_date, INTERVAL 27 DAY), '112244', 'kiosk', DATE_ADD(@base_date, INTERVAL 27 DAY)),
('ORD-022', 'kiosk', 2, 1, 'completed', 'paid', 'gcash', 560.00, 67.20, 0, 627.20, 627.20, 627.20, 0, DATE_ADD(@base_date, INTERVAL 28 DAY), '223355', 'kiosk', DATE_ADD(@base_date, INTERVAL 28 DAY)),
('ORD-023', 'kiosk', 3, 1, 'completed', 'paid', 'cash', 310.00, 37.20, 0, 347.20, 347.20, 350.00, 2.80, DATE_ADD(@base_date, INTERVAL 29 DAY), '334466', 'kiosk', DATE_ADD(@base_date, INTERVAL 29 DAY)),
('ORD-024', 'kiosk', 4, 1, 'completed', 'paid', 'cash', 700.00, 84.00, 35.00, 749.00, 749.00, 800.00, 51.00, CURDATE(), '445577', 'kiosk', CURDATE()),
('ORD-025', 'kiosk', 5, 1, 'completed', 'paid', 'paymaya', 450.00, 54.00, 0, 504.00, 504.00, 504.00, 0, CURDATE(), '556688', 'kiosk', CURDATE());

-- ============================================================================
-- STEP 4: Add Order Items
-- ============================================================================

-- Order 1 items
INSERT INTO order_item (order_id, menu_item_id, item_name, quantity, unit_price, subtotal, item_status)
SELECT 1, 1, 'Chocolate Cake (Regular)', 2, 250.00, 500.00, 'served'
WHERE EXISTS (SELECT 1 FROM customer_order WHERE order_id = 1);

-- Order 2 items
INSERT INTO order_item (order_id, menu_item_id, item_name, quantity, unit_price, subtotal, item_status)
SELECT 2, 3, 'Strawberry Shortcake', 1, 320.00, 320.00, 'served'
WHERE EXISTS (SELECT 1 FROM customer_order WHERE order_id = 2);

-- Order 3 items
INSERT INTO order_item (order_id, menu_item_id, item_name, quantity, unit_price, subtotal, item_status)
SELECT 3, 4, 'Red Velvet Cake', 1, 450.00, 450.00, 'served'
WHERE EXISTS (SELECT 1 FROM customer_order WHERE order_id = 3);

-- Order 4 items (multiple items)
INSERT INTO order_item (order_id, menu_item_id, item_name, quantity, unit_price, subtotal, item_status)
SELECT 4, 1, 'Chocolate Cake (Regular)', 2, 250.00, 500.00, 'served'
WHERE EXISTS (SELECT 1 FROM customer_order WHERE order_id = 4)
UNION ALL
SELECT 4, 2, 'Vanilla Cupcake', 2, 80.00, 160.00, 'served'
WHERE EXISTS (SELECT 1 FROM customer_order WHERE order_id = 4)
UNION ALL
SELECT 4, 6, 'Croissant', 2, 95.00, 190.00, 'served'
WHERE EXISTS (SELECT 1 FROM customer_order WHERE order_id = 4);

-- Order 5 items
INSERT INTO order_item (order_id, menu_item_id, item_name, quantity, unit_price, subtotal, item_status)
SELECT 5, 2, 'Vanilla Cupcake', 2, 80.00, 160.00, 'served'
WHERE EXISTS (SELECT 1 FROM customer_order WHERE order_id = 5)
UNION ALL
SELECT 5, 5, 'Coffee Latte', 1, 120.00, 120.00, 'served'
WHERE EXISTS (SELECT 1 FROM customer_order WHERE order_id = 5);

-- Continue for other orders (simplified for brevity - add items for orders 6-25)
INSERT INTO order_item (order_id, menu_item_id, item_name, quantity, unit_price, subtotal, item_status)
SELECT o.order_id,
       FLOOR(1 + (RAND() * 10)) as menu_item_id,
       mi.name,
       FLOOR(1 + (RAND() * 3)) as quantity,
       mip.unit_price,
       FLOOR(1 + (RAND() * 3)) * mip.unit_price as subtotal,
       'served' as item_status
FROM customer_order o
CROSS JOIN (SELECT 1 as dummy) d
JOIN menu_item mi ON mi.menu_item_id = FLOOR(1 + (RAND() * 10))
JOIN menu_item_price mip ON mip.menu_item_id = mi.menu_item_id AND mip.is_active = TRUE
WHERE o.order_id BETWEEN 6 AND 25
    AND NOT EXISTS (SELECT 1 FROM order_item WHERE order_id = o.order_id)
GROUP BY o.order_id
LIMIT 20;

-- ============================================================================
-- STEP 5: Update Customer Stats
-- ============================================================================

UPDATE customer c
SET last_order_date = (
    SELECT MAX(DATE(created_at))
    FROM customer_order
    WHERE customer_id = c.customer_id
);

-- ============================================================================
-- STEP 6: Add Some Waste Data
-- ============================================================================

INSERT INTO waste_tracking (menu_item_id, quantity, waste_reason, estimated_value, notes, waste_date, created_at)
VALUES
(1, 2, 'expired', 500.00, 'Past expiration date', DATE_SUB(CURDATE(), INTERVAL 5 DAY), DATE_SUB(CURDATE(), INTERVAL 5 DAY)),
(6, 5, 'damaged', 475.00, 'Damaged during transport', DATE_SUB(CURDATE(), INTERVAL 10 DAY), DATE_SUB(CURDATE(), INTERVAL 10 DAY)),
(7, 3, 'overproduction', 330.00, 'Too many produced', DATE_SUB(CURDATE(), INTERVAL 15 DAY), DATE_SUB(CURDATE(), INTERVAL 15 DAY)),
(3, 1, 'spoiled', 320.00, 'Went bad', DATE_SUB(CURDATE(), INTERVAL 20 DAY), DATE_SUB(CURDATE(), INTERVAL 20 DAY));

-- ============================================================================
-- COMPLETION
-- ============================================================================

SELECT '╔════════════════════════════════════════════════════════════════════╗' as '';
SELECT '║          SAMPLE DATA SEEDED SUCCESSFULLY                          ║' as '';
SELECT '╚════════════════════════════════════════════════════════════════════╝' as '';
SELECT '' as '';
SELECT CONCAT('✅ Menu Items: ', COUNT(*), ' items') as status FROM menu_item;
SELECT CONCAT('✅ Customers: ', COUNT(*), ' customers') as status FROM customer;
SELECT CONCAT('✅ Orders: ', COUNT(*), ' orders') as status FROM customer_order;
SELECT CONCAT('✅ Order Items: ', COUNT(*), ' items') as status FROM order_item;
SELECT CONCAT('✅ Waste Records: ', COUNT(*), ' records') as status FROM waste_tracking;
SELECT '' as '';
SELECT '🎉 Dashboard pages should now display data!' as '';
