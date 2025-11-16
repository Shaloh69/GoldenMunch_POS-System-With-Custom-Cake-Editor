-- ============================================================================
-- GOLDEN MUNCH POS - COMPREHENSIVE TEST DATA
-- Purpose: Testing and development data for the POS system
-- ============================================================================

USE GoldenMunchPOS;

-- ============================================================================
-- 1. SUPPLIERS
-- ============================================================================

INSERT INTO suppliers (supplier_name, contact_person, phone, email, address, is_active) VALUES
('Manila Bakery Supplies Inc.', 'Juan Dela Cruz', '+63-917-555-0101', 'juan@manilabakerysupplies.ph', '123 Quezon Ave, Quezon City', TRUE),
('Premium Flour Mills', 'Maria Santos', '+63-917-555-0102', 'maria@premiumflour.ph', '456 Makati Ave, Makati City', TRUE),
('Chocolate Dreams Co.', 'Pedro Reyes', '+63-917-555-0103', 'pedro@chocolatedreams.ph', '789 Taft Ave, Manila', TRUE),
('Fresh Dairy Farm', 'Ana Garcia', '+63-917-555-0104', 'ana@freshdairy.ph', '321 Pasig Blvd, Pasig City', TRUE),
('Sweet Decorations Supply', 'Carlos Mendoza', '+63-917-555-0105', 'carlos@sweetdecorations.ph', '654 Shaw Blvd, Mandaluyong', TRUE);

-- ============================================================================
-- 2. CATEGORIES
-- ============================================================================

INSERT INTO category (name, description, image_url, display_order, is_active, admin_id) VALUES
('Cakes', 'Freshly baked cakes for all occasions', '/images/categories/cakes.jpg', 1, TRUE, 1),
('Pastries', 'Delicious pastries and sweet treats', '/images/categories/pastries.jpg', 2, TRUE, 1),
('Breads', 'Fresh baked breads daily', '/images/categories/breads.jpg', 3, TRUE, 1),
('Beverages', 'Hot and cold beverages', '/images/categories/beverages.jpg', 4, TRUE, 1),
('Custom Cakes', 'Personalized cakes for special events', '/images/categories/custom-cakes.jpg', 5, TRUE, 1),
('Desserts', 'Sweet desserts and treats', '/images/categories/desserts.jpg', 6, TRUE, 1);

-- ============================================================================
-- 3. MENU ITEMS
-- ============================================================================

-- CAKES
INSERT INTO menu_item (name, description, image_url, item_type, unit_of_measure, stock_quantity, is_infinite_stock, min_stock_level, status, can_customize, can_preorder, preparation_time_minutes, popularity_score, supplier_id, is_featured, allergen_info) VALUES
('Chocolate Fudge Cake', 'Rich and moist chocolate cake with fudge frosting', '/images/items/chocolate-fudge.jpg', 'cake', 'piece', 15, FALSE, 5, 'available', TRUE, TRUE, 30, 85.5, 1, TRUE, 'Contains: Wheat, Eggs, Milk, Soy'),
('Vanilla Birthday Cake', 'Classic vanilla cake perfect for birthdays', '/images/items/vanilla-birthday.jpg', 'cake', 'piece', 12, FALSE, 5, 'available', TRUE, TRUE, 30, 78.3, 1, TRUE, 'Contains: Wheat, Eggs, Milk'),
('Red Velvet Cake', 'Smooth red velvet with cream cheese frosting', '/images/items/red-velvet.jpg', 'cake', 'piece', 10, FALSE, 3, 'available', TRUE, TRUE, 35, 92.1, 1, TRUE, 'Contains: Wheat, Eggs, Milk'),
('Mango Float Cake', 'Filipino favorite with fresh mangoes', '/images/items/mango-float.jpg', 'cake', 'piece', 8, FALSE, 3, 'available', FALSE, TRUE, 20, 67.8, 1, FALSE, 'Contains: Milk, Graham Crackers'),
('Ube Cake', 'Purple yam cake with ube halaya frosting', '/images/items/ube-cake.jpg', 'cake', 'piece', 10, FALSE, 4, 'available', TRUE, TRUE, 30, 88.9, 1, TRUE, 'Contains: Wheat, Eggs, Milk, Ube');

