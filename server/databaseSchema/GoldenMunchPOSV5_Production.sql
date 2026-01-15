-- ============================================================================
-- GOLDEN MUNCH POS - PRODUCTION SCHEMA
-- Version: 5.0 (Production-Ready)
-- Description: Complete POS system with custom cake ordering and QR integration
-- Features: Kiosk ordering, mobile 3D cake editor, admin approval workflow
-- Architecture: Normalized database with proper foreign keys and indexes
-- Date: December 17, 2025
--
-- V5 Changes (Production Version):
-- - Removed all sample/test data (customers, orders, menu items)
-- - Kept essential seed data (roles, default credentials, categories, flavors, sizes, themes)
-- - Kept all table definitions, stored procedures, triggers, and views
-- - Kept system settings and migration scripts
-- - Ready for production deployment
-- - Fully functional with minimal initial data
--
-- Based on V4 with the following improvements:
-- - Added analytics stored procedures (GetTrendingItems, GetWasteReport, RecalculatePopularityScore)
-- - Fixed field name compatibility (order_datetime/created_at, final_amount/total_amount)
-- - Added discount support for payment verification
-- - Fixed CashierAdmin dashboard data display issues
-- ============================================================================

DROP DATABASE IF EXISTS defaultdb;
CREATE DATABASE defaultdb CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE defaultdb;

-- ============================================================================
-- SECTION 1: USER MANAGEMENT & AUTHENTICATION
-- ============================================================================

-- Roles for admin users
CREATE TABLE roles (
    role_id INT AUTO_INCREMENT PRIMARY KEY,
    role_name VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_role_name (role_name)
) ENGINE=InnoDB;

-- Admin users (managers, supervisors)
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
    FOREIGN KEY (role_id) REFERENCES roles(role_id) ON DELETE RESTRICT,
    INDEX idx_admin_username (username),
    INDEX idx_admin_email (email),
    INDEX idx_admin_active (is_active)
) ENGINE=InnoDB;

-- Cashier users (counter staff)
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
) ENGINE=InnoDB;

-- ============================================================================
-- SECTION 2: PRODUCT CATALOG & INVENTORY
-- ============================================================================

-- Suppliers for inventory
CREATE TABLE suppliers (
    supplier_id INT AUTO_INCREMENT PRIMARY KEY,
    supplier_name VARCHAR(100) NOT NULL,
    contact_person VARCHAR(100),
    phone VARCHAR(20),
    email VARCHAR(100),
    address TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_supplier_active (is_active)
) ENGINE=InnoDB;

-- Product categories
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
    FOREIGN KEY (admin_id) REFERENCES admin(admin_id) ON DELETE RESTRICT,
    INDEX idx_category_active (is_active),
    INDEX idx_category_order (display_order)
) ENGINE=InnoDB;

-- Menu items (products)
CREATE TABLE menu_item (
    menu_item_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    image_url VARCHAR(255) COMMENT 'Product image for kiosk display',
    item_type ENUM('cake', 'pastry', 'beverage', 'snack', 'main_dish', 'appetizer', 'dessert', 'bread', 'other') NOT NULL DEFAULT 'other',
    unit_of_measure ENUM('piece', 'dozen', 'half_dozen', 'kilogram', 'gram', 'liter', 'milliliter', 'serving', 'box', 'pack') DEFAULT 'piece',
    stock_quantity INT NOT NULL DEFAULT 0,
    is_infinite_stock BOOLEAN DEFAULT FALSE COMMENT 'True for items that never run out',
    min_stock_level INT DEFAULT 5,
    status ENUM('available', 'sold_out', 'discontinued') NOT NULL DEFAULT 'available',
    can_customize BOOLEAN DEFAULT FALSE,
    can_preorder BOOLEAN DEFAULT FALSE,
    preparation_time_minutes INT DEFAULT 0,
    popularity_score DECIMAL(5,2) DEFAULT 0 COMMENT 'Auto-calculated based on sales',
    supplier_id INT NULL,
    is_featured BOOLEAN DEFAULT FALSE COMMENT 'Show on kiosk featured section',
    allergen_info TEXT,
    nutritional_info JSON,
    barcode VARCHAR(50) UNIQUE,
    sku VARCHAR(50) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(supplier_id) ON DELETE SET NULL,
    INDEX idx_menu_item_type (item_type),
    INDEX idx_menu_item_status (status),
    INDEX idx_menu_item_featured (is_featured),
    INDEX idx_menu_item_popularity (popularity_score),
    FULLTEXT INDEX idx_menu_item_search (name, description)
) ENGINE=InnoDB;

-- Pricing for menu items (supports multiple price points)
CREATE TABLE menu_item_price (
    price_id INT AUTO_INCREMENT PRIMARY KEY,
    menu_item_id INT NOT NULL,
    price_type ENUM('base', 'promo', 'bulk', 'wholesale', 'seasonal') DEFAULT 'base',
    unit_price DECIMAL(10,2) NOT NULL,
    cost_price DECIMAL(10,2) COMMENT 'For margin calculations',
    min_quantity INT DEFAULT 1 COMMENT 'For bulk pricing',
    max_quantity INT NULL,
    valid_from DATE NULL,
    valid_until DATE NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (menu_item_id) REFERENCES menu_item(menu_item_id) ON DELETE CASCADE,
    INDEX idx_price_active (is_active),
    INDEX idx_price_type (price_type),
    INDEX idx_price_validity (valid_from, valid_until)
) ENGINE=InnoDB;

-- Many-to-many: Categories and Menu Items
CREATE TABLE category_has_menu_item (
    category_id INT NOT NULL,
    menu_item_id INT NOT NULL,
    display_order INT DEFAULT 0,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (category_id, menu_item_id),
    FOREIGN KEY (category_id) REFERENCES category(category_id) ON DELETE CASCADE,
    FOREIGN KEY (menu_item_id) REFERENCES menu_item(menu_item_id) ON DELETE CASCADE,
    INDEX idx_category_display_order (category_id, display_order)
) ENGINE=InnoDB;

-- ============================================================================
-- SECTION 3: PROMOTIONS & DISCOUNTS
-- ============================================================================

-- Promotion rules
CREATE TABLE promotion_rules (
    promotion_id INT AUTO_INCREMENT PRIMARY KEY,
    promotion_code VARCHAR(50) UNIQUE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    discount_type ENUM('percentage', 'fixed_amount', 'buy_x_get_y', 'bundle') NOT NULL,
    discount_value DECIMAL(10,2) NOT NULL COMMENT 'Percentage (0-100) or fixed amount',
    min_purchase_amount DECIMAL(10,2) DEFAULT 0,
    max_discount_amount DECIMAL(10,2) NULL COMMENT 'Cap for percentage discounts',
    applicable_to ENUM('all', 'specific_items', 'specific_categories', 'customer_tier') DEFAULT 'all',
    buy_quantity INT NULL COMMENT 'For buy_x_get_y promos',
    get_quantity INT NULL,
    bundle_items JSON NULL COMMENT 'Array of {menu_item_id, quantity} for bundles',
    start_date DATETIME NOT NULL,
    end_date DATETIME NOT NULL,
    usage_limit INT NULL COMMENT 'Total times this promo can be used',
    usage_per_customer INT DEFAULT 1,
    is_active BOOLEAN DEFAULT TRUE,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES admin(admin_id) ON DELETE RESTRICT,
    INDEX idx_promo_code (promotion_code),
    INDEX idx_promo_active (is_active),
    INDEX idx_promo_dates (start_date, end_date)
) ENGINE=InnoDB;

