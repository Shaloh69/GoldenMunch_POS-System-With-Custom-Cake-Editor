-- ============================================================================
-- GOLDEN MUNCH POS - ENHANCED KIOSK SYSTEM
-- Version: 2.0
-- Description: Complete POS system for cake shop with custom cake orders
--              Optimized for kiosk self-service ordering
-- ============================================================================

DROP DATABASE IF EXISTS GoldenMunchPOS;
CREATE DATABASE GoldenMunchPOS CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE GoldenMunchPOS;

-- ============================================================================
-- USER MANAGEMENT & SECURITY
-- ============================================================================

CREATE TABLE roles (
    role_id INT AUTO_INCREMENT PRIMARY KEY,
    role_name VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE admin (
    admin_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    role_id INT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(role_id),
    INDEX idx_admin_username (username),
    INDEX idx_admin_email (email),
    INDEX idx_admin_active (is_active)
);

CREATE TABLE cashier (
    cashier_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    cashier_code VARCHAR(20) NOT NULL UNIQUE,
    pin_hash VARCHAR(255) NOT NULL COMMENT 'Hashed PIN for quick cashier login',
    phone VARCHAR(20),
    email VARCHAR(100),
    hire_date DATE,
    hourly_rate DECIMAL(8,2),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_cashier_code (cashier_code),
    INDEX idx_cashier_active (is_active)
);

-- ============================================================================
-- PRODUCT CATALOG SYSTEM
-- ============================================================================

CREATE TABLE category (
    category_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    description VARCHAR(255),
    image_url VARCHAR(255) COMMENT 'Category image for kiosk display',
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    admin_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_id) REFERENCES admin(admin_id),
    INDEX idx_category_active (is_active),
    INDEX idx_category_order (display_order)
);