-- PASTRIES
INSERT INTO menu_item (name, description, image_url, item_type, unit_of_measure, stock_quantity, is_infinite_stock, min_stock_level, status, can_customize, can_preorder, preparation_time_minutes, popularity_score, supplier_id, is_featured, allergen_info) VALUES
('Ensaymada', 'Soft brioche topped with butter and sugar', '/images/items/ensaymada.jpg', 'pastry', 'piece', 30, FALSE, 10, 'available', FALSE, FALSE, 5, 95.2, 1, TRUE, 'Contains: Wheat, Eggs, Milk, Butter'),
('Cheese Pandesal', 'Filipino bread roll with cheese filling', '/images/items/cheese-pandesal.jpg', 'pastry', 'piece', 50, FALSE, 15, 'available', FALSE, FALSE, 5, 87.4, 1, FALSE, 'Contains: Wheat, Milk'),
('Spanish Bread', 'Sweet bread roll with breadcrumb filling', '/images/items/spanish-bread.jpg', 'pastry', 'piece', 40, FALSE, 12, 'available', FALSE, FALSE, 5, 72.6, 1, FALSE, 'Contains: Wheat, Milk, Butter'),
('Chocolate Croissant', 'Buttery croissant filled with chocolate', '/images/items/choco-croissant.jpg', 'pastry', 'piece', 20, FALSE, 8, 'available', FALSE, TRUE, 10, 81.3, 1, TRUE, 'Contains: Wheat, Eggs, Milk, Butter, Chocolate'),
('Custard Tart', 'Creamy custard in a flaky pastry shell', '/images/items/custard-tart.jpg', 'pastry', 'piece', 25, FALSE, 8, 'available', FALSE, TRUE, 15, 76.5, 1, FALSE, 'Contains: Wheat, Eggs, Milk');

-- BREADS
INSERT INTO menu_item (name, description, image_url, item_type, unit_of_measure, stock_quantity, is_infinite_stock, min_stock_level, status, can_customize, can_preorder, preparation_time_minutes, popularity_score, supplier_id, is_featured, allergen_info) VALUES
('Pandesal', 'Traditional Filipino bread rolls', '/images/items/pandesal.jpg', 'bread', 'piece', 100, FALSE, 30, 'available', FALSE, FALSE, 5, 98.7, 1, TRUE, 'Contains: Wheat'),
('Whole Wheat Loaf', 'Healthy whole wheat bread loaf', '/images/items/whole-wheat.jpg', 'bread', 'piece', 15, FALSE, 5, 'available', FALSE, TRUE, 10, 65.2, 2, FALSE, 'Contains: Wheat'),
('Garlic Bread', 'Toasted bread with garlic butter', '/images/items/garlic-bread.jpg', 'bread', 'piece', 20, FALSE, 8, 'available', FALSE, FALSE, 8, 73.8, 1, FALSE, 'Contains: Wheat, Milk, Garlic'),
('Cheese Bread', 'Soft bread topped with melted cheese', '/images/items/cheese-bread.jpg', 'bread', 'piece', 25, FALSE, 10, 'available', FALSE, FALSE, 10, 79.4, 1, FALSE, 'Contains: Wheat, Milk, Cheese');

-- BEVERAGES
INSERT INTO menu_item (name, description, image_url, item_type, unit_of_measure, stock_quantity, is_infinite_stock, min_stock_level, status, can_customize, can_preorder, preparation_time_minutes, popularity_score, supplier_id, is_featured, allergen_info) VALUES
('Brewed Coffee', 'Freshly brewed arabica coffee', '/images/items/brewed-coffee.jpg', 'beverage', 'serving', 0, TRUE, 0, 'available', FALSE, FALSE, 3, 91.2, NULL, FALSE, NULL),
('Cappuccino', 'Espresso with steamed milk and foam', '/images/items/cappuccino.jpg', 'beverage', 'serving', 0, TRUE, 0, 'available', FALSE, FALSE, 5, 84.6, NULL, TRUE, 'Contains: Milk'),
('Iced Coffee', 'Cold brewed coffee with ice', '/images/items/iced-coffee.jpg', 'beverage', 'serving', 0, TRUE, 0, 'available', FALSE, FALSE, 3, 88.9, NULL, TRUE, 'Contains: Milk (optional)'),
('Hot Chocolate', 'Rich hot chocolate drink', '/images/items/hot-chocolate.jpg', 'beverage', 'serving', 0, TRUE, 0, 'available', FALSE, FALSE, 4, 77.3, NULL, FALSE, 'Contains: Milk, Chocolate'),
('Fresh Mango Juice', 'Freshly squeezed mango juice', '/images/items/mango-juice.jpg', 'beverage', 'serving', 0, TRUE, 0, 'available', FALSE, FALSE, 5, 82.1, NULL, FALSE, NULL);