-- Promotion applicable items (for specific_items promotions)
CREATE TABLE promotion_applicable_items (
    promotion_id INT NOT NULL,
    menu_item_id INT NOT NULL,
    PRIMARY KEY (promotion_id, menu_item_id),
    FOREIGN KEY (promotion_id) REFERENCES promotion_rules(promotion_id) ON DELETE CASCADE,
    FOREIGN KEY (menu_item_id) REFERENCES menu_item(menu_item_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Promotion applicable categories (for specific_categories promotions)
CREATE TABLE promotion_applicable_categories (
    promotion_id INT NOT NULL,
    category_id INT NOT NULL,
    PRIMARY KEY (promotion_id, category_id),
    FOREIGN KEY (promotion_id) REFERENCES promotion_rules(promotion_id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES category(category_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Customer discount types (for student, senior, etc. discounts)
CREATE TABLE customer_discount_type (
    discount_type_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL COMMENT 'e.g., Student, Senior, PWD, Military',
    description TEXT,
    discount_percentage DECIMAL(5,2) NOT NULL COMMENT 'Percentage discount (0.00-100.00)',
    requires_id BOOLEAN DEFAULT TRUE COMMENT 'Whether ID verification is required',
    is_active BOOLEAN DEFAULT TRUE,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES admin(admin_id) ON DELETE RESTRICT,
    INDEX idx_discount_active (is_active)
) ENGINE=InnoDB;

-- ============================================================================
-- SECTION 4: TAX RULES
-- ============================================================================

-- Tax rules (VAT, service charge, etc.)
CREATE TABLE tax_rules (
    tax_id INT AUTO_INCREMENT PRIMARY KEY,
    tax_name VARCHAR(50) NOT NULL,
    tax_type ENUM('vat', 'service_charge', 'sales_tax', 'other') NOT NULL,
    tax_rate DECIMAL(5,2) NOT NULL COMMENT 'Percentage (e.g., 12.00 for 12% VAT)',
    is_inclusive BOOLEAN DEFAULT FALSE COMMENT 'True if already included in price',
    applicable_to ENUM('all', 'dine_in', 'takeout', 'delivery', 'specific_items') DEFAULT 'all',
    is_active BOOLEAN DEFAULT TRUE,
    start_date DATE NULL,
    end_date DATE NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_tax_active (is_active),
    INDEX idx_tax_type (tax_type)
) ENGINE=InnoDB;

-- ============================================================================
-- SECTION 5: CUSTOM CAKE CONFIGURATION
-- ============================================================================

-- Cake flavors (chocolate, vanilla, etc.)
CREATE TABLE cake_flavors (
    flavor_id INT AUTO_INCREMENT PRIMARY KEY,
    flavor_name VARCHAR(50) NOT NULL,
    description VARCHAR(255),
    flavor_category ENUM('classic', 'premium', 'specialty', 'seasonal') DEFAULT 'classic',
    base_price_per_tier DECIMAL(8,2) NOT NULL COMMENT 'Additional cost per layer',
    is_available BOOLEAN DEFAULT TRUE,
    allergen_info TEXT,
    image_url VARCHAR(255),
    popularity_score DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_flavor_available (is_available),
    INDEX idx_flavor_category (flavor_category)
) ENGINE=InnoDB;

-- Cake sizes (6", 8", 10", etc.)
CREATE TABLE cake_sizes (
    size_id INT AUTO_INCREMENT PRIMARY KEY,
    size_name VARCHAR(50) NOT NULL COMMENT 'e.g., "6 inches", "8 inches"',
    diameter_cm DECIMAL(5,2) NOT NULL,
    servings INT NOT NULL COMMENT 'Approximate number of servings',
    base_price_multiplier DECIMAL(4,2) DEFAULT 1.00 COMMENT 'Price multiplier (1.0 = standard)',
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_size_available (is_available)
) ENGINE=InnoDB;

-- Custom cake themes (birthday, wedding, etc.)
CREATE TABLE custom_cake_theme (
    theme_id INT AUTO_INCREMENT PRIMARY KEY,
    theme_name VARCHAR(50) NOT NULL,
    description VARCHAR(255),
    theme_category ENUM('birthday', 'wedding', 'anniversary', 'corporate', 'holiday', 'other') DEFAULT 'other',
    base_additional_cost DECIMAL(8,2) DEFAULT 0 COMMENT 'Extra cost for this theme',
    available_decorations JSON COMMENT 'Array of available decoration types',
    color_palette JSON COMMENT 'Recommended colors for this theme',
    sample_image_url VARCHAR(255),
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_theme_available (is_available),
    INDEX idx_theme_category (theme_category)
) ENGINE=InnoDB;

-- Custom cake designs (pre-made templates)
CREATE TABLE custom_cake_design (
    design_id INT AUTO_INCREMENT PRIMARY KEY,
    design_name VARCHAR(100) NOT NULL,
    theme_id INT NULL,
    description TEXT,
    design_data JSON NOT NULL COMMENT 'Complete cake design configuration',
    base_price DECIMAL(10,2) NOT NULL,
    preview_image_url VARCHAR(255),
    is_featured BOOLEAN DEFAULT FALSE,
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (theme_id) REFERENCES custom_cake_theme(theme_id) ON DELETE SET NULL,
    INDEX idx_design_available (is_available),
    INDEX idx_design_featured (is_featured)
) ENGINE=InnoDB;

-- Daily capacity for custom cakes (production limits)
CREATE TABLE custom_cake_daily_capacity (
    capacity_id INT AUTO_INCREMENT PRIMARY KEY,
    capacity_date DATE NOT NULL UNIQUE,
    max_orders INT DEFAULT 10 COMMENT 'Maximum custom cakes per day',
    current_orders INT DEFAULT 0 COMMENT 'How many booked so far',
    is_fully_booked BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_capacity_date (capacity_date),
    INDEX idx_capacity_available (is_fully_booked, capacity_date)
) ENGINE=InnoDB;

-- ============================================================================
-- SECTION 6: CUSTOM CAKE REQUESTS (QR-BASED ORDERING)
-- ============================================================================

-- QR code sessions (30-minute temporary sessions)
CREATE TABLE qr_code_sessions (
    session_id INT AUTO_INCREMENT PRIMARY KEY,
    session_token VARCHAR(100) NOT NULL UNIQUE COMMENT 'Secure random token for QR',
    qr_code_data TEXT NOT NULL COMMENT 'Base64 QR code image',
    editor_url VARCHAR(500) NOT NULL COMMENT 'Mobile editor URL with session token',
    kiosk_id VARCHAR(50) NULL COMMENT 'Which kiosk generated this',
    ip_address VARCHAR(50) NULL,
    user_agent TEXT NULL,
    status ENUM('active', 'used', 'expired') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL COMMENT '30 minutes from creation',
    used_at TIMESTAMP NULL,
    INDEX idx_session_token (session_token),
    INDEX idx_session_status (status),
    INDEX idx_session_expiry (expires_at)
) ENGINE=InnoDB;

-- Custom cake requests (main table for custom orders)
CREATE TABLE custom_cake_request (
    request_id INT AUTO_INCREMENT PRIMARY KEY,

    -- Session & QR Code
    session_token VARCHAR(100) NOT NULL UNIQUE COMMENT 'Links to QR session',
    qr_code_url VARCHAR(500) NULL,

    -- Customer Information
    customer_name VARCHAR(100),
    customer_phone VARCHAR(20),
    customer_email VARCHAR(100),

    -- Cake Structure (up to 5 layers)
    num_layers INT DEFAULT 1 CHECK (num_layers BETWEEN 1 AND 5),
    layer_1_flavor_id INT NULL,
    layer_2_flavor_id INT NULL,
    layer_3_flavor_id INT NULL,
    layer_4_flavor_id INT NULL,
    layer_5_flavor_id INT NULL,
    layer_1_size_id INT NULL,
    layer_2_size_id INT NULL,
    layer_3_size_id INT NULL,
    layer_4_size_id INT NULL,
    layer_5_size_id INT NULL,
    total_height_cm DECIMAL(5,2) NULL COMMENT 'Total cake height',
    base_diameter_cm DECIMAL(5,2) NULL COMMENT 'Base layer diameter',

    -- Theme & Frosting
    theme_id INT NULL,
    frosting_color VARCHAR(50) NULL,
    frosting_type ENUM('buttercream', 'fondant', 'whipped_cream', 'ganache', 'cream_cheese') DEFAULT 'buttercream',

    -- Candles
    candles_count INT DEFAULT 0,
    candle_type ENUM('number', 'regular', 'sparkler', 'none') DEFAULT 'regular',
    candle_numbers VARCHAR(20) NULL COMMENT 'e.g., "2,5" for age',

    -- Text on Cake
    cake_text VARCHAR(200) NULL,
    text_color VARCHAR(50) NULL,
    text_font ENUM('script', 'bold', 'elegant', 'playful', 'modern') DEFAULT 'script',
    text_position ENUM('top', 'center', 'bottom') DEFAULT 'top',

    -- 3D Decorations (JSON array)
    decorations_3d JSON NULL COMMENT 'Array of {type, position, rotation, scale, color}',

    -- Instructions & Notes
    special_instructions TEXT NULL,
    baker_notes TEXT NULL,
    dietary_restrictions TEXT NULL COMMENT 'Allergies, vegan, gluten-free, etc.',

    -- Event Details
    event_type VARCHAR(50) NULL COMMENT 'birthday, wedding, anniversary',
    event_date DATE NULL,

    -- Approval Workflow
    status ENUM('draft', 'pending_review', 'approved', 'rejected', 'cancelled', 'completed') DEFAULT 'draft',
    submitted_at TIMESTAMP NULL,
    reviewed_at TIMESTAMP NULL,
    reviewed_by INT NULL COMMENT 'admin_id who reviewed',
    rejection_reason TEXT NULL,
    admin_notes TEXT NULL,

    -- Pricing
    estimated_price DECIMAL(10,2) NULL COMMENT 'Auto-calculated estimate',
    approved_price DECIMAL(10,2) NULL COMMENT 'Final price from admin',
    price_breakdown JSON NULL COMMENT '{base, layers, decorations, theme, etc}',

    -- Scheduling
    preparation_days INT NULL COMMENT 'Days needed for preparation',
    scheduled_pickup_date DATE NULL,
    scheduled_pickup_time TIME NULL,

    -- Linked Order
    order_id INT NULL COMMENT 'Links to customer_order after payment',

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NULL COMMENT 'Session expiry',

    -- Foreign Keys
    FOREIGN KEY (theme_id) REFERENCES custom_cake_theme(theme_id) ON DELETE SET NULL,
    FOREIGN KEY (layer_1_flavor_id) REFERENCES cake_flavors(flavor_id) ON DELETE SET NULL,
    FOREIGN KEY (layer_2_flavor_id) REFERENCES cake_flavors(flavor_id) ON DELETE SET NULL,
    FOREIGN KEY (layer_3_flavor_id) REFERENCES cake_flavors(flavor_id) ON DELETE SET NULL,
    FOREIGN KEY (layer_4_flavor_id) REFERENCES cake_flavors(flavor_id) ON DELETE SET NULL,
    FOREIGN KEY (layer_5_flavor_id) REFERENCES cake_flavors(flavor_id) ON DELETE SET NULL,
    FOREIGN KEY (layer_1_size_id) REFERENCES cake_sizes(size_id) ON DELETE SET NULL,
    FOREIGN KEY (layer_2_size_id) REFERENCES cake_sizes(size_id) ON DELETE SET NULL,
    FOREIGN KEY (layer_3_size_id) REFERENCES cake_sizes(size_id) ON DELETE SET NULL,
    FOREIGN KEY (layer_4_size_id) REFERENCES cake_sizes(size_id) ON DELETE SET NULL,
    FOREIGN KEY (layer_5_size_id) REFERENCES cake_sizes(size_id) ON DELETE SET NULL,
    FOREIGN KEY (reviewed_by) REFERENCES admin(admin_id) ON DELETE SET NULL,

    -- Indexes
    INDEX idx_ccr_session (session_token),
    INDEX idx_ccr_status (status),
    INDEX idx_ccr_customer_email (customer_email),
    INDEX idx_ccr_pickup_date (scheduled_pickup_date),
    INDEX idx_ccr_created (created_at),
    FULLTEXT INDEX idx_ccr_search (customer_name, customer_email, customer_phone)
) ENGINE=InnoDB;

-- Custom cake request images (3D screenshots)
CREATE TABLE custom_cake_request_images (
    image_id INT AUTO_INCREMENT PRIMARY KEY,
    request_id INT NOT NULL,
    image_url VARCHAR(500) NOT NULL COMMENT 'URL or base64 data',
    image_type ENUM('3d_render', 'reference', 'final_photo') DEFAULT '3d_render',
    view_angle ENUM('front', 'side', 'top', '3d_perspective') DEFAULT 'front',
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (request_id) REFERENCES custom_cake_request(request_id) ON DELETE CASCADE,
    INDEX idx_ccri_request (request_id),
    INDEX idx_ccri_type (image_type)
) ENGINE=InnoDB;

-- Custom cake notifications (email log)
CREATE TABLE custom_cake_notifications (
    notification_id INT AUTO_INCREMENT PRIMARY KEY,
    parent_notification_id INT NULL COMMENT 'For threading messages/replies',
    request_id INT NOT NULL,
    notification_type ENUM('submission_received', 'approved', 'rejected', 'ready_for_pickup', 'reminder') NOT NULL,
    sender_type ENUM('customer', 'admin', 'system') DEFAULT 'system' COMMENT 'Who sent this message',
    sender_name VARCHAR(255) NULL COMMENT 'Name of the sender',
    recipient_email VARCHAR(100) NOT NULL,
    subject VARCHAR(200),
    message_body TEXT,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP NULL COMMENT 'When the message was read',
    status ENUM('pending', 'sent', 'failed') DEFAULT 'pending',
    is_read BOOLEAN DEFAULT FALSE COMMENT 'Whether message has been read',
    error_message TEXT NULL,

    FOREIGN KEY (request_id) REFERENCES custom_cake_request(request_id) ON DELETE CASCADE,
    CONSTRAINT fk_parent_notification FOREIGN KEY (parent_notification_id) REFERENCES custom_cake_notifications(notification_id) ON DELETE CASCADE,

    INDEX idx_ccn_request (request_id),
    INDEX idx_ccn_status (status),
    INDEX idx_request_sender (request_id, sender_type),
    INDEX idx_request_unread (request_id, is_read),
    INDEX idx_parent_notification (parent_notification_id)
) ENGINE=InnoDB COMMENT='Notifications and messages for custom cake requests';

-- ============================================================================
-- SECTION 7: CUSTOMERS & ORDERS
-- ============================================================================

-- Customer information
CREATE TABLE customer (
    customer_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(100),
    address TEXT,
    loyalty_points INT DEFAULT 0,
    total_spent DECIMAL(12,2) DEFAULT 0,
    customer_tier ENUM('regular', 'silver', 'gold', 'platinum') DEFAULT 'regular',
    last_order_date DATE,
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_customer_phone (phone),
    INDEX idx_customer_email (email),
    INDEX idx_customer_tier (customer_tier),
    FULLTEXT INDEX idx_customer_search (name, phone, email)
) ENGINE=InnoDB;

-- Customer orders (main order table)
CREATE TABLE customer_order (
    order_id INT AUTO_INCREMENT PRIMARY KEY,
    order_number VARCHAR(20) NOT NULL UNIQUE COMMENT 'User-friendly order number',
    order_type ENUM('dine_in', 'takeout', 'delivery', 'kiosk', 'custom_cake') NOT NULL DEFAULT 'kiosk',
    customer_id INT NULL,
    cashier_id INT NULL,
    kiosk_id VARCHAR(50) NULL COMMENT 'Which kiosk placed this order',

    -- Order Details
    order_status ENUM('pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled') DEFAULT 'pending',
    priority ENUM('normal', 'high', 'urgent') DEFAULT 'normal',
    special_instructions TEXT,

    -- Pricing
    subtotal DECIMAL(10,2) NOT NULL,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    service_charge DECIMAL(10,2) DEFAULT 0,
    delivery_fee DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,

    -- Applied Promotions
    promotion_id INT NULL,
    promotion_discount DECIMAL(10,2) DEFAULT 0,

    -- Applied Customer Discount (Student, Senior, etc.)
    customer_discount_type_id INT NULL,
    customer_discount_percentage DECIMAL(5,2) DEFAULT 0,

    -- Payment Status
    payment_status ENUM('unpaid', 'partial', 'paid', 'refunded') DEFAULT 'unpaid',
    payment_method ENUM('cash', 'cashless') NULL COMMENT 'Simplified payment methods: cash or cashless (Xendit)',
    payment_reference_number VARCHAR(255) NULL COMMENT 'Unified payment reference for cashless payments (Xendit QR code ID)',
    amount_paid DECIMAL(10,2) DEFAULT 0,
    change_amount DECIMAL(10,2) DEFAULT 0,

    -- Delivery Info (if applicable)
    delivery_address TEXT NULL,
    delivery_phone VARCHAR(20) NULL,
    estimated_delivery_time DATETIME NULL,
    actual_delivery_time DATETIME NULL,

    -- Pickup Info
    scheduled_pickup_time DATETIME NULL,
    actual_pickup_time DATETIME NULL,

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,

    -- Foreign Keys
    FOREIGN KEY (customer_id) REFERENCES customer(customer_id) ON DELETE SET NULL,
    FOREIGN KEY (cashier_id) REFERENCES cashier(cashier_id) ON DELETE SET NULL,
    FOREIGN KEY (promotion_id) REFERENCES promotion_rules(promotion_id) ON DELETE SET NULL,
    FOREIGN KEY (customer_discount_type_id) REFERENCES customer_discount_type(discount_type_id) ON DELETE SET NULL,

    -- Indexes
    INDEX idx_order_number (order_number),
    INDEX idx_order_type (order_type),
    INDEX idx_order_status (order_status),
    INDEX idx_order_customer (customer_id),
    INDEX idx_order_date (created_at),
    INDEX idx_order_payment (payment_status)
) ENGINE=InnoDB;

-- Promotion usage log
CREATE TABLE promotion_usage_log (
    usage_id INT AUTO_INCREMENT PRIMARY KEY,
    promotion_id INT NOT NULL,
    order_id INT NOT NULL,
    customer_id INT NULL,
    discount_amount DECIMAL(10,2) NOT NULL,
    used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (promotion_id) REFERENCES promotion_rules(promotion_id) ON DELETE CASCADE,
    FOREIGN KEY (order_id) REFERENCES customer_order(order_id) ON DELETE CASCADE,
    FOREIGN KEY (customer_id) REFERENCES customer(customer_id) ON DELETE SET NULL,
    INDEX idx_promo_usage_promo (promotion_id),
    INDEX idx_promo_usage_customer (customer_id)
) ENGINE=InnoDB;

-- Order items (line items in an order)
CREATE TABLE order_item (
    order_item_id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    menu_item_id INT NULL,
    custom_cake_request_id INT NULL COMMENT 'For custom cake orders',

    -- Item Details
    item_name VARCHAR(100) NOT NULL COMMENT 'Snapshot of name at order time',
    item_description TEXT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL COMMENT 'Price per unit at order time',
    subtotal DECIMAL(10,2) NOT NULL COMMENT 'quantity * unit_price',

    -- Customizations
    customization_notes TEXT NULL,
    special_requests TEXT NULL,

    -- Status
    item_status ENUM('pending', 'preparing', 'ready', 'served', 'cancelled') DEFAULT 'pending',

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Foreign Keys
    FOREIGN KEY (order_id) REFERENCES customer_order(order_id) ON DELETE CASCADE,
    FOREIGN KEY (menu_item_id) REFERENCES menu_item(menu_item_id) ON DELETE SET NULL,
    FOREIGN KEY (custom_cake_request_id) REFERENCES custom_cake_request(request_id) ON DELETE SET NULL,

    -- Indexes
    INDEX idx_order_item_order (order_id),
    INDEX idx_order_item_menu (menu_item_id),
    INDEX idx_order_item_status (item_status)
) ENGINE=InnoDB;

-- Link custom_cake_request.order_id to customer_order
ALTER TABLE custom_cake_request
    ADD FOREIGN KEY (order_id) REFERENCES customer_order(order_id) ON DELETE SET NULL;

-- Order timeline (status change history)
CREATE TABLE order_timeline (
    timeline_id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    status ENUM('pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled') NOT NULL,
    changed_by INT NULL COMMENT 'cashier_id or admin_id',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES customer_order(order_id) ON DELETE CASCADE,
    INDEX idx_timeline_order (order_id),
    INDEX idx_timeline_date (created_at)
) ENGINE=InnoDB;

-- ============================================================================
-- SECTION 8: PAYMENTS & REFUNDS
-- ============================================================================

-- Payment transactions
CREATE TABLE payment_transaction (
    transaction_id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    transaction_type ENUM('payment', 'refund', 'adjustment') DEFAULT 'payment',
    payment_method ENUM('cash', 'cashless') NOT NULL COMMENT 'Simplified payment methods: cash or cashless (Xendit)',
    amount DECIMAL(10,2) NOT NULL,
    reference_number VARCHAR(100) NULL COMMENT 'Xendit QR code ID, transaction reference, etc.',
    card_last_four VARCHAR(4) NULL,

    -- Status
    status ENUM('pending', 'completed', 'failed', 'cancelled') DEFAULT 'pending',
    failure_reason TEXT NULL,

    -- Processed by
    processed_by INT NULL COMMENT 'cashier_id',

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,

    -- Foreign Keys
    FOREIGN KEY (order_id) REFERENCES customer_order(order_id) ON DELETE CASCADE,
    FOREIGN KEY (processed_by) REFERENCES cashier(cashier_id) ON DELETE SET NULL,

    -- Indexes
    INDEX idx_transaction_order (order_id),
    INDEX idx_transaction_method (payment_method),
    INDEX idx_transaction_status (status),
    INDEX idx_transaction_date (created_at)
) ENGINE=InnoDB;

-- Refund requests
CREATE TABLE refund_request (
    refund_id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    requested_by INT NULL COMMENT 'customer_id',
    approved_by INT NULL COMMENT 'admin_id',

    -- Refund Details
    refund_amount DECIMAL(10,2) NOT NULL,
    refund_reason TEXT NOT NULL,
    admin_notes TEXT NULL,

    -- Status
    status ENUM('pending', 'approved', 'rejected', 'processed') DEFAULT 'pending',
    rejection_reason TEXT NULL,

    -- Timestamps
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP NULL,
    processed_at TIMESTAMP NULL,

    -- Foreign Keys
    FOREIGN KEY (order_id) REFERENCES customer_order(order_id) ON DELETE CASCADE,
    FOREIGN KEY (requested_by) REFERENCES customer(customer_id) ON DELETE SET NULL,
    FOREIGN KEY (approved_by) REFERENCES admin(admin_id) ON DELETE SET NULL,

    -- Indexes
    INDEX idx_refund_order (order_id),
    INDEX idx_refund_status (status),
    INDEX idx_refund_date (requested_at)
) ENGINE=InnoDB;

-- ============================================================================
-- SECTION 9: CUSTOMER FEEDBACK
-- ============================================================================

-- Customer feedback and ratings
CREATE TABLE customer_feedback (
    feedback_id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NULL,
    customer_id INT NULL,

    -- Ratings (1-5 stars)
    overall_rating DECIMAL(2,1) CHECK (overall_rating BETWEEN 1.0 AND 5.0),
    food_quality_rating DECIMAL(2,1) NULL,
    service_rating DECIMAL(2,1) NULL,
    cleanliness_rating DECIMAL(2,1) NULL,
    value_rating DECIMAL(2,1) NULL,

    -- Comments
    comments TEXT,
    improvement_suggestions TEXT,

    -- Follow-up
    would_recommend BOOLEAN NULL,
    contact_requested BOOLEAN DEFAULT FALSE,
    responded_at TIMESTAMP NULL,
    response_notes TEXT NULL,

    -- Timestamps
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Foreign Keys
    FOREIGN KEY (order_id) REFERENCES customer_order(order_id) ON DELETE SET NULL,
    FOREIGN KEY (customer_id) REFERENCES customer(customer_id) ON DELETE SET NULL,

    -- Indexes
    INDEX idx_feedback_order (order_id),
    INDEX idx_feedback_customer (customer_id),
    INDEX idx_feedback_rating (overall_rating),
    INDEX idx_feedback_date (submitted_at)
) ENGINE=InnoDB;

-- ============================================================================
-- SECTION 10: INVENTORY MANAGEMENT
-- ============================================================================

-- Stock adjustment reasons
CREATE TABLE stock_adjustment_reason (
    reason_id INT AUTO_INCREMENT PRIMARY KEY,
    reason_name VARCHAR(100) NOT NULL,
    reason_type ENUM('received', 'sold', 'waste', 'damaged', 'expired', 'theft', 'return', 'adjustment', 'other') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Inventory transactions (all stock movements)
CREATE TABLE inventory_transaction (
    transaction_id INT AUTO_INCREMENT PRIMARY KEY,
    menu_item_id INT NOT NULL,
    transaction_type ENUM('in', 'out', 'adjustment') NOT NULL,
    quantity INT NOT NULL COMMENT 'Positive for in, negative for out',
    reason_id INT NOT NULL,
    reference_number VARCHAR(100) NULL COMMENT 'PO number, order number, etc.',
    notes TEXT,
    performed_by INT NULL COMMENT 'admin_id or cashier_id',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (menu_item_id) REFERENCES menu_item(menu_item_id) ON DELETE CASCADE,
    FOREIGN KEY (reason_id) REFERENCES stock_adjustment_reason(reason_id) ON DELETE RESTRICT,
    INDEX idx_inv_transaction_item (menu_item_id),
    INDEX idx_inv_transaction_type (transaction_type),
    INDEX idx_inv_transaction_date (created_at)
) ENGINE=InnoDB;

-- Inventory alerts (low stock notifications)
CREATE TABLE inventory_alert (
    alert_id INT AUTO_INCREMENT PRIMARY KEY,
    menu_item_id INT NOT NULL,
    alert_type ENUM('low_stock', 'out_of_stock', 'expiring_soon', 'expired') NOT NULL,
    current_quantity INT NOT NULL,
    threshold_quantity INT NOT NULL,
    severity ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
    is_acknowledged BOOLEAN DEFAULT FALSE,
    acknowledged_by INT NULL COMMENT 'admin_id',
    acknowledged_at TIMESTAMP NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (menu_item_id) REFERENCES menu_item(menu_item_id) ON DELETE CASCADE,
    FOREIGN KEY (acknowledged_by) REFERENCES admin(admin_id) ON DELETE SET NULL,
    INDEX idx_alert_item (menu_item_id),
    INDEX idx_alert_type (alert_type),
    INDEX idx_alert_severity (severity),
    INDEX idx_alert_status (is_acknowledged)
) ENGINE=InnoDB;

-- Waste tracking
CREATE TABLE waste_tracking (
    waste_id INT AUTO_INCREMENT PRIMARY KEY,
    menu_item_id INT NOT NULL,
    quantity INT NOT NULL,
    waste_reason ENUM('expired', 'damaged', 'overproduction', 'spoiled', 'contaminated', 'customer_return', 'other') NOT NULL,
    estimated_value DECIMAL(10,2) COMMENT 'Cost of wasted items',
    notes TEXT,
    recorded_by INT NULL COMMENT 'admin_id or cashier_id',
    waste_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (menu_item_id) REFERENCES menu_item(menu_item_id) ON DELETE CASCADE,
    INDEX idx_waste_item (menu_item_id),
    INDEX idx_waste_date (waste_date),
    INDEX idx_waste_reason (waste_reason)
) ENGINE=InnoDB;

-- ============================================================================
-- SECTION 11: ANALYTICS & REPORTING
-- ============================================================================

-- Daily stats per menu item
CREATE TABLE menu_item_daily_stats (
    stats_id INT AUTO_INCREMENT PRIMARY KEY,
    menu_item_id INT NOT NULL,
    stats_date DATE NOT NULL,
    daily_orders INT DEFAULT 0,
    daily_quantity_sold INT DEFAULT 0,
    daily_revenue DECIMAL(10,2) DEFAULT 0,
    UNIQUE KEY unique_item_date (menu_item_id, stats_date),
    FOREIGN KEY (menu_item_id) REFERENCES menu_item(menu_item_id) ON DELETE CASCADE,
    INDEX idx_stats_date (stats_date),
    INDEX idx_stats_item (menu_item_id)
) ENGINE=InnoDB;

-- Popularity history (track popularity score changes)
CREATE TABLE popularity_history (
    history_id INT AUTO_INCREMENT PRIMARY KEY,
    menu_item_id INT NOT NULL,
    popularity_score DECIMAL(5,2) NOT NULL,
    total_orders INT NOT NULL,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (menu_item_id) REFERENCES menu_item(menu_item_id) ON DELETE CASCADE,
    INDEX idx_pop_history_item (menu_item_id),
    INDEX idx_pop_history_date (recorded_at)
) ENGINE=InnoDB;

-- ============================================================================
-- SECTION 12: KIOSK MANAGEMENT
-- ============================================================================

-- Kiosk settings and configuration
CREATE TABLE kiosk_settings (
    setting_id INT AUTO_INCREMENT PRIMARY KEY,
    kiosk_id VARCHAR(50) NOT NULL UNIQUE,
    kiosk_name VARCHAR(100) NOT NULL,
    location VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    config_json JSON COMMENT 'Kiosk-specific configuration',
    last_sync TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_kiosk_active (is_active)
) ENGINE=InnoDB;

-- Kiosk sessions (track customer sessions)
CREATE TABLE kiosk_session (
    session_id INT AUTO_INCREMENT PRIMARY KEY,
    kiosk_id VARCHAR(50) NOT NULL,
    session_token VARCHAR(100) UNIQUE,
    customer_id INT NULL,
    order_id INT NULL,
    session_start TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    session_end TIMESTAMP NULL,
    items_viewed JSON COMMENT 'Array of viewed menu_item_ids',
    abandoned BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (customer_id) REFERENCES customer(customer_id) ON DELETE SET NULL,
    FOREIGN KEY (order_id) REFERENCES customer_order(order_id) ON DELETE SET NULL,
    INDEX idx_kiosk_session_kiosk (kiosk_id),
    INDEX idx_kiosk_session_date (session_start)
) ENGINE=InnoDB;

-- ============================================================================
-- SECTION 13: VIEWS (Read-only aggregated data)
-- ============================================================================

-- View: Pending custom cake requests
CREATE OR REPLACE VIEW v_pending_custom_cakes AS
SELECT
    ccr.request_id,
    ccr.customer_name,
    ccr.customer_email,
    ccr.customer_phone,
    ccr.num_layers,
    ccr.event_type,
    ccr.event_date,
    ccr.estimated_price,
    ccr.special_instructions,
    ccr.created_at,
    ccr.submitted_at,
    t.theme_name,
    COUNT(DISTINCT ccri.image_id) as image_count
FROM custom_cake_request ccr
LEFT JOIN custom_cake_theme t ON ccr.theme_id = t.theme_id
LEFT JOIN custom_cake_request_images ccri ON ccr.request_id = ccri.request_id
WHERE ccr.status = 'pending_review'
GROUP BY ccr.request_id
ORDER BY ccr.submitted_at DESC;

-- View: Approved custom cake requests
CREATE OR REPLACE VIEW v_approved_custom_cakes AS
SELECT
    ccr.request_id,
    ccr.customer_name,
    ccr.customer_email,
    ccr.customer_phone,
    ccr.num_layers,
    ccr.event_type,
    ccr.event_date,
    ccr.approved_price,
    ccr.scheduled_pickup_date,
    ccr.scheduled_pickup_time,
    ccr.reviewed_at,
    a.name as reviewed_by_name,
    ccr.order_id,
    t.theme_name
FROM custom_cake_request ccr
LEFT JOIN custom_cake_theme t ON ccr.theme_id = t.theme_id
LEFT JOIN admin a ON ccr.reviewed_by = a.admin_id
WHERE ccr.status = 'approved'
ORDER BY ccr.scheduled_pickup_date, ccr.scheduled_pickup_time;

-- ============================================================================
-- SECTION 14: TRIGGERS (Automated business logic)
-- ============================================================================

DELIMITER //

-- Trigger: Auto-calculate estimated price when request is submitted
CREATE TRIGGER trg_calculate_estimated_price
BEFORE UPDATE ON custom_cake_request
FOR EACH ROW
BEGIN
    -- DECLARE statements must come first in MySQL triggers
    DECLARE base_price DECIMAL(10,2) DEFAULT 500;
    DECLARE layer_cost DECIMAL(10,2) DEFAULT 0;
    DECLARE theme_cost DECIMAL(10,2) DEFAULT 0;

    IF NEW.status = 'pending_review' AND OLD.status = 'draft' THEN
        -- Calculate layer costs (each additional layer adds ₱150)
        SET layer_cost = (NEW.num_layers - 1) * 150;

        -- Add theme cost if applicable
        IF NEW.theme_id IS NOT NULL THEN
            SELECT base_additional_cost INTO theme_cost
            FROM custom_cake_theme
            WHERE theme_id = NEW.theme_id;
        END IF;

        -- Basic calculation (can be enhanced with size, flavor costs)
        SET NEW.estimated_price = base_price + layer_cost + COALESCE(theme_cost, 0) + 100;
        SET NEW.submitted_at = NOW();
    END IF;
END//

-- Trigger: Update QR session status when request is submitted
CREATE TRIGGER trg_update_qr_session_on_submit
AFTER UPDATE ON custom_cake_request
FOR EACH ROW
BEGIN
    IF NEW.status = 'pending_review' AND OLD.status = 'draft' THEN
        UPDATE qr_code_sessions
        SET status = 'used', used_at = NOW()
        WHERE session_token = NEW.session_token;
    END IF;
END//

DELIMITER ;

-- ============================================================================
-- SECTION 15: STORED PROCEDURES (Reusable business logic)
-- ============================================================================

DELIMITER //

-- Procedure: Expire old QR sessions
CREATE PROCEDURE sp_expire_qr_sessions()
BEGIN
    UPDATE qr_code_sessions
    SET status = 'expired'
    WHERE status = 'active'
    AND expires_at < NOW();
END//

-- Procedure: Get complete custom cake details
CREATE PROCEDURE sp_get_custom_cake_details(IN p_request_id INT)
BEGIN
    -- Main request details
    SELECT
        ccr.*,
        t.theme_name,
        t.theme_category,
        f1.flavor_name as layer_1_flavor,
        f2.flavor_name as layer_2_flavor,
        f3.flavor_name as layer_3_flavor,
        f4.flavor_name as layer_4_flavor,
        f5.flavor_name as layer_5_flavor,
        s1.size_name as layer_1_size,
        s2.size_name as layer_2_size,
        s3.size_name as layer_3_size,
        s4.size_name as layer_4_size,
        s5.size_name as layer_5_size,
        a.name as reviewed_by_name,
        a.email as reviewer_email
    FROM custom_cake_request ccr
    LEFT JOIN custom_cake_theme t ON ccr.theme_id = t.theme_id
    LEFT JOIN cake_flavors f1 ON ccr.layer_1_flavor_id = f1.flavor_id
    LEFT JOIN cake_flavors f2 ON ccr.layer_2_flavor_id = f2.flavor_id
    LEFT JOIN cake_flavors f3 ON ccr.layer_3_flavor_id = f3.flavor_id
    LEFT JOIN cake_flavors f4 ON ccr.layer_4_flavor_id = f4.flavor_id
    LEFT JOIN cake_flavors f5 ON ccr.layer_5_flavor_id = f5.flavor_id
    LEFT JOIN cake_sizes s1 ON ccr.layer_1_size_id = s1.size_id
    LEFT JOIN cake_sizes s2 ON ccr.layer_2_size_id = s2.size_id
    LEFT JOIN cake_sizes s3 ON ccr.layer_3_size_id = s3.size_id
    LEFT JOIN cake_sizes s4 ON ccr.layer_4_size_id = s4.size_id
    LEFT JOIN cake_sizes s5 ON ccr.layer_5_size_id = s5.size_id
    LEFT JOIN admin a ON ccr.reviewed_by = a.admin_id
    WHERE ccr.request_id = p_request_id;

    -- Request images
    SELECT * FROM custom_cake_request_images
    WHERE request_id = p_request_id
    ORDER BY uploaded_at;

    -- Notifications sent
    SELECT * FROM custom_cake_notifications
    WHERE request_id = p_request_id
    ORDER BY sent_at DESC;
END//

-- ============================================================================
-- Analytics Stored Procedures (V4)
-- ============================================================================

-- Get trending menu items based on recent orders
CREATE PROCEDURE GetTrendingItems(
    IN p_days INT,
    IN p_limit INT
)
BEGIN
    DECLARE v_days INT DEFAULT 7;
    DECLARE v_limit INT DEFAULT 10;

    -- Set defaults if parameters are null
    IF p_days IS NOT NULL AND p_days > 0 THEN
        SET v_days = p_days;
    END IF;

    IF p_limit IS NOT NULL AND p_limit > 0 THEN
        SET v_limit = p_limit;
    END IF;

    -- Get trending items from the last N days
    SELECT
        mi.menu_item_id,
        mi.name,
        mi.item_type,
        mi.popularity_score,
        COUNT(DISTINCT oi.order_id) as recent_orders,
        SUM(oi.quantity) as recent_quantity,
        SUM(oi.subtotal) as recent_revenue,
        AVG(oi.unit_price) as avg_price
    FROM menu_item mi
    LEFT JOIN order_item oi ON mi.menu_item_id = oi.menu_item_id
    LEFT JOIN customer_order co ON oi.order_id = co.order_id
    WHERE COALESCE(co.order_datetime, co.created_at) >= DATE_SUB(CURDATE(), INTERVAL v_days DAY)
        AND co.payment_status = 'paid'
        AND co.is_deleted = FALSE
        AND mi.status = 'available'
    GROUP BY mi.menu_item_id, mi.name, mi.item_type, mi.popularity_score
    HAVING recent_orders > 0
    ORDER BY recent_revenue DESC, recent_orders DESC, mi.popularity_score DESC
    LIMIT v_limit;
END//

-- Get waste report statistics
CREATE PROCEDURE GetWasteReport(
    IN p_start_date DATE,
    IN p_end_date DATE
)
BEGIN
    DECLARE v_start_date DATE;
    DECLARE v_end_date DATE;

    -- Set defaults if parameters are null
    IF p_start_date IS NULL THEN
        SET v_start_date = DATE_SUB(CURDATE(), INTERVAL 30 DAY);
    ELSE
        SET v_start_date = p_start_date;
    END IF;

    IF p_end_date IS NULL THEN
        SET v_end_date = CURDATE();
    ELSE
        SET v_end_date = p_end_date;
    END IF;

    -- Get waste summary
    SELECT
        COUNT(*) as waste_incidents,
        COALESCE(SUM(wt.quantity), 0) as total_items_wasted,
        COALESCE(SUM(wt.estimated_value), 0) as total_waste_cost,
        COALESCE(AVG(wt.estimated_value), 0) as avg_waste_cost,
        SUM(CASE WHEN wt.waste_reason = 'expired' THEN wt.quantity ELSE 0 END) as expired_items,
        SUM(CASE WHEN wt.waste_reason = 'damaged' THEN wt.quantity ELSE 0 END) as damaged_items,
        SUM(CASE WHEN wt.waste_reason = 'spoiled' THEN wt.quantity ELSE 0 END) as spoiled_items,
        SUM(CASE WHEN wt.waste_reason = 'overproduction' THEN wt.quantity ELSE 0 END) as overproduced_items
    FROM waste_tracking wt
    WHERE wt.waste_date BETWEEN v_start_date AND v_end_date;
END//

-- Recalculate popularity scores for all menu items
CREATE PROCEDURE RecalculatePopularityScore(
    IN p_days INT
)
BEGIN
    DECLARE v_days INT DEFAULT 30;

    -- Set default if parameter is null
    IF p_days IS NOT NULL AND p_days > 0 THEN
        SET v_days = p_days;
    END IF;

    -- Update popularity scores based on recent orders, revenue, and quantity sold
    UPDATE menu_item mi
    LEFT JOIN (
        SELECT
            oi.menu_item_id,
            COUNT(DISTINCT oi.order_id) as order_count,
            SUM(oi.quantity) as total_quantity,
            SUM(oi.subtotal) as total_revenue
        FROM order_item oi
        JOIN customer_order co ON oi.order_id = co.order_id
        WHERE COALESCE(co.order_datetime, co.created_at) >= DATE_SUB(CURDATE(), INTERVAL v_days DAY)
            AND co.payment_status = 'paid'
            AND co.is_deleted = FALSE
        GROUP BY oi.menu_item_id
    ) stats ON mi.menu_item_id = stats.menu_item_id
    SET mi.popularity_score = COALESCE(
        (stats.order_count * 10) + (stats.total_quantity * 2) + (stats.total_revenue / 100),
        0
    );

    -- Log the update to popularity history
    INSERT INTO popularity_history (menu_item_id, popularity_score, total_orders, recorded_at)
    SELECT
        mi.menu_item_id,
        mi.popularity_score,
        COALESCE(stats.order_count, 0),
        NOW()
    FROM menu_item mi
    LEFT JOIN (
        SELECT
            oi.menu_item_id,
            COUNT(DISTINCT oi.order_id) as order_count
        FROM order_item oi
        JOIN customer_order co ON oi.order_id = co.order_id
        WHERE COALESCE(co.order_datetime, co.created_at) >= DATE_SUB(CURDATE(), INTERVAL v_days DAY)
            AND co.payment_status = 'paid'
            AND co.is_deleted = FALSE
        GROUP BY oi.menu_item_id
    ) stats ON mi.menu_item_id = stats.menu_item_id;

    SELECT CONCAT('Popularity scores recalculated for ', ROW_COUNT(), ' items') as message;
END//

DELIMITER ;

-- ============================================================================
-- SECTION 16: INITIAL DATA (Required for system operation)
-- ============================================================================

-- Insert Roles
INSERT INTO roles (role_name, description) VALUES
('Super Admin', 'Full system access'),
('Manager', 'Store management and reporting'),
('Supervisor', 'Order management and staff supervision');

-- Insert Default Admin (Password: admin123)
-- Hash generated with: bcrypt.hash('admin123', 10)
INSERT INTO admin (username, password_hash, name, email, role_id, is_active) VALUES
('admin', '$2b$10$YourActualBcryptHashHere', 'System Administrator', 'admin@goldenmunch.com', 1, TRUE);

-- Insert Default Cashier (PIN: 1234)
-- Hash generated with: bcrypt.hash('1234', 10)
INSERT INTO cashier (name, cashier_code, pin_hash, phone, email, hire_date, hourly_rate, is_active) VALUES
('Default Cashier', 'CASH001', '$2b$10$YourActualBcryptHashHere', '+63-917-555-0100', 'cashier@goldenmunch.com', CURDATE(), 75.00, TRUE);

-- Insert Stock Adjustment Reasons
INSERT INTO stock_adjustment_reason (reason_name, reason_type) VALUES
('Purchase Order Received', 'received'),
('Sales', 'sold'),
('Spoilage', 'waste'),
('Damaged in Transit', 'damaged'),
('Expired', 'expired'),
('Theft/Loss', 'theft'),
('Customer Return', 'return'),
('Inventory Count Adjustment', 'adjustment'),
('Production', 'other');

-- Insert Default Suppliers
INSERT INTO suppliers (supplier_name, contact_person, phone, email, address, is_active) VALUES
('Manila Bakery Supplies Inc.', 'Juan Dela Cruz', '+63-917-555-0101', 'juan@manilabakerysupplies.ph', '123 Quezon Ave, Quezon City', TRUE),
('Premium Flour Mills', 'Maria Santos', '+63-917-555-0102', 'maria@premiumflour.ph', '456 Makati Ave, Makati City', TRUE),
('Chocolate Dreams Co.', 'Pedro Reyes', '+63-917-555-0103', 'pedro@chocolatedreams.ph', '789 Taft Ave, Manila', TRUE);

-- Insert Default Categories
INSERT INTO category (name, description, image_url, display_order, is_active, admin_id) VALUES
('Cakes', 'Freshly baked cakes for all occasions', '/images/categories/cakes.jpg', 1, TRUE, 1),
('Pastries', 'Delicious pastries and sweet treats', '/images/categories/pastries.jpg', 2, TRUE, 1),
('Breads', 'Fresh baked breads daily', '/images/categories/breads.jpg', 3, TRUE, 1),
('Beverages', 'Hot and cold beverages', '/images/categories/beverages.jpg', 4, TRUE, 1),
('Custom Cakes', 'Personalized cakes for special events', '/images/categories/custom-cakes.jpg', 5, TRUE, 1);

-- Insert Cake Flavors
INSERT INTO cake_flavors (flavor_name, description, flavor_category, base_price_per_tier, is_available) VALUES
('Chocolate', 'Rich and moist chocolate cake', 'classic', 100.00, TRUE),
('Vanilla', 'Classic vanilla cake', 'classic', 80.00, TRUE),
('Strawberry', 'Fresh strawberry flavor', 'classic', 90.00, TRUE),
('Red Velvet', 'Smooth red velvet with cream cheese frosting', 'premium', 120.00, TRUE),
('Ube', 'Purple yam cake (Filipino favorite)', 'specialty', 110.00, TRUE),
('Mocha', 'Coffee-infused chocolate cake', 'premium', 115.00, TRUE),
('Lemon', 'Zesty lemon cake', 'classic', 85.00, TRUE);

-- Insert Cake Sizes
INSERT INTO cake_sizes (size_name, diameter_cm, servings, base_price_multiplier, is_available) VALUES
('6 inches (Small)', 15.24, 8, 1.00, TRUE),
('8 inches (Medium)', 20.32, 16, 1.50, TRUE),
('10 inches (Large)', 25.40, 24, 2.00, TRUE),
('12 inches (Extra Large)', 30.48, 36, 2.50, TRUE),
('14 inches (Party Size)', 35.56, 48, 3.00, TRUE);

-- Insert Custom Cake Themes
INSERT INTO custom_cake_theme (theme_name, description, theme_category, base_additional_cost, is_available) VALUES
('Birthday', 'Fun and festive birthday theme', 'birthday', 200.00, TRUE),
('Wedding', 'Elegant wedding cake designs', 'wedding', 500.00, TRUE),
('Anniversary', 'Romantic anniversary theme', 'anniversary', 300.00, TRUE),
('Baby Shower', 'Cute baby shower decorations', 'other', 250.00, TRUE),
('Graduation', 'Celebrate academic achievements', 'other', 250.00, TRUE),
('Corporate', 'Professional corporate events', 'corporate', 400.00, TRUE),
('Christmas', 'Festive holiday theme', 'holiday', 300.00, TRUE);

-- Insert Default Tax Rules
INSERT INTO tax_rules (tax_name, tax_type, tax_rate, is_inclusive, applicable_to, is_active) VALUES
('VAT (12%)', 'vat', 12.00, FALSE, 'all', TRUE),
('Service Charge (5%)', 'service_charge', 5.00, FALSE, 'dine_in', FALSE);

-- ============================================================================
-- SECTION 17: UPDATE DEFAULT CREDENTIALS (Node.js bcrypt compatible)
-- ============================================================================

-- Update Admin password (password: admin123)
-- Generated with: bcrypt.hashSync('admin123', 10)
UPDATE admin
SET password_hash = '$2b$10$CXizOigTmnkp0RTmFSF2D.rfmDhi9A4TTLK0CFmHNhRWMhQAT5DYG'
WHERE username = 'admin';

-- Update Cashier PIN (PIN: 1234)
-- Generated with: bcrypt.hashSync('1234', 10)
UPDATE cashier
SET pin_hash = '$2b$10$fEDASegIWOnbGTzD0pEA9u/5rHLpLAS2tEqn8782ryWHLp1eYYsTG'
WHERE cashier_code = 'CASH001';

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

SELECT '╔════════════════════════════════════════════════════════════════════╗' as '';
SELECT '║                                                                    ║' as '';
SELECT '║            GOLDENMUNCH POS V3 - DATABASE CREATED                  ║' as '';
SELECT '║                                                                    ║' as '';
SELECT '╚════════════════════════════════════════════════════════════════════╝' as '';
SELECT '' as '';
SELECT '✅ Database: GoldenMunchPOS' as 'STATUS';
SELECT '✅ Tables: 40 tables created' as '';
SELECT '✅ Views: 2 views created' as '';
SELECT '✅ Triggers: 2 triggers created' as '';
SELECT '✅ Procedures: 2 stored procedures created' as '';
SELECT '✅ Initial Data: Loaded' as '';
SELECT '' as '';
SELECT '🔐 DEFAULT CREDENTIALS:' as '';
SELECT '   Admin Login:' as '';
SELECT '     Username: admin' as '';
SELECT '     Password: admin123' as '';
SELECT '' as '';
SELECT '   Cashier Login:' as '';
SELECT '     Code: CASH001' as '';
SELECT '     PIN: 1234' as '';
SELECT '' as '';
SELECT '⚠️  IMPORTANT: Change these credentials after first login!' as '';
SELECT '' as '';
SELECT '📊 FEATURES INCLUDED:' as '';
SELECT '   • Complete POS System' as '';
SELECT '   • Custom Cake Ordering (QR-based)' as '';
SELECT '   • Mobile 3D Cake Editor Integration' as '';
SELECT '   • Inventory Management' as '';
SELECT '   • Customer Management' as '';
SELECT '   • Promotions & Discounts' as '';
SELECT '   • Kiosk Self-Service' as '';
SELECT '   • Analytics & Reporting' as '';
SELECT '' as '';

ALTER TABLE menu_item MODIFY COLUMN nutritional_info TEXT NULL;

-- Add comment to clarify the field accepts text
ALTER TABLE menu_item MODIFY COLUMN nutritional_info TEXT NULL COMMENT 'Nutritional information as plain text (e.g., Calories: 250, Protein: 5g)';

-- Verify the change
DESCRIBE menu_item;

-- ============================================================================
-- DISABLE SAFE UPDATE MODE (Required for UPDATE statements without KEY columns)
-- ============================================================================
SET SQL_SAFE_UPDATES = 0;

-- ============================================================================
-- STEP 1: Add Missing Critical Columns (Direct SQL with checks)
-- ============================================================================

SELECT '═══════════════════════════════════════════════════' as '';
SELECT 'STEP 1: Adding missing columns to customer_order' as '';
SELECT '═══════════════════════════════════════════════════' as '';

-- verification_code
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'customer_order' AND COLUMN_NAME = 'verification_code');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE customer_order ADD COLUMN verification_code VARCHAR(6) NOT NULL DEFAULT ''000000'' COMMENT ''Random 6-digit code for order pickup'' AFTER order_number', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SELECT IF(@col_exists = 0, '✓ Added column: verification_code', '⊘ Column already exists: verification_code') as Status;

-- order_datetime
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'customer_order' AND COLUMN_NAME = 'order_datetime');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE customer_order ADD COLUMN order_datetime TIMESTAMP DEFAULT CURRENT_TIMESTAMP AFTER customer_id', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SELECT IF(@col_exists = 0, '✓ Added column: order_datetime', '⊘ Column already exists: order_datetime') as Status;

-- order_source
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'customer_order' AND COLUMN_NAME = 'order_source');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE customer_order ADD COLUMN order_source ENUM(''kiosk'', ''cashier'', ''admin'') NOT NULL DEFAULT ''kiosk'' AFTER order_type', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SELECT IF(@col_exists = 0, '✓ Added column: order_source', '⊘ Column already exists: order_source') as Status;

-- is_preorder
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'customer_order' AND COLUMN_NAME = 'is_preorder');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE customer_order ADD COLUMN is_preorder BOOLEAN DEFAULT FALSE AFTER order_source', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SELECT IF(@col_exists = 0, '✓ Added column: is_preorder', '⊘ Column already exists: is_preorder') as Status;

-- advance_payment_required
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'customer_order' AND COLUMN_NAME = 'advance_payment_required');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE customer_order ADD COLUMN advance_payment_required BOOLEAN DEFAULT FALSE AFTER is_preorder', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SELECT IF(@col_exists = 0, '✓ Added column: advance_payment_required', '⊘ Column already exists: advance_payment_required') as Status;

-- advance_payment_amount
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'customer_order' AND COLUMN_NAME = 'advance_payment_amount');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE customer_order ADD COLUMN advance_payment_amount DECIMAL(10,2) DEFAULT 0.00 AFTER advance_payment_required', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SELECT IF(@col_exists = 0, '✓ Added column: advance_payment_amount', '⊘ Column already exists: advance_payment_amount') as Status;

-- final_amount
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'customer_order' AND COLUMN_NAME = 'final_amount');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE customer_order ADD COLUMN final_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT ''Grand total = total_amount (same value for compatibility)'' AFTER total_amount', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SELECT IF(@col_exists = 0, '✓ Added column: final_amount', '⊘ Column already exists: final_amount') as Status;