CREATE TABLE suppliers (
    supplier_id INT AUTO_INCREMENT PRIMARY KEY,
    supplier_name VARCHAR(100) NOT NULL,
    contact_person VARCHAR(100),
    phone VARCHAR(20),
    email VARCHAR(100),
    address TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE menu_item (
    menu_item_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    image_url VARCHAR(255) COMMENT 'Product image for kiosk display',
    item_type ENUM('cake', 'pastry', 'beverage', 'snack', 'main_dish', 'appetizer', 'dessert', 'bread', 'other') NOT NULL DEFAULT 'other',
    unit_of_measure ENUM('piece', 'dozen', 'half_dozen', 'kilogram', 'gram', 'liter', 'milliliter', 'serving', 'box', 'pack') DEFAULT 'piece',
    stock_quantity INT NOT NULL DEFAULT 0,
    is_infinite_stock BOOLEAN DEFAULT FALSE,
    min_stock_level INT DEFAULT 5,
    status ENUM('available', 'sold_out', 'discontinued') NOT NULL DEFAULT 'available',
    can_customize BOOLEAN DEFAULT FALSE,
    can_preorder BOOLEAN DEFAULT FALSE,
    preparation_time_minutes INT DEFAULT 0,
    popularity_score DECIMAL(8,2) DEFAULT 0.00,
    total_orders INT DEFAULT 0,
    total_quantity_sold INT DEFAULT 0,
    last_ordered_date DATE NULL,
    supplier_id INT,
    is_featured BOOLEAN DEFAULT FALSE COMMENT 'Featured items shown prominently on kiosk',
    allergen_info TEXT COMMENT 'Allergen information to display on kiosk',
    nutritional_info TEXT COMMENT 'Nutritional information (optional)',
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(supplier_id),
    INDEX idx_menu_item_status (status),
    INDEX idx_menu_item_type (item_type),
    INDEX idx_menu_item_active (is_deleted),
    INDEX idx_menu_item_stock (stock_quantity),
    INDEX idx_menu_item_infinite (is_infinite_stock),
    INDEX idx_menu_item_preorder (can_preorder),
    INDEX idx_menu_item_featured (is_featured),
    INDEX idx_menu_item_popularity (popularity_score DESC),
    INDEX idx_menu_item_last_ordered (last_ordered_date),
    CONSTRAINT chk_stock_quantity_positive CHECK (stock_quantity >= 0),
    CONSTRAINT chk_min_stock_positive CHECK (min_stock_level >= 0),
    CONSTRAINT chk_prep_time_positive CHECK (preparation_time_minutes >= 0),
    CONSTRAINT chk_popularity_positive CHECK (popularity_score >= 0),
    CONSTRAINT chk_total_orders_positive CHECK (total_orders >= 0),
    CONSTRAINT chk_total_quantity_positive CHECK (total_quantity_sold >= 0)
);

CREATE TABLE menu_item_price (
    price_id INT AUTO_INCREMENT PRIMARY KEY,
    menu_item_id INT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    price_type ENUM('regular', 'promotion', 'seasonal', 'bulk') DEFAULT 'regular',
    is_active BOOLEAN DEFAULT TRUE,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (menu_item_id) REFERENCES menu_item(menu_item_id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES admin(admin_id),
    INDEX idx_price_dates (start_date, end_date),
    INDEX idx_price_item (menu_item_id),
    INDEX idx_price_active (is_active),
    CONSTRAINT chk_price_positive CHECK (price > 0),
    CONSTRAINT chk_valid_date_range CHECK (start_date <= end_date)
);

CREATE TABLE category_has_menu_item (
    category_id INT NOT NULL,
    menu_item_id INT NOT NULL,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (category_id, menu_item_id),
    FOREIGN KEY (category_id) REFERENCES category(category_id) ON DELETE CASCADE,
    FOREIGN KEY (menu_item_id) REFERENCES menu_item(menu_item_id) ON DELETE CASCADE
);

-- ============================================================================
-- PROMOTION & DISCOUNT SYSTEM
-- ============================================================================

CREATE TABLE promotion_rules (
    promotion_id INT AUTO_INCREMENT PRIMARY KEY,
    promotion_name VARCHAR(100) NOT NULL,
    description TEXT,
    promotion_type ENUM('percentage', 'fixed_amount', 'buy_x_get_y', 'bundle', 'seasonal') NOT NULL,
    discount_percentage DECIMAL(5,2) DEFAULT 0.00 COMMENT 'For percentage-based discounts',
    discount_amount DECIMAL(10,2) DEFAULT 0.00 COMMENT 'For fixed amount discounts',
    min_purchase_amount DECIMAL(10,2) DEFAULT 0.00 COMMENT 'Minimum purchase required',
    min_quantity INT DEFAULT 0 COMMENT 'Minimum quantity required',
    buy_quantity INT DEFAULT 0 COMMENT 'For Buy X Get Y promotions',
    get_quantity INT DEFAULT 0 COMMENT 'For Buy X Get Y promotions',
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    start_time TIME DEFAULT '00:00:00' COMMENT 'Daily start time for promotion',
    end_time TIME DEFAULT '23:59:59' COMMENT 'Daily end time for promotion',
    max_uses_per_customer INT DEFAULT NULL COMMENT 'Usage limit per customer',
    total_usage_limit INT DEFAULT NULL COMMENT 'Total times promotion can be used',
    current_usage_count INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    is_stackable BOOLEAN DEFAULT FALSE COMMENT 'Can be combined with other promotions',
    display_on_kiosk BOOLEAN DEFAULT TRUE COMMENT 'Show this promotion on kiosk',
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES admin(admin_id),
    INDEX idx_promotion_dates (start_date, end_date),
    INDEX idx_promotion_active (is_active),
    INDEX idx_promotion_kiosk (display_on_kiosk),
    CONSTRAINT chk_promotion_dates CHECK (start_date <= end_date),
    CONSTRAINT chk_discount_percentage CHECK (discount_percentage BETWEEN 0 AND 100),
    CONSTRAINT chk_discount_amount CHECK (discount_amount >= 0)
);

CREATE TABLE promotion_applicable_items (
    promotion_id INT NOT NULL,
    menu_item_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (promotion_id, menu_item_id),
    FOREIGN KEY (promotion_id) REFERENCES promotion_rules(promotion_id) ON DELETE CASCADE,
    FOREIGN KEY (menu_item_id) REFERENCES menu_item(menu_item_id) ON DELETE CASCADE
);

CREATE TABLE promotion_applicable_categories (
    promotion_id INT NOT NULL,
    category_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (promotion_id, category_id),
    FOREIGN KEY (promotion_id) REFERENCES promotion_rules(promotion_id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES category(category_id) ON DELETE CASCADE
);

CREATE TABLE promotion_usage_log (
    usage_id INT AUTO_INCREMENT PRIMARY KEY,
    promotion_id INT NOT NULL,
    order_id INT NOT NULL,
    customer_id INT NULL,
    discount_applied DECIMAL(10,2) NOT NULL,
    used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (promotion_id) REFERENCES promotion_rules(promotion_id),
    FOREIGN KEY (order_id) REFERENCES customer_order(order_id) ON DELETE CASCADE,
    FOREIGN KEY (customer_id) REFERENCES customer(customer_id) ON DELETE SET NULL,
    INDEX idx_promotion_usage_order (order_id),
    INDEX idx_promotion_usage_customer (customer_id),
    INDEX idx_promotion_usage_date (used_at)
);

-- ============================================================================
-- TAX CONFIGURATION SYSTEM
-- ============================================================================

CREATE TABLE tax_rules (
    tax_id INT AUTO_INCREMENT PRIMARY KEY,
    tax_name VARCHAR(50) NOT NULL COMMENT 'e.g., VAT, Sales Tax, Service Charge',
    tax_type ENUM('percentage', 'fixed') NOT NULL DEFAULT 'percentage',
    tax_rate DECIMAL(5,2) NOT NULL COMMENT 'Percentage rate (e.g., 12.00 for 12%)',
    fixed_amount DECIMAL(10,2) DEFAULT 0.00 COMMENT 'For fixed tax type',
    is_inclusive BOOLEAN DEFAULT FALSE COMMENT 'Tax included in price or added on top',
    apply_to_item_types TEXT COMMENT 'JSON array of item types this tax applies to',
    is_active BOOLEAN DEFAULT TRUE,
    effective_date DATE NOT NULL,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES admin(admin_id),
    INDEX idx_tax_active (is_active),
    INDEX idx_tax_effective (effective_date),
    CONSTRAINT chk_tax_rate CHECK (tax_rate >= 0 AND tax_rate <= 100),
    CONSTRAINT chk_fixed_amount CHECK (fixed_amount >= 0)
);

-- ============================================================================
-- CUSTOM CAKE SYSTEM
-- ============================================================================

CREATE TABLE cake_flavors (
    flavor_id INT AUTO_INCREMENT PRIMARY KEY,
    flavor_name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    image_url VARCHAR(255) COMMENT 'Flavor image for kiosk display',
    additional_cost DECIMAL(10,2) DEFAULT 0.00,
    is_available BOOLEAN DEFAULT TRUE,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_flavor_available (is_available),
    INDEX idx_flavor_order (display_order),
    CONSTRAINT chk_flavor_cost_positive CHECK (additional_cost >= 0)
);

CREATE TABLE cake_sizes (
    size_id INT AUTO_INCREMENT PRIMARY KEY,
    size_name VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(100),
    serves_people INT,
    diameter_inches DECIMAL(4,1) COMMENT 'Cake diameter in inches',
    size_multiplier DECIMAL(4,2) DEFAULT 1.00,
    is_available BOOLEAN DEFAULT TRUE,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_size_available (is_available),
    INDEX idx_size_order (display_order),
    CONSTRAINT chk_serves_people_positive CHECK (serves_people > 0),
    CONSTRAINT chk_size_multiplier_positive CHECK (size_multiplier > 0)
);

CREATE TABLE custom_cake_theme (
    theme_id INT AUTO_INCREMENT PRIMARY KEY,
    theme_name VARCHAR(100) NOT NULL,
    description TEXT,
    theme_image_url VARCHAR(255) COMMENT 'Theme preview image for kiosk',
    base_additional_cost DECIMAL(10,2) DEFAULT 0.00,
    preparation_days INT DEFAULT 3 COMMENT 'Days needed to prepare this theme',
    is_available BOOLEAN DEFAULT TRUE,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_theme_available (is_available),
    INDEX idx_theme_order (display_order),
    CONSTRAINT chk_theme_cost_positive CHECK (base_additional_cost >= 0),
    CONSTRAINT chk_prep_days_positive CHECK (preparation_days >= 0)
);

CREATE TABLE custom_cake_design (
    design_id INT AUTO_INCREMENT PRIMARY KEY,
    theme_id INT NULL,
    frosting_color VARCHAR(50),
    frosting_type ENUM('buttercream', 'fondant', 'whipped_cream', 'ganache', 'cream_cheese') DEFAULT 'buttercream',
    decoration_details TEXT COMMENT 'Customer specified decorations',
    cake_text VARCHAR(255) COMMENT 'Text to write on cake',
    special_instructions TEXT,
    design_complexity ENUM('simple', 'moderate', 'complex', 'intricate') DEFAULT 'simple',
    additional_cost DECIMAL(10,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (theme_id) REFERENCES custom_cake_theme(theme_id),
    CONSTRAINT chk_design_cost_positive CHECK (additional_cost >= 0)
);

-- ============================================================================
-- CUSTOM CAKE CAPACITY MANAGEMENT
-- ============================================================================

CREATE TABLE custom_cake_daily_capacity (
    capacity_id INT AUTO_INCREMENT PRIMARY KEY,
    capacity_date DATE NOT NULL UNIQUE,
    max_simple_cakes INT DEFAULT 10,
    max_moderate_cakes INT DEFAULT 5,
    max_complex_cakes INT DEFAULT 3,
    max_intricate_cakes INT DEFAULT 1,
    current_simple_count INT DEFAULT 0,
    current_moderate_count INT DEFAULT 0,
    current_complex_count INT DEFAULT 0,
    current_intricate_count INT DEFAULT 0,
    is_available BOOLEAN DEFAULT TRUE COMMENT 'Shop open this day for custom orders',
    notes TEXT COMMENT 'Special notes like holidays, events',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_capacity_date (capacity_date),
    INDEX idx_capacity_available (is_available),
    CONSTRAINT chk_simple_capacity CHECK (current_simple_count <= max_simple_cakes),
    CONSTRAINT chk_moderate_capacity CHECK (current_moderate_count <= max_moderate_cakes),
    CONSTRAINT chk_complex_capacity CHECK (current_complex_count <= max_complex_cakes),
    CONSTRAINT chk_intricate_capacity CHECK (current_intricate_count <= max_intricate_cakes)
);

-- ============================================================================
-- CUSTOMER MANAGEMENT (SIMPLIFIED FOR KIOSK)
-- ============================================================================

CREATE TABLE customer (
    customer_id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    phone VARCHAR(20) COMMENT 'Primary identifier for kiosk',
    email VARCHAR(100),
    date_of_birth DATE,
    loyalty_points INT DEFAULT 0,
    total_orders INT DEFAULT 0,
    total_spent DECIMAL(12,2) DEFAULT 0.00,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_customer_phone (phone),
    INDEX idx_customer_email (email),
    CONSTRAINT chk_loyalty_points_positive CHECK (loyalty_points >= 0)
);

-- ============================================================================
-- KIOSK ORDER SYSTEM WITH VERIFICATION
-- ============================================================================

CREATE TABLE customer_order (
    order_id INT AUTO_INCREMENT PRIMARY KEY,
    order_number VARCHAR(20) NOT NULL UNIQUE COMMENT 'Displayed order number',
    verification_code VARCHAR(6) NOT NULL COMMENT 'Random 6-digit code for order pickup',
    customer_id INT NULL,
    order_datetime TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    scheduled_pickup_datetime TIMESTAMP NULL,
    actual_pickup_datetime TIMESTAMP NULL,
    order_type ENUM('walk_in', 'pickup', 'pre_order', 'custom_order') NOT NULL DEFAULT 'walk_in',
    order_source ENUM('kiosk', 'cashier', 'admin') NOT NULL DEFAULT 'kiosk',
    is_preorder BOOLEAN DEFAULT FALSE,
    advance_payment_required BOOLEAN DEFAULT FALSE,
    advance_payment_amount DECIMAL(10,2) DEFAULT 0.00,
    total_amount DECIMAL(10,2) NOT NULL,
    discount_amount DECIMAL(10,2) DEFAULT 0.00,
    tax_amount DECIMAL(10,2) DEFAULT 0.00,
    final_amount DECIMAL(10,2) NOT NULL,
    cashier_id INT NULL COMMENT 'Cashier who validated the order',
    payment_method ENUM('cash', 'gcash', 'paymaya', 'card', 'bank_transfer') NOT NULL,
    payment_status ENUM('pending', 'partial_paid', 'paid', 'failed', 'refunded') NOT NULL DEFAULT 'pending',
    order_status ENUM('pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled') NOT NULL DEFAULT 'pending',
    gcash_reference_number VARCHAR(100) NULL COMMENT 'GCash transaction reference',
    paymaya_reference_number VARCHAR(100) NULL COMMENT 'PayMaya transaction reference',
    card_transaction_ref VARCHAR(100) NULL COMMENT 'Card payment reference',
    payment_verified_at TIMESTAMP NULL,
    payment_verified_by INT NULL COMMENT 'Cashier who verified payment',
    is_printed BOOLEAN DEFAULT FALSE,
    special_instructions TEXT,
    kiosk_session_id VARCHAR(100) COMMENT 'Kiosk session identifier',
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customer(customer_id),
    FOREIGN KEY (cashier_id) REFERENCES cashier(cashier_id),
    FOREIGN KEY (payment_verified_by) REFERENCES cashier(cashier_id),
    INDEX idx_order_number (order_number),
    INDEX idx_verification_code (verification_code),
    INDEX idx_order_date (order_datetime),
    INDEX idx_scheduled_pickup (scheduled_pickup_datetime),
    INDEX idx_order_status (order_status),
    INDEX idx_payment_status (payment_status),
    INDEX idx_order_type (order_type),
    INDEX idx_order_source (order_source),
    INDEX idx_order_customer (customer_id),
    INDEX idx_preorder (is_preorder),
    INDEX idx_gcash_ref (gcash_reference_number),
    INDEX idx_order_datetime_status (order_datetime, order_status),
    INDEX idx_final_amount (final_amount),
    CONSTRAINT chk_total_amount_positive CHECK (total_amount >= 0),
    CONSTRAINT chk_discount_positive CHECK (discount_amount >= 0),
    CONSTRAINT chk_tax_positive CHECK (tax_amount >= 0),
    CONSTRAINT chk_final_amount_positive CHECK (final_amount >= 0),
    CONSTRAINT chk_advance_payment_positive CHECK (advance_payment_amount >= 0),
    CONSTRAINT chk_pickup_after_order CHECK (scheduled_pickup_datetime IS NULL OR scheduled_pickup_datetime > order_datetime),
    UNIQUE KEY unique_verification_code (verification_code, order_datetime)
);

CREATE TABLE order_item (
    order_item_id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    menu_item_id INT NOT NULL,
    custom_cake_design_id INT NULL,
    flavor_id INT NULL,
    size_id INT NULL,
    quantity INT NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL COMMENT 'Price at time of order',
    flavor_cost DECIMAL(10,2) DEFAULT 0.00,
    size_multiplier DECIMAL(4,2) DEFAULT 1.00,
    design_cost DECIMAL(10,2) DEFAULT 0.00,
    item_total DECIMAL(10,2) NOT NULL,
    special_instructions TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES customer_order(order_id) ON DELETE CASCADE,
    FOREIGN KEY (menu_item_id) REFERENCES menu_item(menu_item_id),
    FOREIGN KEY (custom_cake_design_id) REFERENCES custom_cake_design(design_id),
    FOREIGN KEY (flavor_id) REFERENCES cake_flavors(flavor_id),
    FOREIGN KEY (size_id) REFERENCES cake_sizes(size_id),
    INDEX idx_order_item_order (order_id),
    INDEX idx_order_item_menu (menu_item_id),
    CONSTRAINT chk_item_quantity_positive CHECK (quantity > 0),
    CONSTRAINT chk_unit_price_positive CHECK (unit_price >= 0),
    CONSTRAINT chk_item_total_positive CHECK (item_total >= 0)
);

-- ============================================================================
-- ORDER TIMELINE TRACKING
-- ============================================================================

CREATE TABLE order_timeline (
    timeline_id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    status ENUM('pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled') NOT NULL,
    changed_by INT NULL COMMENT 'Cashier or admin who made the change',
    change_reason VARCHAR(255),
    notes TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES customer_order(order_id) ON DELETE CASCADE,
    FOREIGN KEY (changed_by) REFERENCES cashier(cashier_id),
    INDEX idx_timeline_order (order_id),
    INDEX idx_timeline_status (status),
    INDEX idx_timeline_timestamp (timestamp)
);

-- ============================================================================
-- PAYMENT TRACKING
-- ============================================================================

CREATE TABLE payment_transaction (
    transaction_id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    payment_method ENUM('cash', 'gcash', 'paymaya', 'card', 'bank_transfer') NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    reference_number VARCHAR(100) COMMENT 'External payment reference',
    payment_status ENUM('pending', 'verified', 'failed', 'refunded') NOT NULL DEFAULT 'pending',
    verified_by INT NULL COMMENT 'Cashier who verified payment',
    verified_at TIMESTAMP NULL,
    payment_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES customer_order(order_id) ON DELETE CASCADE,
    FOREIGN KEY (verified_by) REFERENCES cashier(cashier_id),
    INDEX idx_payment_order (order_id),
    INDEX idx_payment_status (payment_status),
    INDEX idx_payment_reference (reference_number),
    INDEX idx_payment_created (created_at),
    CONSTRAINT chk_payment_amount_positive CHECK (amount > 0)
);

-- ============================================================================
-- REFUND SYSTEM
-- ============================================================================

CREATE TABLE refund_request (
    refund_id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    order_item_id INT NULL COMMENT 'Specific item being refunded, NULL for full order refund',
    refund_type ENUM('full', 'partial', 'item') NOT NULL,
    refund_amount DECIMAL(10,2) NOT NULL,
    refund_reason ENUM('customer_request', 'wrong_item', 'quality_issue', 'delay', 'cancellation', 'other') NOT NULL,
    reason_details TEXT,
    refund_method ENUM('cash', 'gcash', 'paymaya', 'card', 'bank_transfer', 'store_credit') NOT NULL,
    requested_by INT NOT NULL COMMENT 'Cashier who initiated refund',
    approved_by INT NULL COMMENT 'Admin who approved refund',
    refund_status ENUM('pending', 'approved', 'rejected', 'completed') NOT NULL DEFAULT 'pending',
    processed_at TIMESTAMP NULL,
    reference_number VARCHAR(100) COMMENT 'Refund transaction reference',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES customer_order(order_id),
    FOREIGN KEY (order_item_id) REFERENCES order_item(order_item_id),
    FOREIGN KEY (requested_by) REFERENCES cashier(cashier_id),
    FOREIGN KEY (approved_by) REFERENCES admin(admin_id),
    INDEX idx_refund_order (order_id),
    INDEX idx_refund_status (refund_status),
    INDEX idx_refund_created (created_at),
    CONSTRAINT chk_refund_amount_positive CHECK (refund_amount > 0)
);

-- ============================================================================
-- CUSTOMER FEEDBACK SYSTEM
-- ============================================================================

CREATE TABLE customer_feedback (
    feedback_id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    customer_id INT NULL,
    rating INT NOT NULL COMMENT 'Rating from 1-5',
    service_rating INT NULL COMMENT 'Service quality rating 1-5',
    food_rating INT NULL COMMENT 'Food quality rating 1-5',
    cleanliness_rating INT NULL COMMENT 'Cleanliness rating 1-5',
    feedback_text TEXT,
    feedback_type ENUM('positive', 'neutral', 'negative') NOT NULL,
    is_anonymous BOOLEAN DEFAULT FALSE,
    responded_by INT NULL COMMENT 'Admin who responded',
    response_text TEXT,
    responded_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES customer_order(order_id),
    FOREIGN KEY (customer_id) REFERENCES customer(customer_id),
    FOREIGN KEY (responded_by) REFERENCES admin(admin_id),
    INDEX idx_feedback_order (order_id),
    INDEX idx_feedback_customer (customer_id),
    INDEX idx_feedback_rating (rating),
    INDEX idx_feedback_type (feedback_type),
    INDEX idx_feedback_created (created_at),
    CONSTRAINT chk_rating_range CHECK (rating BETWEEN 1 AND 5),
    CONSTRAINT chk_service_rating_range CHECK (service_rating IS NULL OR service_rating BETWEEN 1 AND 5),
    CONSTRAINT chk_food_rating_range CHECK (food_rating IS NULL OR food_rating BETWEEN 1 AND 5),
    CONSTRAINT chk_cleanliness_rating_range CHECK (cleanliness_rating IS NULL OR cleanliness_rating BETWEEN 1 AND 5)
);

-- ============================================================================
-- INVENTORY MANAGEMENT
-- ============================================================================

CREATE TABLE stock_adjustment_reason (
    reason_id INT AUTO_INCREMENT PRIMARY KEY,
    reason_code VARCHAR(20) NOT NULL UNIQUE,
    reason_description VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE inventory_transaction (
    transaction_id INT AUTO_INCREMENT PRIMARY KEY,
    menu_item_id INT NOT NULL,
    transaction_type ENUM('in', 'out', 'adjustment', 'return', 'waste', 'transfer') NOT NULL,
    quantity INT NOT NULL,
    previous_quantity INT NOT NULL,
    new_quantity INT NOT NULL,
    reason_id INT NULL,
    notes TEXT COMMENT 'Additional transaction notes',
    reference_number VARCHAR(50),
    performed_by INT NOT NULL COMMENT 'References either admin_id or cashier_id depending on user role',
    performed_by_role ENUM('admin', 'cashier') NOT NULL DEFAULT 'admin' COMMENT 'Indicates whether performed_by references admin or cashier table',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (menu_item_id) REFERENCES menu_item(menu_item_id),
    FOREIGN KEY (reason_id) REFERENCES stock_adjustment_reason(reason_id),
    INDEX idx_inventory_item (menu_item_id),
    INDEX idx_inventory_type (transaction_type),
    INDEX idx_inventory_date (created_at),
    INDEX idx_inventory_performed_by (performed_by, performed_by_role)
);

CREATE TABLE inventory_alert (
    alert_id INT AUTO_INCREMENT PRIMARY KEY,
    menu_item_id INT NOT NULL,
    alert_type ENUM('low_stock', 'out_of_stock', 'expiring_soon', 'overstocked') NOT NULL,
    alert_message VARCHAR(255),
    threshold_value INT,
    current_value INT,
    is_acknowledged BOOLEAN DEFAULT FALSE,
    acknowledged_by INT NULL,
    acknowledged_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (menu_item_id) REFERENCES menu_item(menu_item_id),
    FOREIGN KEY (acknowledged_by) REFERENCES admin(admin_id),
    INDEX idx_alert_item (menu_item_id),
    INDEX idx_alert_type (alert_type),
    INDEX idx_alert_status (is_acknowledged)
);

-- ============================================================================
-- WASTE TRACKING SYSTEM
-- ============================================================================

CREATE TABLE waste_tracking (
    waste_id INT AUTO_INCREMENT PRIMARY KEY,
    menu_item_id INT NOT NULL,
    quantity_wasted INT NOT NULL,
    waste_reason ENUM('expired', 'damaged', 'overproduction', 'quality_issue', 'customer_return', 'other') NOT NULL,
    waste_cost DECIMAL(10,2) NOT NULL COMMENT 'Cost value of wasted items',
    reason_details TEXT,
    reported_by INT NOT NULL,
    waste_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (menu_item_id) REFERENCES menu_item(menu_item_id),
    FOREIGN KEY (reported_by) REFERENCES cashier(cashier_id),
    INDEX idx_waste_item (menu_item_id),
    INDEX idx_waste_date (waste_date),
    INDEX idx_waste_reason (waste_reason),
    CONSTRAINT chk_quantity_wasted_positive CHECK (quantity_wasted > 0),
    CONSTRAINT chk_waste_cost_positive CHECK (waste_cost >= 0)
);

-- ============================================================================
-- POPULARITY & ANALYTICS SYSTEM
-- ============================================================================

CREATE TABLE menu_item_daily_stats (
    stats_id INT AUTO_INCREMENT PRIMARY KEY,
    menu_item_id INT NOT NULL,
    stats_date DATE NOT NULL,
    daily_orders INT DEFAULT 0,
    daily_quantity_sold INT DEFAULT 0,
    daily_revenue DECIMAL(12,2) DEFAULT 0.00,
    UNIQUE KEY unique_item_date (menu_item_id, stats_date),
    FOREIGN KEY (menu_item_id) REFERENCES menu_item(menu_item_id) ON DELETE CASCADE,
    INDEX idx_stats_item (menu_item_id),
    INDEX idx_stats_date (stats_date),
    INDEX idx_stats_revenue (daily_revenue DESC)
);

CREATE TABLE popularity_history (
    history_id INT AUTO_INCREMENT PRIMARY KEY,
    menu_item_id INT NOT NULL,
    old_popularity_score DECIMAL(8,2),
    new_popularity_score DECIMAL(8,2),
    change_reason ENUM('order_placed', 'daily_decay', 'system_recalculation', 'manual_adjustment') NOT NULL,
    change_details VARCHAR(255),
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (menu_item_id) REFERENCES menu_item(menu_item_id) ON DELETE CASCADE,
    INDEX idx_popularity_item (menu_item_id),
    INDEX idx_popularity_date (changed_at)
);

-- ============================================================================
-- KIOSK CONFIGURATION
-- ============================================================================

CREATE TABLE kiosk_settings (
    setting_id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT NOT NULL,
    setting_type ENUM('string', 'number', 'boolean', 'json') NOT NULL DEFAULT 'string',
    description VARCHAR(255),
    updated_by INT NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (updated_by) REFERENCES admin(admin_id),
    INDEX idx_setting_key (setting_key)
);

CREATE TABLE kiosk_session (
    session_id VARCHAR(100) PRIMARY KEY,
    session_start TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    session_end TIMESTAMP NULL,
    total_orders INT DEFAULT 0,
    session_duration_minutes INT DEFAULT 0,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_session_start (session_start),
    INDEX idx_session_end (session_end)
);

-- ============================================================================
-- TRIGGERS FOR BUSINESS LOGIC
-- ============================================================================

DELIMITER //

-- Generate verification code for new orders
CREATE TRIGGER before_order_insert
BEFORE INSERT ON customer_order
FOR EACH ROW
BEGIN
    DECLARE v_code VARCHAR(6);
    DECLARE v_exists INT;
    
    -- Generate unique 6-digit verification code
    REPEAT
        SET v_code = LPAD(FLOOR(RAND() * 1000000), 6, '0');
        SELECT COUNT(*) INTO v_exists 
        FROM customer_order 
        WHERE verification_code = v_code 
        AND DATE(order_datetime) = CURDATE();
    UNTIL v_exists = 0 END REPEAT;
    
    SET NEW.verification_code = v_code;
    
    -- Generate order number if not provided
    IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
        SET NEW.order_number = CONCAT('ORD', DATE_FORMAT(NOW(), '%Y%m%d'), '-', LPAD(v_code, 6, '0'));
    END IF;
END;
//

-- Update inventory after order item insert
CREATE TRIGGER after_order_item_insert
AFTER INSERT ON order_item
FOR EACH ROW
BEGIN
    DECLARE v_is_infinite BOOLEAN;
    
    SELECT is_infinite_stock INTO v_is_infinite
    FROM menu_item 
    WHERE menu_item_id = NEW.menu_item_id;
    
    IF v_is_infinite = FALSE THEN
        UPDATE menu_item 
        SET stock_quantity = stock_quantity - NEW.quantity,
            total_orders = total_orders + 1,
            total_quantity_sold = total_quantity_sold + NEW.quantity,
            last_ordered_date = CURDATE()
        WHERE menu_item_id = NEW.menu_item_id;
        
        -- Check for low stock alert
        IF (SELECT stock_quantity FROM menu_item WHERE menu_item_id = NEW.menu_item_id) <= 
           (SELECT min_stock_level FROM menu_item WHERE menu_item_id = NEW.menu_item_id) THEN
            INSERT INTO inventory_alert (
                menu_item_id, 
                alert_type, 
                alert_message,
                threshold_value,
                current_value
            ) VALUES (
                NEW.menu_item_id,
                IF((SELECT stock_quantity FROM menu_item WHERE menu_item_id = NEW.menu_item_id) = 0, 'out_of_stock', 'low_stock'),
                CONCAT('Item is running low on stock'),
                (SELECT min_stock_level FROM menu_item WHERE menu_item_id = NEW.menu_item_id),
                (SELECT stock_quantity FROM menu_item WHERE menu_item_id = NEW.menu_item_id)
            );
        END IF;
    ELSE
        UPDATE menu_item 
        SET total_orders = total_orders + 1,
            total_quantity_sold = total_quantity_sold + NEW.quantity,
            last_ordered_date = CURDATE()
        WHERE menu_item_id = NEW.menu_item_id;
    END IF;
    
    -- Update daily stats
    INSERT INTO menu_item_daily_stats (menu_item_id, stats_date, daily_orders, daily_quantity_sold, daily_revenue)
    VALUES (NEW.menu_item_id, CURDATE(), 1, NEW.quantity, NEW.item_total)
    ON DUPLICATE KEY UPDATE 
        daily_orders = daily_orders + 1,
        daily_quantity_sold = daily_quantity_sold + NEW.quantity,
        daily_revenue = daily_revenue + NEW.item_total;
    
    -- Update popularity score
    UPDATE menu_item 
    SET popularity_score = LEAST(999.99, popularity_score + (NEW.quantity * 0.5) + (NEW.item_total * 0.01))
    WHERE menu_item_id = NEW.menu_item_id;
END;
//

-- Track order status changes
CREATE TRIGGER after_order_update
AFTER UPDATE ON customer_order
FOR EACH ROW
BEGIN
    IF OLD.order_status != NEW.order_status THEN
        INSERT INTO order_timeline (order_id, status, changed_by, notes)
        VALUES (NEW.order_id, NEW.order_status, NEW.cashier_id, CONCAT('Status changed from ', OLD.order_status, ' to ', NEW.order_status));
    END IF;
    
    -- Update customer stats when order completed
    IF NEW.order_status = 'completed' AND OLD.order_status != 'completed' AND NEW.customer_id IS NOT NULL THEN
        UPDATE customer 
        SET total_orders = total_orders + 1,
            total_spent = total_spent + NEW.final_amount,
            loyalty_points = loyalty_points + FLOOR(NEW.final_amount / 10)
        WHERE customer_id = NEW.customer_id;
    END IF;
    
    -- Update capacity when custom cake order confirmed
    IF NEW.order_status = 'confirmed' AND NEW.order_type = 'custom_order' AND NEW.scheduled_pickup_datetime IS NOT NULL THEN
        UPDATE custom_cake_daily_capacity
        SET current_simple_count = current_simple_count +
            (SELECT COUNT(*) FROM order_item oi
             JOIN custom_cake_design ccd ON oi.custom_cake_design_id = ccd.design_id
             WHERE oi.order_id = NEW.order_id AND ccd.design_complexity = 'simple'),
            current_moderate_count = current_moderate_count +
            (SELECT COUNT(*) FROM order_item oi
             JOIN custom_cake_design ccd ON oi.custom_cake_design_id = ccd.design_id
             WHERE oi.order_id = NEW.order_id AND ccd.design_complexity = 'moderate'),
            current_complex_count = current_complex_count +
            (SELECT COUNT(*) FROM order_item oi
             JOIN custom_cake_design ccd ON oi.custom_cake_design_id = ccd.design_id
             WHERE oi.order_id = NEW.order_id AND ccd.design_complexity = 'complex'),
            current_intricate_count = current_intricate_count +
            (SELECT COUNT(*) FROM order_item oi
             JOIN custom_cake_design ccd ON oi.custom_cake_design_id = ccd.design_id
             WHERE oi.order_id = NEW.order_id AND ccd.design_complexity = 'intricate')
        WHERE capacity_date = DATE(NEW.scheduled_pickup_datetime);
    END IF;
END;
//

-- Log inventory transactions
CREATE TRIGGER after_inventory_transaction_insert
AFTER INSERT ON inventory_transaction
FOR EACH ROW
BEGIN
    -- Check if adjustment brings stock below minimum
    IF NEW.transaction_type IN ('out', 'adjustment', 'waste') THEN
        IF NEW.new_quantity <= (SELECT min_stock_level FROM menu_item WHERE menu_item_id = NEW.menu_item_id) THEN
            INSERT INTO inventory_alert (
                menu_item_id, 
                alert_type, 
                alert_message,
                threshold_value,
                current_value
            ) VALUES (
                NEW.menu_item_id,
                IF(NEW.new_quantity = 0, 'out_of_stock', 'low_stock'),
                CONCAT('Stock adjustment resulted in low inventory'),
                (SELECT min_stock_level FROM menu_item WHERE menu_item_id = NEW.menu_item_id),
                NEW.new_quantity
            );
        END IF;
    END IF;
END;
//

DELIMITER ;

-- ============================================================================
-- STORED PROCEDURES
-- ============================================================================

DELIMITER //

-- Verify order with verification code
CREATE PROCEDURE VerifyOrder(
    IN p_verification_code VARCHAR(6),
    IN p_cashier_id INT
)
BEGIN
    DECLARE v_order_id INT;
    DECLARE v_order_status VARCHAR(20);
    
    SELECT order_id, order_status INTO v_order_id, v_order_status
    FROM customer_order 
    WHERE verification_code = p_verification_code 
    AND DATE(order_datetime) = CURDATE()
    AND is_deleted = FALSE
    LIMIT 1;
    
    IF v_order_id IS NOT NULL THEN
        IF v_order_status = 'pending' THEN
            UPDATE customer_order
            SET order_status = 'confirmed',
                cashier_id = p_cashier_id,
                updated_at = NOW()
            WHERE order_id = v_order_id;

            SELECT 'success' as result, v_order_id as order_id, 'Order confirmed' as message;
        ELSE
            SELECT 'info' as result, v_order_id as order_id,
                   CONCAT('Order already ', v_order_status) as message;
        END IF;
    ELSE
        SELECT 'error' as result, NULL as order_id, 'Invalid verification code' as message;
    END IF;
END;
//

-- Verify GCash payment
CREATE PROCEDURE VerifyGCashPayment(
    IN p_order_id INT,
    IN p_gcash_reference VARCHAR(100),
    IN p_cashier_id INT
)
BEGIN
    DECLARE v_exists INT;
    
    -- Check if reference already used
    SELECT COUNT(*) INTO v_exists
    FROM customer_order
    WHERE gcash_reference_number = p_gcash_reference
    AND order_id != p_order_id
    AND payment_status = 'paid';

    IF v_exists > 0 THEN
        SELECT 'error' as result, 'Reference number already used' as message;
    ELSE
        UPDATE customer_order
        SET payment_status = 'paid',
            gcash_reference_number = p_gcash_reference,
            payment_verified_by = p_cashier_id,
            payment_verified_at = NOW()
        WHERE order_id = p_order_id;

        INSERT INTO payment_transaction (
            order_id,
            payment_method,
            amount,
            reference_number,
            payment_status,
            verified_by,
            verified_at
        ) SELECT
            order_id,
            'gcash',
            final_amount,
            p_gcash_reference,
            'verified',
            p_cashier_id,
            NOW()
        FROM customer_order WHERE order_id = p_order_id;

        SELECT 'success' as result, 'Payment verified successfully' as message;
    END IF;
END;
//

-- Check custom cake capacity
CREATE PROCEDURE CheckCustomCakeCapacity(
    IN p_pickup_date DATE,
    IN p_complexity ENUM('simple', 'moderate', 'complex', 'intricate')
)
BEGIN
    DECLARE v_available_slots INT DEFAULT 0;
    DECLARE v_max_capacity INT;
    DECLARE v_current_count INT;
    
    -- Get or create capacity record for the date
    INSERT INTO custom_cake_daily_capacity (capacity_date)
    VALUES (p_pickup_date)
    ON DUPLICATE KEY UPDATE capacity_date = capacity_date;
    
    -- Get capacity info
    SELECT
        CASE p_complexity
            WHEN 'simple' THEN max_simple_cakes - current_simple_count
            WHEN 'moderate' THEN max_moderate_cakes - current_moderate_count
            WHEN 'complex' THEN max_complex_cakes - current_complex_count
            WHEN 'intricate' THEN max_intricate_cakes - current_intricate_count
        END as available_slots,
        is_available
    INTO v_available_slots, @is_day_available
    FROM custom_cake_daily_capacity
    WHERE capacity_date = p_pickup_date;

    IF @is_day_available = TRUE AND v_available_slots > 0 THEN
        SELECT 'available' as status, v_available_slots as slots_available,
               CONCAT(v_available_slots, ' slots available for ', p_complexity, ' cakes') as message;
    ELSEIF @is_day_available = FALSE THEN
        SELECT 'unavailable' as status, 0 as slots_available,
               'Shop not accepting custom orders on this date' as message;
    ELSE
        SELECT 'full' as status, 0 as slots_available,
               CONCAT('No slots available for ', p_complexity, ' cakes on this date') as message;
    END IF;
END;
//

-- Get active promotions for item
CREATE PROCEDURE GetActivePromotions(
    IN p_menu_item_id INT,
    IN p_order_total DECIMAL(10,2)
)
BEGIN
    SELECT 
        pr.promotion_id,
        pr.promotion_name,
        pr.description,
        pr.promotion_type,
        pr.discount_percentage,
        pr.discount_amount,
        pr.min_purchase_amount,
        pr.is_stackable,
        CASE
            WHEN pr.promotion_type = 'percentage' THEN
                ROUND(p_order_total * pr.discount_percentage / 100, 2)
            WHEN pr.promotion_type = 'fixed_amount' THEN
                pr.discount_amount
            ELSE 0.00
        END as calculated_discount
    FROM promotion_rules pr
    LEFT JOIN promotion_applicable_items pai ON pr.promotion_id = pai.promotion_id
    LEFT JOIN promotion_applicable_categories pac ON pr.promotion_id = pac.promotion_id
    LEFT JOIN category_has_menu_item chmi ON pac.category_id = chmi.category_id
    WHERE pr.is_active = TRUE
    AND pr.display_on_kiosk = TRUE
    AND CURDATE() BETWEEN pr.start_date AND pr.end_date
    AND CURTIME() BETWEEN pr.start_time AND pr.end_time
    AND (pr.total_usage_limit IS NULL OR pr.current_usage_count < pr.total_usage_limit)
    AND p_order_total >= pr.min_purchase_amount
    AND (pai.menu_item_id = p_menu_item_id OR chmi.menu_item_id = p_menu_item_id OR 
         (pai.menu_item_id IS NULL AND pac.category_id IS NULL))
    GROUP BY pr.promotion_id
    ORDER BY calculated_discount DESC;
END;
//

-- Recalculate popularity scores
CREATE PROCEDURE RecalculatePopularityScore(IN calculation_days INT)
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE item_id INT;
    DECLARE new_score DECIMAL(8,2);
    DECLARE old_score DECIMAL(8,2);
    
    DECLARE popularity_cursor CURSOR FOR 
        SELECT 
            mi.menu_item_id,
            mi.popularity_score,
            COALESCE(
                SUM(mids.daily_orders * 
                    POWER(0.95, DATEDIFF(CURDATE(), mids.stats_date))
                ) * 0.3 +
                SUM(mids.daily_quantity_sold * 
                    POWER(0.95, DATEDIFF(CURDATE(), mids.stats_date))
                ) * 0.2 +
                SUM(mids.daily_revenue * 
                    POWER(0.95, DATEDIFF(CURDATE(), mids.stats_date))
                ) * 0.005,
                0
            ) as calculated_score
        FROM menu_item mi
        LEFT JOIN menu_item_daily_stats mids ON mi.menu_item_id = mids.menu_item_id
            AND mids.stats_date >= DATE_SUB(CURDATE(), INTERVAL calculation_days DAY)
        WHERE mi.is_deleted = FALSE
        GROUP BY mi.menu_item_id, mi.popularity_score;
    
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
    
    OPEN popularity_cursor;
    
    read_loop: LOOP
        FETCH popularity_cursor INTO item_id, old_score, new_score;
        IF done THEN
            LEAVE read_loop;
        END IF;
        
        UPDATE menu_item 
        SET popularity_score = LEAST(999.99, new_score)
        WHERE menu_item_id = item_id;
        
        INSERT INTO popularity_history (
            menu_item_id,
            old_popularity_score,
            new_popularity_score,
            change_reason,
            change_details
        ) VALUES (
            item_id,
            old_score,
            new_score,
            'system_recalculation',
            CONCAT('Recalculated using ', calculation_days, ' days of data')
        );
        
    END LOOP;
    
    CLOSE popularity_cursor;
    
    SELECT CONCAT('Popularity scores recalculated for all items using ', calculation_days, ' days of data') AS result;
END;
//

-- Apply daily popularity decay (UNUSED - Should be called via cron job/scheduler)
-- RECOMMENDED: Set up a daily cron job to call this procedure
-- Example: 0 0 * * * mysql -u user -p database -e "CALL ApplyDailyPopularityDecay();"
CREATE PROCEDURE ApplyDailyPopularityDecay()
BEGIN
    DECLARE items_updated INT DEFAULT 0;

    UPDATE menu_item
    SET popularity_score = GREATEST(0, popularity_score * 0.995)
    WHERE last_ordered_date != CURDATE()
        AND popularity_score > 0
        AND is_deleted = FALSE;

    SET items_updated = ROW_COUNT();

    INSERT INTO popularity_history (
        menu_item_id,
        old_popularity_score,
        new_popularity_score,
        change_reason
    )
    SELECT
        menu_item_id,
        popularity_score / 0.995 as old_score,
        popularity_score as new_score,
        'daily_decay'
    FROM menu_item
    WHERE last_ordered_date != CURDATE()
        AND popularity_score > 0
        AND is_deleted = FALSE;

    SELECT CONCAT('Applied daily decay to ', items_updated, ' items') AS result;
END;
//

-- Get trending items
CREATE PROCEDURE GetTrendingItems(IN days_back INT, IN limit_count INT)
BEGIN
    IF days_back IS NULL THEN
        SET days_back = 7;
    END IF;
    
    IF limit_count IS NULL THEN
        SET limit_count = 10;
    END IF;
    
    SELECT 
        mi.menu_item_id,
        mi.name,
        mi.item_type,
        mi.popularity_score,
        mi.image_url,
        COALESCE(recent.total_orders, 0) as recent_orders,
        COALESCE(recent.total_quantity, 0) as recent_quantity,
        COALESCE(recent.total_revenue, 0) as recent_revenue,
        COALESCE(previous.total_orders, 0) as previous_orders,
        CASE
            WHEN previous.total_orders = 0 AND recent.total_orders > 0 THEN 'new_trending'
            WHEN previous.total_orders > 0 THEN
                CONCAT(ROUND(((recent.total_orders - previous.total_orders) / previous.total_orders * 100), 1), '%')
            ELSE '0%'
        END as growth_rate
    FROM menu_item mi
    LEFT JOIN (
        SELECT 
            menu_item_id,
            SUM(daily_orders) as total_orders,
            SUM(daily_quantity_sold) as total_quantity,
            SUM(daily_revenue) as total_revenue
        FROM menu_item_daily_stats 
        WHERE stats_date >= DATE_SUB(CURDATE(), INTERVAL days_back DAY)
            AND stats_date < CURDATE()
        GROUP BY menu_item_id
    ) recent ON mi.menu_item_id = recent.menu_item_id
    LEFT JOIN (
        SELECT 
            menu_item_id,
            SUM(daily_orders) as total_orders,
            SUM(daily_quantity_sold) as total_quantity,
            SUM(daily_revenue) as total_revenue
        FROM menu_item_daily_stats 
        WHERE stats_date >= DATE_SUB(CURDATE(), INTERVAL (days_back * 2) DAY)
            AND stats_date < DATE_SUB(CURDATE(), INTERVAL days_back DAY)
        GROUP BY menu_item_id
    ) previous ON mi.menu_item_id = previous.menu_item_id
    WHERE mi.is_deleted = FALSE
        AND (recent.total_orders > 0 OR previous.total_orders > 0)
    ORDER BY 
        CASE WHEN previous.total_orders = 0 AND recent.total_orders > 0 THEN 999999
             WHEN previous.total_orders > 0 THEN (recent.total_orders - previous.total_orders) / previous.total_orders
             ELSE 0 END DESC,
        mi.popularity_score DESC
    LIMIT limit_count;
END;
//

-- Get waste report
CREATE PROCEDURE GetWasteReport(IN start_date DATE, IN end_date DATE)
BEGIN
    SELECT 
        mi.menu_item_id,
        mi.name,
        mi.item_type,
        wt.waste_reason,
        SUM(wt.quantity_wasted) as total_quantity_wasted,
        SUM(wt.waste_cost) as total_waste_cost,
        COUNT(*) as waste_incidents,
        AVG(wt.quantity_wasted) as avg_quantity_per_incident
    FROM waste_tracking wt
    JOIN menu_item mi ON wt.menu_item_id = mi.menu_item_id
    WHERE wt.waste_date BETWEEN start_date AND end_date
    GROUP BY mi.menu_item_id, mi.name, mi.item_type, wt.waste_reason
    ORDER BY total_waste_cost DESC;
END;
//

DELIMITER ;

-- ============================================================================
-- FUNCTIONS
-- ============================================================================
-- NOTE: The following functions are available but currently UNUSED in the application.
-- They can be used for future features or reporting:
--   - CalculateLoyaltyPoints: Can be used for loyalty program calculations
--   - IsItemAvailable: Can be used in order validation
--   - GetPopularityRank: Can be used in analytics dashboards
--   - GetPopularityTrend: Can be used in analytics dashboards
-- Consider removing these if not needed within the next development cycle.
-- ============================================================================

DELIMITER //

-- Calculate loyalty points (UNUSED - Consider using in customer loyalty features)
CREATE FUNCTION CalculateLoyaltyPoints(amount DECIMAL(10,2))
RETURNS INT
READS SQL DATA
DETERMINISTIC
BEGIN
    RETURN FLOOR(amount / 10);
END;
//

-- Check item availability (UNUSED - Consider using in order validation)
CREATE FUNCTION IsItemAvailable(item_id INT, required_quantity INT)
RETURNS BOOLEAN
READS SQL DATA
DETERMINISTIC
BEGIN
    DECLARE current_stock INT DEFAULT 0;
    DECLARE item_status VARCHAR(20) DEFAULT '';
    DECLARE is_infinite BOOLEAN DEFAULT FALSE;

    SELECT stock_quantity, status, is_infinite_stock
    INTO current_stock, item_status, is_infinite
    FROM menu_item
    WHERE menu_item_id = item_id AND is_deleted = FALSE;

    IF is_infinite = TRUE AND item_status = 'available' THEN
        RETURN TRUE;
    ELSEIF is_infinite = FALSE AND item_status = 'available' AND current_stock >= required_quantity THEN
        RETURN TRUE;
    ELSE
        RETURN FALSE;
    END IF;
END;
//

-- Get popularity rank (UNUSED - Consider using in analytics/reporting)
CREATE FUNCTION GetPopularityRank(item_id INT)
RETURNS INT
READS SQL DATA
DETERMINISTIC
BEGIN
    DECLARE item_rank INT DEFAULT 0;
    DECLARE item_score DECIMAL(8,2) DEFAULT 0;

    SELECT popularity_score INTO item_score
    FROM menu_item
    WHERE menu_item_id = item_id;

    SELECT COUNT(*) + 1 INTO item_rank
    FROM menu_item
    WHERE popularity_score > item_score
        AND is_deleted = FALSE;

    RETURN item_rank;
END;
//

-- Get popularity trend (UNUSED - Consider using in analytics/reporting)
CREATE FUNCTION GetPopularityTrend(item_id INT, days_period INT)
RETURNS VARCHAR(20)
READS SQL DATA
DETERMINISTIC
BEGIN
    DECLARE recent_avg DECIMAL(8,2) DEFAULT 0;
    DECLARE previous_avg DECIMAL(8,2) DEFAULT 0;
    DECLARE trend_result VARCHAR(20) DEFAULT 'stable';
    DECLARE period_to_use INT DEFAULT 7;

    IF days_period IS NULL OR days_period <= 0 THEN
        SET period_to_use = 7;
    ELSE
        SET period_to_use = days_period;
    END IF;

    SELECT COALESCE(AVG(daily_orders), 0) INTO recent_avg
    FROM menu_item_daily_stats
    WHERE menu_item_id = item_id
        AND stats_date >= DATE_SUB(CURDATE(), INTERVAL period_to_use DAY)
        AND stats_date < CURDATE();

    SELECT COALESCE(AVG(daily_orders), 0) INTO previous_avg
    FROM menu_item_daily_stats
    WHERE menu_item_id = item_id
        AND stats_date >= DATE_SUB(CURDATE(), INTERVAL (period_to_use * 2) DAY)
        AND stats_date < DATE_SUB(CURDATE(), INTERVAL period_to_use DAY);

    IF previous_avg = 0 AND recent_avg > 0 THEN
        SET trend_result = 'new_trending';
    ELSEIF previous_avg > 0 THEN
        IF recent_avg >= previous_avg * 1.5 THEN
            SET trend_result = 'hot_trending';
        ELSEIF recent_avg >= previous_avg * 1.2 THEN
            SET trend_result = 'trending_up';
        ELSEIF recent_avg <= previous_avg * 0.5 THEN
            SET trend_result = 'declining';
        ELSEIF recent_avg <= previous_avg * 0.8 THEN
            SET trend_result = 'trending_down';
        ELSE
            SET trend_result = 'stable';
        END IF;
    END IF;

    RETURN trend_result;
END;
//

DELIMITER ;

-- ============================================================================
-- INITIAL DATA SETUP
-- ============================================================================

-- Insert default roles
INSERT INTO roles (role_name, description) VALUES
('super_admin', 'Full system access'),
('admin', 'Administrative access'),
('manager', 'Store management access'),
('viewer', 'Read-only access');

-- Insert default admin user (CHANGE PASSWORD AFTER FIRST LOGIN!)
INSERT INTO admin (username, password_hash, name, email, role_id, is_active) VALUES
('admin', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'System Administrator', 'admin@goldenmunch.com', 1, TRUE);
-- Default password is 'password' - CHANGE THIS IMMEDIATELY IN PRODUCTION!
-- To generate a new password hash in PHP: password_hash('your_password', PASSWORD_BCRYPT)

-- Insert default cashier (CHANGE PIN AFTER FIRST LOGIN!)
INSERT INTO cashier (name, cashier_code, pin_hash, phone, email, is_active) VALUES
('Default Cashier', 'CASH001', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', NULL, 'cashier@goldenmunch.com', TRUE);
-- Default PIN is '1234' - CHANGE THIS IMMEDIATELY IN PRODUCTION!
-- To generate a new PIN hash in PHP: password_hash('1234', PASSWORD_BCRYPT)

-- Insert default stock adjustment reasons
INSERT INTO stock_adjustment_reason (reason_code, reason_description) VALUES
('restock', 'Inventory restocking from supplier'),
('correction', 'Stock count correction'),
('damage', 'Damaged or defective items'),
('expired', 'Expired items removed'),
('return', 'Customer return'),
('promotion', 'Promotional giveaway'),
('theft', 'Theft or loss'),
('transfer', 'Transfer between locations'),
('waste', 'Waste or spoilage'),
('sample', 'Product sampling');

-- Insert default kiosk settings
INSERT INTO kiosk_settings (setting_key, setting_value, setting_type, description, updated_by) VALUES
('kiosk_timeout_seconds', '120', 'number', 'Seconds before kiosk session times out', 1),
('enable_loyalty_program', 'true', 'boolean', 'Enable loyalty points system', 1),
('loyalty_points_per_peso', '0.1', 'number', 'Loyalty points earned per peso spent', 1),
('min_preorder_hours', '24', 'number', 'Minimum hours before pickup for pre-orders', 1),
('min_custom_cake_days', '3', 'number', 'Minimum days before pickup for custom cakes', 1),
('gcash_payment_enabled', 'true', 'boolean', 'Enable GCash payment option', 1),
('paymaya_payment_enabled', 'true', 'boolean', 'Enable PayMaya payment option', 1),
('cash_payment_enabled', 'true', 'boolean', 'Enable cash payment option', 1),
('show_allergen_info', 'true', 'boolean', 'Display allergen information on kiosk', 1),
('enable_customer_feedback', 'true', 'boolean', 'Enable feedback collection', 1),
('default_tax_rate', '12.00', 'number', 'Default tax rate percentage', 1),
('order_number_prefix', 'GM', 'string', 'Prefix for order numbers', 1);

-- Insert default tax rule
INSERT INTO tax_rules (tax_name, tax_type, tax_rate, is_inclusive, is_active, effective_date, created_by) VALUES
('VAT', 'percentage', 12.00, FALSE, TRUE, '2024-01-01', 1);

SELECT '============================================================================' as '';
SELECT 'GOLDEN MUNCH POS ENHANCED SCHEMA CREATED SUCCESSFULLY!' as status;
SELECT '============================================================================' as '';
SELECT 'Database: GoldenMunchPOS' as '';
SELECT 'Total Tables: 40+' as '';
SELECT 'Features:' as '';
SELECT '✓ Kiosk Order System with Verification Codes' as '';
SELECT '✓ GCash/PayMaya Payment Verification' as '';
SELECT '✓ Custom Cake Management with Capacity Control' as '';
SELECT '✓ Promotion & Discount Rules Engine' as '';
SELECT '✓ Tax Configuration System' as '';
SELECT '✓ Refund Tracking' as '';
SELECT '✓ Customer Feedback System' as '';
SELECT '✓ Waste Tracking' as '';
SELECT '✓ Popularity & Analytics System' as '';
SELECT '✓ Comprehensive Inventory Management' as '';
SELECT '============================================================================' as '';
SELECT '' as '';
SELECT '⚠️  DEFAULT CREDENTIALS - CHANGE IMMEDIATELY IN PRODUCTION!' as '';
SELECT '============================================================================' as '';
SELECT 'Admin Login:' as '';
SELECT '  Username: admin' as '';
SELECT '  Password: password' as '';
SELECT '' as '';
SELECT 'Cashier Login:' as '';
SELECT '  Cashier Code: CASH001' as '';
SELECT '  PIN: 1234' as '';
SELECT '' as '';
SELECT '⚠️  These are default credentials for initial setup only.' as '';
SELECT '⚠️  CHANGE THESE IMMEDIATELY after first login!' as '';
SELECT '============================================================================' as '';