-- DESSERTS
INSERT INTO menu_item (name, description, image_url, item_type, unit_of_measure, stock_quantity, is_infinite_stock, min_stock_level, status, can_customize, can_preorder, preparation_time_minutes, popularity_score, supplier_id, is_featured, allergen_info) VALUES
('Leche Flan', 'Traditional Filipino caramel custard', '/images/items/leche-flan.jpg', 'dessert', 'serving', 20, FALSE, 8, 'available', FALSE, TRUE, 10, 86.5, 1, TRUE, 'Contains: Eggs, Milk'),
('Halo-Halo', 'Mixed shaved ice dessert with various toppings', '/images/items/halo-halo.jpg', 'dessert', 'serving', 0, TRUE, 0, 'available', FALSE, FALSE, 8, 93.7, NULL, TRUE, 'Contains: Milk, Various Beans'),
('Buko Pandan', 'Young coconut and pandan jelly dessert', '/images/items/buko-pandan.jpg', 'dessert', 'serving', 15, FALSE, 5, 'available', FALSE, TRUE, 10, 79.8, 1, FALSE, 'Contains: Coconut, Milk'),
('Ube Halaya', 'Purple yam jam dessert', '/images/items/ube-halaya.jpg', 'dessert', 'serving', 10, FALSE, 4, 'available', FALSE, TRUE, 15, 74.2, 1, FALSE, 'Contains: Ube, Milk');

-- ============================================================================
-- 4. MENU ITEM PRICES
-- ============================================================================

-- CAKES (₱250-500)
INSERT INTO menu_item_price (menu_item_id, price, start_date, end_date, price_type, is_active, created_by) VALUES
(1, 450.00, '2024-01-01', '2025-12-31', 'regular', TRUE, 1),
(2, 400.00, '2024-01-01', '2025-12-31', 'regular', TRUE, 1),
(3, 500.00, '2024-01-01', '2025-12-31', 'regular', TRUE, 1),
(4, 380.00, '2024-01-01', '2025-12-31', 'regular', TRUE, 1),
(5, 420.00, '2024-01-01', '2025-12-31', 'regular', TRUE, 1);

-- PASTRIES (₱35-85)
INSERT INTO menu_item_price (menu_item_id, price, start_date, end_date, price_type, is_active, created_by) VALUES
(6, 55.00, '2024-01-01', '2025-12-31', 'regular', TRUE, 1),
(7, 35.00, '2024-01-01', '2025-12-31', 'regular', TRUE, 1),
(8, 40.00, '2024-01-01', '2025-12-31', 'regular', TRUE, 1),
(9, 75.00, '2024-01-01', '2025-12-31', 'regular', TRUE, 1),
(10, 65.00, '2024-01-01', '2025-12-31', 'regular', TRUE, 1);

-- BREADS (₱10-50)
INSERT INTO menu_item_price (menu_item_id, price, start_date, end_date, price_type, is_active, created_by) VALUES
(11, 12.00, '2024-01-01', '2025-12-31', 'regular', TRUE, 1),
(12, 45.00, '2024-01-01', '2025-12-31', 'regular', TRUE, 1),
(13, 30.00, '2024-01-01', '2025-12-31', 'regular', TRUE, 1),
(14, 35.00, '2024-01-01', '2025-12-31', 'regular', TRUE, 1);

-- BEVERAGES (₱50-120)
INSERT INTO menu_item_price (menu_item_id, price, start_date, end_date, price_type, is_active, created_by) VALUES
(15, 60.00, '2024-01-01', '2025-12-31', 'regular', TRUE, 1),
(16, 95.00, '2024-01-01', '2025-12-31', 'regular', TRUE, 1),
(17, 75.00, '2024-01-01', '2025-12-31', 'regular', TRUE, 1),
(18, 85.00, '2024-01-01', '2025-12-31', 'regular', TRUE, 1),
(19, 70.00, '2024-01-01', '2025-12-31', 'regular', TRUE, 1);

-- DESSERTS (₱60-150)
INSERT INTO menu_item_price (menu_item_id, price, start_date, end_date, price_type, is_active, created_by) VALUES
(20, 120.00, '2024-01-01', '2025-12-31', 'regular', TRUE, 1),
(21, 150.00, '2024-01-01', '2025-12-31', 'regular', TRUE, 1),
(22, 90.00, '2024-01-01', '2025-12-31', 'regular', TRUE, 1),
(23, 80.00, '2024-01-01', '2025-12-31', 'regular', TRUE, 1);

-- ============================================================================
-- 5. CATEGORY-MENU ITEM RELATIONSHIPS
-- ============================================================================