-- gcash_reference_number
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'customer_order' AND COLUMN_NAME = 'gcash_reference_number');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE customer_order ADD COLUMN gcash_reference_number VARCHAR(100) NULL COMMENT ''GCash transaction reference'' AFTER payment_method', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SELECT IF(@col_exists = 0, '✓ Added column: gcash_reference_number', '⊘ Column already exists: gcash_reference_number') as Status;

-- paymaya_reference_number
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'customer_order' AND COLUMN_NAME = 'paymaya_reference_number');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE customer_order ADD COLUMN paymaya_reference_number VARCHAR(100) NULL COMMENT ''PayMaya transaction reference'' AFTER gcash_reference_number', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SELECT IF(@col_exists = 0, '✓ Added column: paymaya_reference_number', '⊘ Column already exists: paymaya_reference_number') as Status;

-- card_transaction_ref
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'customer_order' AND COLUMN_NAME = 'card_transaction_ref');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE customer_order ADD COLUMN card_transaction_ref VARCHAR(100) NULL COMMENT ''Card payment reference'' AFTER paymaya_reference_number', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SELECT IF(@col_exists = 0, '✓ Added column: card_transaction_ref', '⊘ Column already exists: card_transaction_ref') as Status;

-- payment_verified_at
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'customer_order' AND COLUMN_NAME = 'payment_verified_at');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE customer_order ADD COLUMN payment_verified_at TIMESTAMP NULL AFTER payment_status', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SELECT IF(@col_exists = 0, '✓ Added column: payment_verified_at', '⊘ Column already exists: payment_verified_at') as Status;