-- Cakes Category
INSERT INTO category_has_menu_item (category_id, menu_item_id, display_order) VALUES
(1, 1, 1), (1, 2, 2), (1, 3, 3), (1, 4, 4), (1, 5, 5);

-- Pastries Category
INSERT INTO category_has_menu_item (category_id, menu_item_id, display_order) VALUES
(2, 6, 1), (2, 7, 2), (2, 8, 3), (2, 9, 4), (2, 10, 5);

-- Breads Category
INSERT INTO category_has_menu_item (category_id, menu_item_id, display_order) VALUES
(3, 11, 1), (3, 12, 2), (3, 13, 3), (3, 14, 4);

-- Beverages Category
INSERT INTO category_has_menu_item (category_id, menu_item_id, display_order) VALUES
(4, 15, 1), (4, 16, 2), (4, 17, 3), (4, 18, 4), (4, 19, 5);

-- Desserts Category
INSERT INTO category_has_menu_item (category_id, menu_item_id, display_order) VALUES
(6, 20, 1), (6, 21, 2), (6, 22, 3), (6, 23, 4);

-- ============================================================================
-- 6. CUSTOM CAKE OPTIONS
-- ============================================================================

-- Cake Flavors
INSERT INTO cake_flavors (flavor_name, description, image_url, additional_cost, is_available, display_order) VALUES
('Chocolate', 'Rich chocolate flavor', '/images/flavors/chocolate.jpg', 0.00, TRUE, 1),
('Vanilla', 'Classic vanilla flavor', '/images/flavors/vanilla.jpg', 0.00, TRUE, 2),
('Strawberry', 'Fresh strawberry flavor', '/images/flavors/strawberry.jpg', 50.00, TRUE, 3),
('Ube', 'Purple yam flavor', '/images/flavors/ube.jpg', 75.00, TRUE, 4),
('Mocha', 'Coffee chocolate flavor', '/images/flavors/mocha.jpg', 50.00, TRUE, 5),
('Red Velvet', 'Classic red velvet', '/images/flavors/red-velvet.jpg', 100.00, TRUE, 6),
('Mango', 'Fresh mango flavor', '/images/flavors/mango.jpg', 80.00, TRUE, 7),
('Cheese', 'Creamy cheese flavor', '/images/flavors/cheese.jpg', 60.00, TRUE, 8);

-- Cake Sizes
INSERT INTO cake_sizes (size_name, description, serves_people, diameter_inches, size_multiplier, is_available, display_order) VALUES
('Small (6")', 'Perfect for 4-6 people', 6, 6.0, 1.00, TRUE, 1),
('Medium (8")', 'Perfect for 8-12 people', 10, 8.0, 1.50, TRUE, 2),
('Large (10")', 'Perfect for 15-20 people', 18, 10.0, 2.00, TRUE, 3),
('Extra Large (12")', 'Perfect for 25-30 people', 28, 12.0, 2.50, TRUE, 4),
('Sheet Cake', 'Perfect for 40-50 people', 45, 0.0, 3.00, TRUE, 5);

-- Custom Cake Themes
INSERT INTO custom_cake_theme (theme_name, description, theme_image_url, base_additional_cost, preparation_days, is_available, display_order) VALUES
('Birthday Celebration', 'Colorful birthday themed decorations', '/images/themes/birthday.jpg', 200.00, 2, TRUE, 1),
('Wedding Elegance', 'Elegant wedding cake design', '/images/themes/wedding.jpg', 500.00, 5, TRUE, 2),
('Kids Party', 'Fun and playful designs for kids', '/images/themes/kids.jpg', 250.00, 2, TRUE, 3),
('Graduation', 'Congratulations graduate theme', '/images/themes/graduation.jpg', 300.00, 3, TRUE, 4),
('Anniversary', 'Romantic anniversary design', '/images/themes/anniversary.jpg', 350.00, 3, TRUE, 5),
('Baby Shower', 'Cute baby themed cake', '/images/themes/baby-shower.jpg', 280.00, 2, TRUE, 6),
('Corporate Event', 'Professional corporate design', '/images/themes/corporate.jpg', 400.00, 4, TRUE, 7),
('Floral Garden', 'Beautiful edible flower decorations', '/images/themes/floral.jpg', 450.00, 4, TRUE, 8);

-- ============================================================================
-- 7. CUSTOM CAKE CAPACITY
-- ============================================================================