-- payment_verified_by
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'customer_order' AND COLUMN_NAME = 'payment_verified_by');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE customer_order ADD COLUMN payment_verified_by INT NULL COMMENT ''Cashier who verified payment'' AFTER payment_verified_at', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SELECT IF(@col_exists = 0, '✓ Added column: payment_verified_by', '⊘ Column already exists: payment_verified_by') as Status;

-- kiosk_session_id
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'customer_order' AND COLUMN_NAME = 'kiosk_session_id');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE customer_order ADD COLUMN kiosk_session_id VARCHAR(100) NULL COMMENT ''Kiosk session identifier'' AFTER kiosk_id', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SELECT IF(@col_exists = 0, '✓ Added column: kiosk_session_id', '⊘ Column already exists: kiosk_session_id') as Status;

-- is_printed
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'customer_order' AND COLUMN_NAME = 'is_printed');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE customer_order ADD COLUMN is_printed BOOLEAN DEFAULT FALSE COMMENT ''Has receipt been printed'' AFTER completed_at', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SELECT IF(@col_exists = 0, '✓ Added column: is_printed', '⊘ Column already exists: is_printed') as Status;

-- is_deleted
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'customer_order' AND COLUMN_NAME = 'is_deleted');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE customer_order ADD COLUMN is_deleted BOOLEAN DEFAULT FALSE AFTER is_printed', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SELECT IF(@col_exists = 0, '✓ Added column: is_deleted', '⊘ Column already exists: is_deleted') as Status;