INSERT INTO custom_cake_daily_capacity (capacity_date, max_simple_cakes, max_moderate_cakes, max_complex_cakes, max_intricate_cakes, is_available, notes) VALUES
('2025-11-20', 10, 5, 3, 1, TRUE, 'Regular weekday capacity'),
('2025-11-21', 10, 5, 3, 1, TRUE, 'Regular weekday capacity'),
('2025-11-22', 8, 4, 2, 1, TRUE, 'Friday - reduced capacity'),
('2025-11-23', 5, 3, 1, 0, TRUE, 'Saturday - limited capacity'),
('2025-11-24', 5, 3, 1, 0, TRUE, 'Sunday - limited capacity'),
('2025-11-25', 10, 5, 3, 1, TRUE, 'Regular weekday capacity'),
('2025-12-24', 15, 8, 5, 2, TRUE, 'Christmas Eve - increased capacity'),
('2025-12-25', 0, 0, 0, 0, FALSE, 'Christmas Day - Shop Closed'),
('2025-12-31', 20, 10, 6, 2, TRUE, 'New Year Eve - maximum capacity'),
('2026-01-01', 0, 0, 0, 0, FALSE, 'New Year Day - Shop Closed');

-- ============================================================================
-- 8. PROMOTIONS
-- ============================================================================

INSERT INTO promotion_rules (promotion_name, description, promotion_type, discount_percentage, discount_amount, min_purchase_amount, start_date, end_date, start_time, end_time, is_active, is_stackable, display_on_kiosk, created_by) VALUES
('Early Bird Discount', '10% off for purchases before 9 AM', 'percentage', 10.00, 0.00, 100.00, '2024-01-01', '2025-12-31', '06:00:00', '09:00:00', TRUE, FALSE, TRUE, 1),
('Weekend Special', '₱50 off on purchases above ₱500', 'fixed_amount', 0.00, 50.00, 500.00, '2024-01-01', '2025-12-31', '00:00:00', '23:59:59', TRUE, TRUE, TRUE, 1),
('Buy 5 Get 1 Free Pandesal', 'Buy 5 pandesal, get 1 free', 'buy_x_get_y', 0.00, 0.00, 0.00, '2024-01-01', '2025-12-31', '00:00:00', '23:59:59', TRUE, FALSE, TRUE, 1),
('Senior Citizen Discount', '20% discount for senior citizens', 'percentage', 20.00, 0.00, 0.00, '2024-01-01', '2025-12-31', '00:00:00', '23:59:59', TRUE, FALSE, FALSE, 1),
('Birthday Month Special', '15% off for birthday celebrants', 'percentage', 15.00, 0.00, 200.00, '2024-01-01', '2025-12-31', '00:00:00', '23:59:59', TRUE, FALSE, TRUE, 1);

-- Promotion applicable to specific items
INSERT INTO promotion_applicable_items (promotion_id, menu_item_id) VALUES
(3, 11); -- Buy 5 Get 1 Free applies to Pandesal

-- Promotion applicable to categories
INSERT INTO promotion_applicable_categories (promotion_id, category_id) VALUES
(1, 1), -- Early Bird applies to Cakes
(1, 2), -- Early Bird applies to Pastries
(5, 1); -- Birthday Special applies to Cakes

-- ============================================================================
-- 9. CUSTOMERS
-- ============================================================================

INSERT INTO customer (first_name, last_name, phone, email, date_of_birth, loyalty_points, total_orders, total_spent, is_active) VALUES
('Juan', 'Dela Cruz', '+63-917-123-4567', 'juan.delacruz@email.com', '1985-05-15', 450, 12, 4500.00, TRUE),
('Maria', 'Santos', '+63-917-234-5678', 'maria.santos@email.com', '1990-08-22', 320, 8, 3200.00, TRUE),
('Pedro', 'Reyes', '+63-917-345-6789', 'pedro.reyes@email.com', '1988-03-10', 580, 15, 5800.00, TRUE),
('Ana', 'Garcia', '+63-917-456-7890', 'ana.garcia@email.com', '1995-11-30', 210, 5, 2100.00, TRUE),
('Carlos', 'Mendoza', '+63-917-567-8901', 'carlos.mendoza@email.com', '1982-07-18', 690, 18, 6900.00, TRUE),
('Sofia', 'Torres', '+63-917-678-9012', 'sofia.torres@email.com', '1992-12-05', 150, 4, 1500.00, TRUE),
('Miguel', 'Rivera', '+63-917-789-0123', 'miguel.rivera@email.com', '1987-09-25', 380, 10, 3800.00, TRUE),
('Isabel', 'Flores', '+63-917-890-1234', 'isabel.flores@email.com', '1993-04-14', 270, 7, 2700.00, TRUE);

-- ============================================================================
-- 10. CUSTOM CAKE DESIGNS (for pre-orders)
-- ============================================================================

INSERT INTO custom_cake_design (theme_id, frosting_color, frosting_type, decoration_details, cake_text, special_instructions, design_complexity, additional_cost) VALUES
(1, 'Pink', 'buttercream', 'Rainbow sprinkles, unicorn topper', 'Happy Birthday Sarah!', 'Please use pastel colors', 'simple', 100.00),
(3, 'Blue', 'fondant', 'Superhero figurines, city skyline', 'Happy 7th Birthday Miguel!', 'Use Batman and Superman', 'complex', 350.00),
(2, 'White', 'fondant', 'Edible pearls, gold accents', 'Congratulations!', 'Elegant and minimalist', 'intricate', 600.00),
(4, 'Black and Gold', 'buttercream', 'Graduation cap, diploma scroll', 'Class of 2025', 'School colors: black and gold', 'moderate', 200.00),
(5, 'Red and Gold', 'cream_cheese', 'Red roses, golden hearts', '25 Years Together', 'Anniversary date: Nov 15, 2000', 'moderate', 250.00);

-- ============================================================================
-- 11. SAMPLE ORDERS
-- ============================================================================

-- Order 1: Walk-in order (Completed)
INSERT INTO customer_order (order_number, verification_code, customer_id, order_datetime, order_type, order_source, total_amount, discount_amount, tax_amount, final_amount, cashier_id, payment_method, payment_status, order_status, is_printed) VALUES
('ORD20251116-001234', '123456', 1, '2025-11-16 08:30:00', 'walk_in', 'kiosk', 535.00, 53.50, 57.78, 539.28, 1, 'gcash', 'paid', 'completed', TRUE);

INSERT INTO order_item (order_id, menu_item_id, quantity, unit_price, item_total) VALUES
(1, 6, 5, 55.00, 275.00), -- 5 Ensaymada
(1, 15, 2, 60.00, 120.00), -- 2 Brewed Coffee
(1, 11, 10, 12.00, 120.00), -- 10 Pandesal
(1, 9, 1, 75.00, 75.00); -- 1 Chocolate Croissant

-- Order 2: Pre-order (Ready for pickup)
INSERT INTO customer_order (order_number, verification_code, customer_id, order_datetime, scheduled_pickup_datetime, order_type, order_source, is_preorder, total_amount, discount_amount, tax_amount, final_amount, cashier_id, payment_method, payment_status, order_status, gcash_reference_number, payment_verified_at, payment_verified_by) VALUES
('ORD20251115-002345', '234567', 2, '2025-11-15 14:00:00', '2025-11-16 16:00:00', 'pre_order', 'kiosk', TRUE, 450.00, 0.00, 54.00, 504.00, 1, 'gcash', 'paid', 'ready', 'GC-2025111512345', '2025-11-15 14:05:00', 1);

INSERT INTO order_item (order_id, menu_item_id, quantity, unit_price, item_total) VALUES
(2, 1, 1, 450.00, 450.00); -- 1 Chocolate Fudge Cake

-- Order 3: Custom cake order (Preparing)
INSERT INTO customer_order (order_number, verification_code, customer_id, order_datetime, scheduled_pickup_datetime, order_type, order_source, is_preorder, advance_payment_required, advance_payment_amount, total_amount, discount_amount, tax_amount, final_amount, payment_method, payment_status, order_status, special_instructions) VALUES
('ORD20251114-003456', '345678', 3, '2025-11-14 10:00:00', '2025-11-18 14:00:00', 'custom_order', 'kiosk', TRUE, TRUE, 400.00, 1200.00, 0.00, 144.00, 1344.00, 'gcash', 'partial_paid', 'preparing', 'Please call when ready');

INSERT INTO order_item (order_id, menu_item_id, custom_cake_design_id, flavor_id, size_id, quantity, unit_price, flavor_cost, size_multiplier, design_cost, item_total) VALUES
(3, 2, 1, 1, 3, 1, 400.00, 0.00, 2.00, 100.00, 1200.00); -- Custom Birthday Cake

-- Order 4: Pending order (Just placed)
INSERT INTO customer_order (order_number, verification_code, customer_id, order_datetime, order_type, order_source, total_amount, discount_amount, tax_amount, final_amount, payment_method, payment_status, order_status) VALUES
('ORD20251116-004567', '456789', 4, '2025-11-16 11:30:00', 'walk_in', 'kiosk', 365.00, 0.00, 43.80, 408.80, 'cash', 'pending', 'pending');

INSERT INTO order_item (order_id, menu_item_id, quantity, unit_price, item_total) VALUES
(4, 21, 2, 150.00, 300.00), -- 2 Halo-Halo
(4, 7, 5, 35.00, 175.00); -- 5 Cheese Pandesal