-- ============================================================================
-- STEP 2: Rename Columns to Match Code Expectations
-- ============================================================================

SELECT '' as '';
SELECT '═══════════════════════════════════════════════════' as '';
SELECT 'STEP 2: Renaming columns to match code expectations' as '';
SELECT '═══════════════════════════════════════════════════' as '';

-- scheduled_pickup_time → scheduled_pickup_datetime
SET @old_col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'customer_order' AND COLUMN_NAME = 'scheduled_pickup_time');
SET @new_col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'customer_order' AND COLUMN_NAME = 'scheduled_pickup_datetime');
SET @sql = IF(@old_col_exists > 0 AND @new_col_exists = 0, 'ALTER TABLE customer_order CHANGE COLUMN scheduled_pickup_time scheduled_pickup_datetime TIMESTAMP NULL', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SELECT IF(@old_col_exists > 0 AND @new_col_exists = 0, '✓ Renamed: scheduled_pickup_time → scheduled_pickup_datetime', '⊘ Rename not needed or already done') as Status;

-- actual_pickup_time → actual_pickup_datetime
SET @old_col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'customer_order' AND COLUMN_NAME = 'actual_pickup_time');
SET @new_col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'customer_order' AND COLUMN_NAME = 'actual_pickup_datetime');
SET @sql = IF(@old_col_exists > 0 AND @new_col_exists = 0, 'ALTER TABLE customer_order CHANGE COLUMN actual_pickup_time actual_pickup_datetime TIMESTAMP NULL', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SELECT IF(@old_col_exists > 0 AND @new_col_exists = 0, '✓ Renamed: actual_pickup_time → actual_pickup_datetime', '⊘ Rename not needed or already done') as Status;

-- ============================================================================
-- STEP 3: Add Indexes for Performance
-- ============================================================================

SELECT '' as '';
SELECT '═══════════════════════════════════════════════════' as '';
SELECT 'STEP 3: Adding indexes for performance' as '';
SELECT '═══════════════════════════════════════════════════' as '';

-- idx_verification_code
SET @idx_exists = (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'customer_order' AND INDEX_NAME = 'idx_verification_code');
SET @sql = IF(@idx_exists = 0, 'ALTER TABLE customer_order ADD INDEX idx_verification_code (verification_code)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SELECT IF(@idx_exists = 0, '✓ Added index: idx_verification_code', '⊘ Index already exists: idx_verification_code') as Status;

-- idx_order_datetime
SET @idx_exists = (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'customer_order' AND INDEX_NAME = 'idx_order_datetime');
SET @sql = IF(@idx_exists = 0, 'ALTER TABLE customer_order ADD INDEX idx_order_datetime (order_datetime)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SELECT IF(@idx_exists = 0, '✓ Added index: idx_order_datetime', '⊘ Index already exists: idx_order_datetime') as Status;

-- idx_gcash_ref
SET @idx_exists = (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'customer_order' AND INDEX_NAME = 'idx_gcash_ref');
SET @sql = IF(@idx_exists = 0, 'ALTER TABLE customer_order ADD INDEX idx_gcash_ref (gcash_reference_number)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SELECT IF(@idx_exists = 0, '✓ Added index: idx_gcash_ref', '⊘ Index already exists: idx_gcash_ref') as Status;

-- idx_paymaya_ref
SET @idx_exists = (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'customer_order' AND INDEX_NAME = 'idx_paymaya_ref');
SET @sql = IF(@idx_exists = 0, 'ALTER TABLE customer_order ADD INDEX idx_paymaya_ref (paymaya_reference_number)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SELECT IF(@idx_exists = 0, '✓ Added index: idx_paymaya_ref', '⊘ Index already exists: idx_paymaya_ref') as Status;

-- idx_order_source
SET @idx_exists = (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'customer_order' AND INDEX_NAME = 'idx_order_source');
SET @sql = IF(@idx_exists = 0, 'ALTER TABLE customer_order ADD INDEX idx_order_source (order_source)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SELECT IF(@idx_exists = 0, '✓ Added index: idx_order_source', '⊘ Index already exists: idx_order_source') as Status;

-- idx_preorder
SET @idx_exists = (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'customer_order' AND INDEX_NAME = 'idx_preorder');
SET @sql = IF(@idx_exists = 0, 'ALTER TABLE customer_order ADD INDEX idx_preorder (is_preorder)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SELECT IF(@idx_exists = 0, '✓ Added index: idx_preorder', '⊘ Index already exists: idx_preorder') as Status;

-- idx_kiosk_session
SET @idx_exists = (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'customer_order' AND INDEX_NAME = 'idx_kiosk_session');
SET @sql = IF(@idx_exists = 0, 'ALTER TABLE customer_order ADD INDEX idx_kiosk_session (kiosk_session_id)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SELECT IF(@idx_exists = 0, '✓ Added index: idx_kiosk_session', '⊘ Index already exists: idx_kiosk_session') as Status;

-- idx_is_deleted
SET @idx_exists = (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'customer_order' AND INDEX_NAME = 'idx_is_deleted');
SET @sql = IF(@idx_exists = 0, 'ALTER TABLE customer_order ADD INDEX idx_is_deleted (is_deleted)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SELECT IF(@idx_exists = 0, '✓ Added index: idx_is_deleted', '⊘ Index already exists: idx_is_deleted') as Status;

-- idx_verification_date (composite index)
SET @idx_exists = (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'customer_order' AND INDEX_NAME = 'idx_verification_date');
SET @sql = IF(@idx_exists = 0, 'ALTER TABLE customer_order ADD INDEX idx_verification_date (verification_code, created_at)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SELECT IF(@idx_exists = 0, '✓ Added index: idx_verification_date', '⊘ Index already exists: idx_verification_date') as Status;

-- ============================================================================
-- STEP 4: Add Foreign Keys
-- ============================================================================

SELECT '' as '';
SELECT '═══════════════════════════════════════════════════' as '';
SELECT 'STEP 4: Adding foreign keys' as '';
SELECT '═══════════════════════════════════════════════════' as '';

-- fk_payment_verified_by
SET @fk_exists = (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'customer_order' AND CONSTRAINT_NAME = 'fk_payment_verified_by');
SET @sql = IF(@fk_exists = 0, 'ALTER TABLE customer_order ADD CONSTRAINT fk_payment_verified_by FOREIGN KEY (payment_verified_by) REFERENCES cashier(cashier_id) ON DELETE SET NULL', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SELECT IF(@fk_exists = 0, '✓ Added foreign key: fk_payment_verified_by', '⊘ Foreign key already exists: fk_payment_verified_by') as Status;

-- ============================================================================
-- STEP 5: Update Existing Records
-- ============================================================================

SELECT '' as '';
SELECT '═══════════════════════════════════════════════════' as '';
SELECT 'STEP 5: Updating existing records with default values' as '';
SELECT '═══════════════════════════════════════════════════' as '';

-- Sync final_amount with total_amount
UPDATE customer_order SET final_amount = total_amount WHERE final_amount = 0.00 OR final_amount IS NULL;
SELECT CONCAT('✓ Updated final_amount for ', ROW_COUNT(), ' records') as Status;

-- Generate verification codes
UPDATE customer_order SET verification_code = LPAD(FLOOR(100000 + RAND() * 900000), 6, '0') WHERE verification_code = '000000' OR verification_code IS NULL OR verification_code = '';
SELECT CONCAT('✓ Generated verification codes for ', ROW_COUNT(), ' records') as Status;

-- Set order_datetime from created_at
UPDATE customer_order SET order_datetime = created_at WHERE order_datetime IS NULL;
SELECT CONCAT('✓ Set order_datetime for ', ROW_COUNT(), ' records') as Status;

-- ============================================================================
-- STEP 6: Add Triggers
-- ============================================================================

SELECT '' as '';
SELECT '═══════════════════════════════════════════════════' as '';
SELECT 'STEP 6: Creating triggers for automatic data sync' as '';
SELECT '═══════════════════════════════════════════════════' as '';

DELIMITER //

DROP TRIGGER IF EXISTS trg_sync_final_amount_insert//
CREATE TRIGGER trg_sync_final_amount_insert BEFORE INSERT ON customer_order FOR EACH ROW
BEGIN
    IF NEW.final_amount = 0.00 OR NEW.final_amount IS NULL THEN SET NEW.final_amount = NEW.total_amount; END IF;
END//

DROP TRIGGER IF EXISTS trg_sync_final_amount_update//
CREATE TRIGGER trg_sync_final_amount_update BEFORE UPDATE ON customer_order FOR EACH ROW
BEGIN
    IF NEW.total_amount != OLD.total_amount AND NEW.final_amount = OLD.final_amount THEN SET NEW.final_amount = NEW.total_amount; END IF;
END//

DROP TRIGGER IF EXISTS trg_generate_verification_code//
CREATE TRIGGER trg_generate_verification_code BEFORE INSERT ON customer_order FOR EACH ROW
BEGIN
    IF NEW.verification_code = '000000' OR NEW.verification_code IS NULL OR NEW.verification_code = '' THEN
        SET NEW.verification_code = LPAD(FLOOR(100000 + RAND() * 900000), 6, '0');
    END IF;
END//

DROP TRIGGER IF EXISTS trg_set_order_datetime//
CREATE TRIGGER trg_set_order_datetime BEFORE INSERT ON customer_order FOR EACH ROW
BEGIN
    IF NEW.order_datetime IS NULL THEN SET NEW.order_datetime = CURRENT_TIMESTAMP; END IF;
END//

DELIMITER ;

SELECT '✓ Created 4 triggers for data consistency' as Status;

-- ============================================================================
-- STEP 7: Verification
-- ============================================================================

SELECT '' as '';
SELECT '═══════════════════════════════════════════════════' as '';
SELECT 'STEP 7: Verification and Summary' as '';
SELECT '═══════════════════════════════════════════════════' as '';

SELECT COUNT(*) as total_orders FROM customer_order;

SELECT order_id, order_number, verification_code, order_datetime, order_source, total_amount, final_amount, payment_status, order_status
FROM customer_order ORDER BY order_id DESC LIMIT 5;

SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'customer_order'
  AND COLUMN_NAME IN ('verification_code', 'order_datetime', 'final_amount', 'kiosk_session_id', 'is_preorder',
                       'gcash_reference_number', 'paymaya_reference_number', 'payment_verified_at', 'payment_verified_by',
                       'order_source', 'is_deleted')
ORDER BY ORDINAL_POSITION;

-- ============================================================================
-- COMPLETION
-- ============================================================================

SELECT '' as '';
SELECT '╔════════════════════════════════════════════════════════════════════╗' as '';
SELECT '║     CUSTOMER_ORDER SCHEMA MIGRATION COMPLETED SUCCESSFULLY        ║' as '';
SELECT '╚════════════════════════════════════════════════════════════════════╝' as '';
SELECT '' as '';
SELECT '✅ Added 15 missing columns' as 'STATUS';
SELECT '✅ Added 9 indexes' as '';
SELECT '✅ Added foreign key' as '';
SELECT '✅ Updated existing records' as '';
SELECT '✅ Created 4 triggers' as '';
SELECT '' as '';
SELECT '🚀 Database now compatible with existing codebase!' as '';


-- Migration: Add system_settings table for application-wide configuration
-- Created: 2025-11-29
-- Purpose: Store system-wide settings like payment QR codes

CREATE TABLE IF NOT EXISTS system_settings (
    setting_id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT,
    setting_type ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string',
    description VARCHAR(255),
    is_public BOOLEAN DEFAULT FALSE COMMENT 'Whether setting can be accessed without authentication',
    updated_by INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_setting_key (setting_key),
    INDEX idx_is_public (is_public),
    FOREIGN KEY (updated_by) REFERENCES admin(admin_id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Insert initial payment QR code settings (placeholders)
INSERT INTO system_settings (setting_key, setting_type, description, is_public)
VALUES
    ('gcash_qr_code_url', 'string', 'GCash payment QR code image URL', TRUE),
    ('paymaya_qr_code_url', 'string', 'PayMaya payment QR code image URL', TRUE)
ON DUPLICATE KEY UPDATE setting_key = setting_key;

-- Migration: Add cash handling fields to customer_order table
-- Created: 2025-11-28
-- Purpose: Support modern cashier workflow with cash tendering and change calculation

-- Check if columns exist and add them if they don't
SET @dbname = DATABASE();
SET @tablename = 'customer_order';

-- Add amount_paid column
SET @column_exists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = @dbname
    AND TABLE_NAME = @tablename
    AND COLUMN_NAME = 'amount_paid'
);

SET @sql = IF(@column_exists = 0,
    'ALTER TABLE customer_order ADD COLUMN amount_paid DECIMAL(10,2) DEFAULT 0 COMMENT ''Amount tendered by customer for cash payments'' AFTER payment_method',
    'SELECT ''Column amount_paid already exists'' AS msg'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add change_amount column
SET @column_exists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = @dbname
    AND TABLE_NAME = @tablename
    AND COLUMN_NAME = 'change_amount'
);

SET @sql = IF(@column_exists = 0,
    'ALTER TABLE customer_order ADD COLUMN change_amount DECIMAL(10,2) DEFAULT 0 COMMENT ''Change to return to customer'' AFTER amount_paid',
    'SELECT ''Column change_amount already exists'' AS msg'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Update existing orders to set amount_paid = final_amount for paid orders
UPDATE customer_order
SET amount_paid = final_amount
WHERE payment_status IN ('paid', 'partial_paid')
AND amount_paid = 0;

SELECT 'Migration completed: Cash handling fields added successfully' AS status;

-- Migration: Add system_settings table for application-wide configuration
-- Created: 2025-11-29
-- Purpose: Store system-wide settings like payment QR codes

CREATE TABLE IF NOT EXISTS system_settings (
    setting_id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT,
    setting_type ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string',
    description VARCHAR(255),
    is_public BOOLEAN DEFAULT FALSE COMMENT 'Whether setting can be accessed without authentication',
    updated_by INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_setting_key (setting_key),
    INDEX idx_is_public (is_public),
    FOREIGN KEY (updated_by) REFERENCES admin(admin_id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Insert initial payment QR code settings (placeholders)
INSERT INTO system_settings (setting_key, setting_type, description, is_public)
VALUES
    ('gcash_qr_code_url', 'string', 'GCash payment QR code image URL', TRUE),
    ('paymaya_qr_code_url', 'string', 'PayMaya payment QR code image URL', TRUE)
ON DUPLICATE KEY UPDATE setting_key = setting_key;

-- Migration: Fix Custom Cake Pricing Calculation
-- Description: Updates the pricing trigger to include flavor costs and size multipliers
-- Date: 2025-12-01

-- Drop existing trigger
DROP TRIGGER IF EXISTS trg_calculate_estimated_price;

DELIMITER //

-- Create improved trigger with comprehensive pricing calculation
CREATE TRIGGER trg_calculate_estimated_price
BEFORE UPDATE ON custom_cake_request
FOR EACH ROW
BEGIN
    -- DECLARE statements must come first in MySQL triggers
    DECLARE base_price DECIMAL(10,2) DEFAULT 500;
    DECLARE layer_cost DECIMAL(10,2) DEFAULT 0;
    DECLARE theme_cost DECIMAL(10,2) DEFAULT 0;
    DECLARE flavor_cost DECIMAL(10,2) DEFAULT 0;
    DECLARE size_multiplier DECIMAL(10,2) DEFAULT 1.0;
    DECLARE total_size_multiplier DECIMAL(10,2) DEFAULT 0;
    DECLARE decoration_buffer DECIMAL(10,2) DEFAULT 100;
    DECLARE subtotal DECIMAL(10,2) DEFAULT 0;

    -- Temporary variables for layer calculations
    DECLARE layer1_flavor_cost DECIMAL(10,2) DEFAULT 0;
    DECLARE layer2_flavor_cost DECIMAL(10,2) DEFAULT 0;
    DECLARE layer3_flavor_cost DECIMAL(10,2) DEFAULT 0;
    DECLARE layer4_flavor_cost DECIMAL(10,2) DEFAULT 0;
    DECLARE layer5_flavor_cost DECIMAL(10,2) DEFAULT 0;

    DECLARE layer1_size_mult DECIMAL(10,2) DEFAULT 0;
    DECLARE layer2_size_mult DECIMAL(10,2) DEFAULT 0;
    DECLARE layer3_size_mult DECIMAL(10,2) DEFAULT 0;
    DECLARE layer4_size_mult DECIMAL(10,2) DEFAULT 0;
    DECLARE layer5_size_mult DECIMAL(10,2) DEFAULT 0;

    IF NEW.status = 'pending_review' AND OLD.status = 'draft' THEN
        -- Base layer cost (each additional layer adds ₱150)
        SET layer_cost = (NEW.num_layers - 1) * 150;

        -- Add theme cost if applicable
        IF NEW.theme_id IS NOT NULL THEN
            SELECT COALESCE(base_additional_cost, 0) INTO theme_cost
            FROM custom_cake_theme
            WHERE theme_id = NEW.theme_id;
        END IF;

        -- Calculate flavor costs for each layer
        IF NEW.layer_1_flavor_id IS NOT NULL THEN
            SELECT COALESCE(base_price_per_tier, 0) INTO layer1_flavor_cost
            FROM cake_flavors
            WHERE flavor_id = NEW.layer_1_flavor_id;
        END IF;

        IF NEW.layer_2_flavor_id IS NOT NULL THEN
            SELECT COALESCE(base_price_per_tier, 0) INTO layer2_flavor_cost
            FROM cake_flavors
            WHERE flavor_id = NEW.layer_2_flavor_id;
        END IF;

        IF NEW.layer_3_flavor_id IS NOT NULL THEN
            SELECT COALESCE(base_price_per_tier, 0) INTO layer3_flavor_cost
            FROM cake_flavors
            WHERE flavor_id = NEW.layer_3_flavor_id;
        END IF;

        IF NEW.layer_4_flavor_id IS NOT NULL THEN
            SELECT COALESCE(base_price_per_tier, 0) INTO layer4_flavor_cost
            FROM cake_flavors
            WHERE flavor_id = NEW.layer_4_flavor_id;
        END IF;

        IF NEW.layer_5_flavor_id IS NOT NULL THEN
            SELECT COALESCE(base_price_per_tier, 0) INTO layer5_flavor_cost
            FROM cake_flavors
            WHERE flavor_id = NEW.layer_5_flavor_id;
        END IF;

        -- Total flavor cost
        SET flavor_cost = layer1_flavor_cost + layer2_flavor_cost + layer3_flavor_cost +
                          layer4_flavor_cost + layer5_flavor_cost;

        -- Calculate size multipliers for each layer
        IF NEW.layer_1_size_id IS NOT NULL THEN
            SELECT COALESCE(base_price_multiplier, 1.0) INTO layer1_size_mult
            FROM cake_sizes
            WHERE size_id = NEW.layer_1_size_id;
        END IF;

        IF NEW.layer_2_size_id IS NOT NULL THEN
            SELECT COALESCE(base_price_multiplier, 1.0) INTO layer2_size_mult
            FROM cake_sizes
            WHERE size_id = NEW.layer_2_size_id;
        END IF;

        IF NEW.layer_3_size_id IS NOT NULL THEN
            SELECT COALESCE(base_price_multiplier, 1.0) INTO layer3_size_mult
            FROM cake_sizes
            WHERE size_id = NEW.layer_3_size_id;
        END IF;

        IF NEW.layer_4_size_id IS NOT NULL THEN
            SELECT COALESCE(base_price_multiplier, 1.0) INTO layer4_size_mult
            FROM cake_sizes
            WHERE size_id = NEW.layer_4_size_id;
        END IF;

        IF NEW.layer_5_size_id IS NOT NULL THEN
            SELECT COALESCE(base_price_multiplier, 1.0) INTO layer5_size_mult
            FROM cake_sizes
            WHERE size_id = NEW.layer_5_size_id;
        END IF;

        -- Calculate average size multiplier across all layers
        -- This gives us a fair representation of the overall cake size
        SET total_size_multiplier = (layer1_size_mult + layer2_size_mult + layer3_size_mult +
                                     layer4_size_mult + layer5_size_mult) / NEW.num_layers;

        -- If no sizes specified, default to 1.0
        IF total_size_multiplier = 0 THEN
            SET total_size_multiplier = 1.0;
        END IF;

        -- Calculate candle costs (₱5 per candle)
        IF NEW.candles_count IS NOT NULL AND NEW.candles_count > 0 THEN
            SET decoration_buffer = decoration_buffer + (NEW.candles_count * 5);
        END IF;

        -- Calculate subtotal before size multiplier
        SET subtotal = base_price + layer_cost + theme_cost + flavor_cost + decoration_buffer;

        -- Apply size multiplier to get final estimated price
        SET NEW.estimated_price = ROUND(subtotal * total_size_multiplier, 2);

        -- Store detailed price breakdown as JSON
        SET NEW.price_breakdown = JSON_OBJECT(
            'base_price', base_price,
            'layer_cost', layer_cost,
            'theme_cost', theme_cost,
            'flavor_cost', flavor_cost,
            'decoration_buffer', decoration_buffer,
            'subtotal', subtotal,
            'size_multiplier', total_size_multiplier,
            'estimated_total', NEW.estimated_price,
            'layers', JSON_OBJECT(
                'layer_1', JSON_OBJECT('flavor_cost', layer1_flavor_cost, 'size_mult', layer1_size_mult),
                'layer_2', JSON_OBJECT('flavor_cost', layer2_flavor_cost, 'size_mult', layer2_size_mult),
                'layer_3', JSON_OBJECT('flavor_cost', layer3_flavor_cost, 'size_mult', layer3_size_mult),
                'layer_4', JSON_OBJECT('flavor_cost', layer4_flavor_cost, 'size_mult', layer4_size_mult),
                'layer_5', JSON_OBJECT('flavor_cost', layer5_flavor_cost, 'size_mult', layer5_size_mult)
            )
        );

        -- Set submission timestamp
        SET NEW.submitted_at = NOW();
    END IF;
END//

DELIMITER ;

-- Add comments for documentation
ALTER TABLE custom_cake_request
MODIFY COLUMN estimated_price DECIMAL(10,2) COMMENT 'Auto-calculated price including base, layers, flavors, sizes, theme, and decorations';

ALTER TABLE custom_cake_request
MODIFY COLUMN price_breakdown JSON COMMENT 'Detailed breakdown of pricing calculation including all components';

-- Verify the trigger was created
SELECT TRIGGER_NAME, EVENT_MANIPULATION, EVENT_OBJECT_TABLE
FROM information_schema.TRIGGERS
WHERE TRIGGER_NAME = 'trg_calculate_estimated_price';

-- Migration: Add system_settings table for application-wide configuration
-- Created: 2025-11-29
-- Purpose: Store system-wide settings like payment QR codes

CREATE TABLE IF NOT EXISTS system_settings (
    setting_id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT,
    setting_type ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string',
    description VARCHAR(255),
    is_public BOOLEAN DEFAULT FALSE COMMENT 'Whether setting can be accessed without authentication',
    updated_by INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_setting_key (setting_key),
    INDEX idx_is_public (is_public),
    FOREIGN KEY (updated_by) REFERENCES admin(admin_id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ============================================================================
-- VIEWS
-- ============================================================================

-- Create view for easier message thread queries
CREATE OR REPLACE VIEW message_threads AS
SELECT
  n.notification_id,
  n.request_id,
  n.notification_type,
  n.sender_type,
  n.sender_name,
  n.recipient_email,
  n.subject,
  n.message_body,
  n.status,
  n.is_read,
  n.sent_at,
  n.read_at,
  n.parent_notification_id,
  ccr.customer_name,
  ccr.customer_email,
  ccr.status as request_status
FROM custom_cake_notifications n
INNER JOIN custom_cake_request ccr ON n.request_id = ccr.request_id
ORDER BY n.request_id, n.sent_at ASC;

-- ============================================================================
-- COMPLETION MESSAGE - PRODUCTION SCHEMA
-- ============================================================================

SELECT '╔════════════════════════════════════════════════════════════════════╗' as '';
SELECT '║                                                                    ║' as '';
SELECT '║         GOLDENMUNCH POS V5 - PRODUCTION DATABASE CREATED          ║' as '';
SELECT '║                                                                    ║' as '';
SELECT '╚════════════════════════════════════════════════════════════════════╝' as '';
SELECT '' as '';
SELECT '✅ Database: defaultdb' as 'STATUS';
SELECT '✅ Tables: 40+ tables created' as '';
SELECT '✅ Views: 2 views created' as '';
SELECT '✅ Triggers: 2 triggers created' as '';
SELECT '✅ Procedures: Multiple stored procedures created' as '';
SELECT '✅ Essential Seed Data: Loaded' as '';
SELECT '⚠️  Test Data: NOT included (production-ready)' as '';
SELECT '' as '';
SELECT '🔐 DEFAULT CREDENTIALS:' as '';
SELECT '   Admin Login:' as '';
SELECT '     Username: admin' as '';
SELECT '     Password: admin123' as '';
SELECT '' as '';
SELECT '   Cashier Login:' as '';
SELECT '     Code: CASH001' as '';
SELECT '     PIN: 1234' as '';
SELECT '' as '';
SELECT '⚠️  SECURITY: Change these credentials immediately after deployment!' as '';
SELECT '' as '';
SELECT '📊 INCLUDED SEED DATA:' as '';
SELECT '   • User Roles (Super Admin, Manager, Supervisor)' as '';
SELECT '   • Default Admin & Cashier accounts' as '';
SELECT '   • Stock Adjustment Reasons' as '';
SELECT '   • Default Suppliers (3)' as '';
SELECT '   • Product Categories (5)' as '';
SELECT '   • Cake Flavors (7)' as '';
SELECT '   • Cake Sizes (5)' as '';
SELECT '   • Custom Cake Themes (7)' as '';
SELECT '   • Tax Rules (VAT 12%)' as '';
SELECT '   • System Settings' as '';
SELECT '' as '';
SELECT '🚀 READY FOR:' as '';
SELECT '   ✓ Production deployment' as '';
SELECT '   ✓ Custom menu item creation' as '';
SELECT '   ✓ Customer registration' as '';
SELECT '   ✓ Order processing' as '';
SELECT '   ✓ Custom cake ordering' as '';
SELECT '   ✓ Payment processing' as '';
SELECT '   ✓ Discount management' as '';
SELECT '   ✓ Inventory tracking' as '';
SELECT '   ✓ Analytics and reporting' as '';
SELECT '' as '';
SELECT '📝 NEXT STEPS:' as '';
SELECT '   1. Change default admin password' as '';
SELECT '   2. Change default cashier PIN' as '';
SELECT '   3. Add menu items via Admin panel' as '';
SELECT '   4. Configure payment QR codes' as '';
SELECT '   5. Set up discount types as needed' as '';
SELECT '   6. Test all features thoroughly' as '';
SELECT '' as '';

-- Re-enable safe update mode
SET SQL_SAFE_UPDATES = 1;