-- Order 5: Large order (Confirmed)
INSERT INTO customer_order (order_number, verification_code, customer_id, order_datetime, scheduled_pickup_datetime, order_type, order_source, is_preorder, total_amount, discount_amount, tax_amount, final_amount, cashier_id, payment_method, payment_status, order_status, paymaya_reference_number, payment_verified_at, payment_verified_by) VALUES
('ORD20251115-005678', '567890', 5, '2025-11-15 09:00:00', '2025-11-16 18:00:00', 'pre_order', 'cashier', TRUE, 2150.00, 215.00, 232.20, 2167.20, 1, 'paymaya', 'paid', 'confirmed', 'PM-2025111509876', '2025-11-15 09:10:00', 1);

INSERT INTO order_item (order_id, menu_item_id, quantity, unit_price, item_total) VALUES
(5, 3, 2, 500.00, 1000.00), -- 2 Red Velvet Cakes
(5, 5, 1, 420.00, 420.00), -- 1 Ube Cake
(5, 6, 10, 55.00, 550.00), -- 10 Ensaymada
(5, 16, 2, 95.00, 190.00); -- 2 Cappuccino

-- ============================================================================
-- 12. ORDER TIMELINE
-- ============================================================================

INSERT INTO order_timeline (order_id, status, changed_by, notes) VALUES
(1, 'pending', NULL, 'Order placed via kiosk'),
(1, 'confirmed', 1, 'Payment verified'),
(1, 'preparing', 1, 'Started preparing items'),
(1, 'ready', 1, 'Order ready for pickup'),
(1, 'completed', 1, 'Customer picked up order'),
(2, 'pending', NULL, 'Pre-order placed'),
(2, 'confirmed', 1, 'Payment verified'),
(2, 'preparing', 1, 'Cake in preparation'),
(2, 'ready', 1, 'Ready for scheduled pickup'),
(3, 'pending', NULL, 'Custom cake order received'),
(3, 'confirmed', 1, 'Advance payment received'),
(3, 'preparing', 1, 'Custom cake in production'),
(4, 'pending', NULL, 'Order placed, awaiting payment'),
(5, 'pending', NULL, 'Large pre-order received'),
(5, 'confirmed', 1, 'Payment verified');

-- ============================================================================
-- 13. PAYMENT TRANSACTIONS
-- ============================================================================

INSERT INTO payment_transaction (order_id, payment_method, amount, reference_number, payment_status, verified_by, verified_at) VALUES
(1, 'gcash', 539.28, 'GC-2025111608301', 'verified', 1, '2025-11-16 08:32:00'),
(2, 'gcash', 504.00, 'GC-2025111512345', 'verified', 1, '2025-11-15 14:05:00'),
(3, 'gcash', 400.00, 'GC-2025111410001', 'verified', 1, '2025-11-14 10:05:00'),
(5, 'paymaya', 2167.20, 'PM-2025111509876', 'verified', 1, '2025-11-15 09:10:00');

-- ============================================================================
-- 14. CUSTOMER FEEDBACK
-- ============================================================================

INSERT INTO customer_feedback (order_id, customer_id, rating, service_rating, food_rating, cleanliness_rating, feedback_text, feedback_type, is_anonymous) VALUES
(1, 1, 5, 5, 5, 5, 'Excellent service! The ensaymada was fresh and delicious. The kiosk ordering was very easy to use.', 'positive', FALSE),
(2, 2, 4, 4, 5, 4, 'Great cake! Very moist and tasty. Pickup was smooth.', 'positive', FALSE);

-- ============================================================================
-- 15. WASTE TRACKING
-- ============================================================================

INSERT INTO waste_tracking (menu_item_id, quantity_wasted, waste_reason, waste_cost, reason_details, reported_by, waste_date) VALUES
(7, 8, 'expired', 280.00, 'Left over pandesal from yesterday, past freshness date', 1, '2025-11-16'),
(10, 3, 'damaged', 195.00, 'Custard tarts dropped during restocking', 1, '2025-11-15'),
(4, 1, 'quality_issue', 380.00, 'Cake had texture issues, did not meet quality standards', 1, '2025-11-14');

-- ============================================================================
-- 16. INVENTORY ALERTS
-- ============================================================================

INSERT INTO inventory_alert (menu_item_id, alert_type, alert_message, threshold_value, current_value, is_acknowledged) VALUES
(4, 'low_stock', 'Mango Float Cake stock is running low', 3, 8, FALSE),
(3, 'low_stock', 'Red Velvet Cake stock is running low', 3, 10, FALSE);

-- ============================================================================
-- 17. REFUND REQUEST
-- ============================================================================

INSERT INTO refund_request (order_id, order_item_id, refund_type, refund_amount, refund_reason, reason_details, refund_method, requested_by, refund_status, notes) VALUES
(1, 2, 'item', 120.00, 'wrong_item', 'Customer ordered iced coffee but received hot coffee', 'gcash', 1, 'completed', 'Refunded via GCash same day');

-- ============================================================================
-- 18. MENU ITEM DAILY STATS
-- ============================================================================

INSERT INTO menu_item_daily_stats (menu_item_id, stats_date, daily_orders, daily_quantity_sold, daily_revenue) VALUES
-- November 15, 2025
(1, '2025-11-15', 3, 3, 1350.00),
(6, '2025-11-15', 5, 25, 1375.00),
(11, '2025-11-15', 12, 120, 1440.00),
(15, '2025-11-15', 8, 15, 900.00),
-- November 16, 2025
(1, '2025-11-16', 1, 1, 450.00),
(6, '2025-11-16', 2, 15, 825.00),
(11, '2025-11-16', 5, 50, 600.00),
(21, '2025-11-16', 1, 2, 300.00);

-- ============================================================================
-- 19. KIOSK SESSIONS
-- ============================================================================

INSERT INTO kiosk_session (session_id, session_start, session_end, total_orders, session_duration_minutes) VALUES
('KIOSK-001-20251116-083000', '2025-11-16 08:30:00', '2025-11-16 08:35:00', 1, 5),
('KIOSK-001-20251116-113000', '2025-11-16 11:30:00', '2025-11-16 11:38:00', 1, 8),
('KIOSK-002-20251115-140000', '2025-11-15 14:00:00', '2025-11-15 14:12:00', 1, 12);

-- ============================================================================
-- 20. PROMOTION USAGE LOG
-- ============================================================================

INSERT INTO promotion_usage_log (promotion_id, order_id, customer_id, discount_applied) VALUES
(1, 1, 1, 53.50); -- Early Bird Discount applied to Order 1

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

SELECT '============================================================================' as '';
SELECT 'GOLDEN MUNCH POS - TEST DATA CREATED SUCCESSFULLY!' as status;
SELECT '============================================================================' as '';
SELECT '' as '';
SELECT 'DATA SUMMARY:' as '';
SELECT '------------' as '';
SELECT CONCAT('Suppliers: ', COUNT(*)) as count FROM suppliers;
SELECT CONCAT('Categories: ', COUNT(*)) as count FROM category;
SELECT CONCAT('Menu Items: ', COUNT(*)) as count FROM menu_item WHERE is_deleted = FALSE;
SELECT CONCAT('Active Prices: ', COUNT(*)) as count FROM menu_item_price WHERE is_active = TRUE;
SELECT CONCAT('Cake Flavors: ', COUNT(*)) as count FROM cake_flavors WHERE is_available = TRUE;
SELECT CONCAT('Cake Sizes: ', COUNT(*)) as count FROM cake_sizes WHERE is_available = TRUE;
SELECT CONCAT('Cake Themes: ', COUNT(*)) as count FROM custom_cake_theme WHERE is_available = TRUE;
SELECT CONCAT('Customers: ', COUNT(*)) as count FROM customer WHERE is_active = TRUE;
SELECT CONCAT('Orders: ', COUNT(*)) as count FROM customer_order WHERE is_deleted = FALSE;
SELECT CONCAT('Promotions: ', COUNT(*)) as count FROM promotion_rules WHERE is_active = TRUE;
SELECT CONCAT('Feedback Entries: ', COUNT(*)) as count FROM customer_feedback;
SELECT CONCAT('Waste Reports: ', COUNT(*)) as count FROM waste_tracking;
SELECT '' as '';
SELECT 'ORDER STATUS BREAKDOWN:' as '';
SELECT '----------------------' as '';
SELECT order_status, COUNT(*) as count
FROM customer_order
WHERE is_deleted = FALSE
GROUP BY order_status;
SELECT '' as '';
SELECT 'TOP SELLING ITEMS:' as '';
SELECT '-------------------' as '';
SELECT mi.name, mi.total_quantity_sold, mi.popularity_score
FROM menu_item mi
WHERE mi.is_deleted = FALSE
ORDER BY mi.popularity_score DESC
LIMIT 5;
SELECT '' as '';
SELECT '============================================================================' as '';
SELECT '✅ Test data is ready for use!' as '';
SELECT '============================================================================' as '';
