-- ============================================================================
-- CUSTOM CAKE REQUEST SYSTEM - DATABASE MIGRATION
-- Description: Tables for QR-based custom cake ordering with approval workflow
-- Version: 1.0
-- Date: November 23, 2025
-- ============================================================================

USE GoldenMunchPOS;

-- ============================================================================
-- 1. CUSTOM CAKE REQUEST TABLE (Main table for custom cake orders)
-- ============================================================================

CREATE TABLE IF NOT EXISTS custom_cake_request (
    request_id INT AUTO_INCREMENT PRIMARY KEY,

    -- Session & QR Code
    session_token VARCHAR(100) NOT NULL UNIQUE COMMENT 'UUID for QR code session',
    qr_code_url VARCHAR(500) COMMENT 'URL to QR code image',

    -- Customer Information
    customer_name VARCHAR(100),
    customer_phone VARCHAR(20),
    customer_email VARCHAR(100),

    -- Cake Structure
    num_layers INT DEFAULT 1 CHECK (num_layers BETWEEN 1 AND 5),
    layer_1_flavor_id INT,
    layer_2_flavor_id INT,
    layer_3_flavor_id INT,
    layer_4_flavor_id INT,
    layer_5_flavor_id INT,

    layer_1_size_id INT,
    layer_2_size_id INT,
    layer_3_size_id INT,
    layer_4_size_id INT,
    layer_5_size_id INT,

    total_height_cm DECIMAL(5,2) COMMENT 'Total cake height',
    base_diameter_cm DECIMAL(5,2) COMMENT 'Base layer diameter',

    -- Theme & Frosting
    theme_id INT,
    frosting_color VARCHAR(50),
    frosting_type ENUM('buttercream', 'fondant', 'whipped_cream', 'ganache', 'cream_cheese') DEFAULT 'buttercream',

    -- Candles
    candles_count INT DEFAULT 0,
    candle_type ENUM('number', 'regular', 'sparkler', 'none') DEFAULT 'regular',
    candle_numbers VARCHAR(20) COMMENT 'e.g., "2,5" for numbers 2 and 5',

    -- Text on Cake
    cake_text VARCHAR(200),
    text_color VARCHAR(50),
    text_font ENUM('script', 'bold', 'elegant', 'playful', 'modern') DEFAULT 'script',
    text_position ENUM('top', 'center', 'bottom') DEFAULT 'top',

    -- 3D Decorations (stored as JSON)
    decorations_3d JSON COMMENT 'Array of 3D decoration objects: [{type, position, rotation, scale, color}]',

    -- Instructions & Notes
    special_instructions TEXT,
    baker_notes TEXT,
    dietary_restrictions TEXT COMMENT 'Allergies, vegan, gluten-free, etc.',

    -- Event Details
    event_type VARCHAR(50) COMMENT 'birthday, wedding, anniversary, etc.',
    event_date DATE,

    -- Approval Workflow
    status ENUM('draft', 'pending_review', 'approved', 'rejected', 'cancelled', 'completed') DEFAULT 'draft',
    submitted_at TIMESTAMP NULL,
    reviewed_at TIMESTAMP NULL,
    reviewed_by INT NULL COMMENT 'admin_id who reviewed',
    rejection_reason TEXT NULL,
    admin_notes TEXT COMMENT 'Notes from admin during review',

    -- Pricing
    estimated_price DECIMAL(10,2) NULL COMMENT 'Auto-calculated estimate',
    approved_price DECIMAL(10,2) NULL COMMENT 'Final price set by admin',
    price_breakdown JSON COMMENT 'Detailed cost breakdown: {base, layers, decorations, theme, etc}',

    -- Scheduling
    preparation_days INT NULL COMMENT 'Days needed for preparation',
    scheduled_pickup_date DATE NULL,
    scheduled_pickup_time TIME NULL,

    -- Linked Order
    order_id INT NULL COMMENT 'Links to customer_order after payment',

    -- Session Management
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NULL COMMENT 'QR session expiry (15-30 minutes)',

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
    FOREIGN KEY (order_id) REFERENCES customer_order(order_id) ON DELETE SET NULL,

    -- Indexes
    INDEX idx_session_token (session_token),
    INDEX idx_status (status),
    INDEX idx_submitted_at (submitted_at),
    INDEX idx_scheduled_pickup (scheduled_pickup_date),
    INDEX idx_created_at (created_at),
    INDEX idx_customer_email (customer_email),
    INDEX idx_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Custom cake requests with QR code workflow';

-- ============================================================================
-- 2. CUSTOM CAKE REQUEST IMAGES TABLE (3D renders and reference images)
-- ============================================================================

CREATE TABLE IF NOT EXISTS custom_cake_request_images (
    image_id INT AUTO_INCREMENT PRIMARY KEY,
    request_id INT NOT NULL,

    -- Image Details
    image_url VARCHAR(255) NOT NULL,
    image_type ENUM('3d_render', 'reference', 'sketch', 'final_product') DEFAULT '3d_render',
    view_angle ENUM('front', 'side', 'top', '3d_perspective', 'all_angles') DEFAULT 'front',

    -- Metadata
    file_size INT COMMENT 'Size in bytes',
    mime_type VARCHAR(50),
    width INT,
    height INT,

    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (request_id) REFERENCES custom_cake_request(request_id) ON DELETE CASCADE,
    INDEX idx_request_images (request_id),
    INDEX idx_image_type (image_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Images for custom cake requests';

-- ============================================================================
-- 3. QR CODE SESSIONS TABLE (Session tracking and security)
-- ============================================================================

CREATE TABLE IF NOT EXISTS qr_code_sessions (
    session_id INT AUTO_INCREMENT PRIMARY KEY,

    -- Session Details
    session_token VARCHAR(100) NOT NULL UNIQUE,
    qr_code_data TEXT NOT NULL COMMENT 'Full QR code data/URL',
    editor_url VARCHAR(500) NOT NULL COMMENT 'URL to cake editor',

    -- Request Linking
    request_id INT NULL COMMENT 'Links to created request',

    -- Tracking
    kiosk_id VARCHAR(50) COMMENT 'Which kiosk terminal generated this',
    ip_address VARCHAR(50),
    user_agent TEXT,

    -- Status
    status ENUM('active', 'used', 'expired', 'cancelled') DEFAULT 'active',
    accessed_at TIMESTAMP NULL COMMENT 'When user first accessed editor',
    completed_at TIMESTAMP NULL COMMENT 'When request was submitted',

    -- Timing
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,

    FOREIGN KEY (request_id) REFERENCES custom_cake_request(request_id) ON DELETE SET NULL,

    INDEX idx_token (session_token),
    INDEX idx_status (status),
    INDEX idx_expires (expires_at),
    INDEX idx_request_id (request_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='QR code session tracking';

-- ============================================================================
-- 4. CUSTOM CAKE NOTIFICATIONS TABLE (Email/SMS notification log)
-- ============================================================================

CREATE TABLE IF NOT EXISTS custom_cake_notifications (
    notification_id INT AUTO_INCREMENT PRIMARY KEY,
    request_id INT NOT NULL,

    -- Notification Details
    notification_type ENUM('submitted', 'approved', 'rejected', 'payment_reminder', 'ready_for_pickup', 'completed') NOT NULL,
    recipient_email VARCHAR(100),
    recipient_phone VARCHAR(20),

    -- Message
    subject VARCHAR(200),
    message TEXT,

    -- Delivery Status
    status ENUM('pending', 'sent', 'failed', 'bounced') DEFAULT 'pending',
    sent_at TIMESTAMP NULL,
    error_message TEXT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (request_id) REFERENCES custom_cake_request(request_id) ON DELETE CASCADE,
    INDEX idx_request_notifications (request_id),
    INDEX idx_status (status),
    INDEX idx_type (notification_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Notification log for custom cake requests';

-- ============================================================================
-- 5. VIEWS FOR EASY QUERYING
-- ============================================================================

-- View: Pending custom cake requests for admin review
CREATE OR REPLACE VIEW v_pending_custom_cakes AS
SELECT
    ccr.request_id,
    ccr.session_token,
    ccr.customer_name,
    ccr.customer_email,
    ccr.customer_phone,
    ccr.num_layers,
    ccr.event_type,
    ccr.event_date,
    ccr.estimated_price,
    ccr.submitted_at,
    ccr.special_instructions,
    ccr.dietary_restrictions,
    cct.theme_name,
    GROUP_CONCAT(DISTINCT ccri.image_url ORDER BY ccri.image_id) as image_urls,
    COUNT(DISTINCT ccri.image_id) as image_count
FROM custom_cake_request ccr
LEFT JOIN custom_cake_theme cct ON ccr.theme_id = cct.theme_id
LEFT JOIN custom_cake_request_images ccri ON ccr.request_id = ccri.request_id
WHERE ccr.status = 'pending_review'
GROUP BY ccr.request_id
ORDER BY ccr.submitted_at ASC;

-- View: Approved custom cakes ready for cashier processing
CREATE OR REPLACE VIEW v_approved_custom_cakes AS
SELECT
    ccr.request_id,
    ccr.customer_name,
    ccr.customer_email,
    ccr.customer_phone,
    ccr.approved_price,
    ccr.scheduled_pickup_date,
    ccr.scheduled_pickup_time,
    ccr.preparation_days,
    ccr.order_id,
    ccr.status,
    ccr.reviewed_at,
    CONCAT(a.name) as reviewed_by_name,
    cct.theme_name,
    DATEDIFF(ccr.scheduled_pickup_date, CURDATE()) as days_until_pickup
FROM custom_cake_request ccr
LEFT JOIN admin a ON ccr.reviewed_by = a.admin_id
LEFT JOIN custom_cake_theme cct ON ccr.theme_id = cct.theme_id
WHERE ccr.status IN ('approved', 'completed')
ORDER BY ccr.scheduled_pickup_date ASC;

-- ============================================================================
-- 6. TRIGGERS FOR AUTOMATION
-- ============================================================================

DELIMITER //

-- Trigger: Auto-calculate estimated price when request is submitted
CREATE TRIGGER trg_calculate_estimated_price
BEFORE UPDATE ON custom_cake_request
FOR EACH ROW
BEGIN
    IF NEW.status = 'pending_review' AND OLD.status = 'draft' THEN
        DECLARE base_price DECIMAL(10,2) DEFAULT 500.00;
        DECLARE layer_cost DECIMAL(10,2) DEFAULT 0.00;
        DECLARE theme_cost DECIMAL(10,2) DEFAULT 0.00;
        DECLARE decoration_cost DECIMAL(10,2) DEFAULT 100.00;

        -- Calculate layer cost (₱150 per layer)
        SET layer_cost = (NEW.num_layers - 1) * 150.00;

        -- Get theme cost
        IF NEW.theme_id IS NOT NULL THEN
            SELECT base_additional_cost INTO theme_cost
            FROM custom_cake_theme
            WHERE theme_id = NEW.theme_id;
        END IF;

        -- Calculate total estimate
        SET NEW.estimated_price = base_price + layer_cost + theme_cost + decoration_cost;
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
        SET status = 'used', completed_at = NOW()
        WHERE session_token = NEW.session_token;
    END IF;
END//

DELIMITER ;

-- ============================================================================
-- 7. STORED PROCEDURES
-- ============================================================================

DELIMITER //

-- Procedure: Expire old QR sessions
CREATE PROCEDURE sp_expire_qr_sessions()
BEGIN
    UPDATE qr_code_sessions
    SET status = 'expired'
    WHERE status = 'active'
    AND expires_at < NOW();

    SELECT ROW_COUNT() as expired_sessions;
END//

-- Procedure: Get custom cake request details
CREATE PROCEDURE sp_get_custom_cake_details(IN p_request_id INT)
BEGIN
    -- Main request details
    SELECT
        ccr.*,
        cct.theme_name,
        cct.theme_image_url,
        a.name as reviewed_by_name
    FROM custom_cake_request ccr
    LEFT JOIN custom_cake_theme cct ON ccr.theme_id = cct.theme_id
    LEFT JOIN admin a ON ccr.reviewed_by = a.admin_id
    WHERE ccr.request_id = p_request_id;

    -- Flavor details
    SELECT
        1 as layer_number,
        cf1.flavor_name,
        cf1.description,
        cs1.size_name
    FROM custom_cake_request ccr
    LEFT JOIN cake_flavors cf1 ON ccr.layer_1_flavor_id = cf1.flavor_id
    LEFT JOIN cake_sizes cs1 ON ccr.layer_1_size_id = cs1.size_id
    WHERE ccr.request_id = p_request_id AND ccr.layer_1_flavor_id IS NOT NULL

    UNION ALL

    SELECT 2, cf2.flavor_name, cf2.description, cs2.size_name
    FROM custom_cake_request ccr
    LEFT JOIN cake_flavors cf2 ON ccr.layer_2_flavor_id = cf2.flavor_id
    LEFT JOIN cake_sizes cs2 ON ccr.layer_2_size_id = cs2.size_id
    WHERE ccr.request_id = p_request_id AND ccr.layer_2_flavor_id IS NOT NULL

    UNION ALL

    SELECT 3, cf3.flavor_name, cf3.description, cs3.size_name
    FROM custom_cake_request ccr
    LEFT JOIN cake_flavors cf3 ON ccr.layer_3_flavor_id = cf3.flavor_id
    LEFT JOIN cake_sizes cs3 ON ccr.layer_3_size_id = cs3.size_id
    WHERE ccr.request_id = p_request_id AND ccr.layer_3_flavor_id IS NOT NULL

    UNION ALL

    SELECT 4, cf4.flavor_name, cf4.description, cs4.size_name
    FROM custom_cake_request ccr
    LEFT JOIN cake_flavors cf4 ON ccr.layer_4_flavor_id = cf4.flavor_id
    LEFT JOIN cake_sizes cs4 ON ccr.layer_4_size_id = cs4.size_id
    WHERE ccr.request_id = p_request_id AND ccr.layer_4_flavor_id IS NOT NULL

    UNION ALL

    SELECT 5, cf5.flavor_name, cf5.description, cs5.size_name
    FROM custom_cake_request ccr
    LEFT JOIN cake_flavors cf5 ON ccr.layer_5_flavor_id = cf5.flavor_id
    LEFT JOIN cake_sizes cs5 ON ccr.layer_5_size_id = cs5.size_id
    WHERE ccr.request_id = p_request_id AND ccr.layer_5_flavor_id IS NOT NULL;

    -- Images
    SELECT *
    FROM custom_cake_request_images
    WHERE request_id = p_request_id
    ORDER BY image_type, view_angle;
END//

DELIMITER ;

-- ============================================================================
-- 8. SAMPLE DATA (FOR TESTING)
-- ============================================================================

-- Insert a sample QR session
INSERT INTO qr_code_sessions (session_token, qr_code_data, editor_url, kiosk_id, status, expires_at) VALUES
('sample-session-token-123', 'https://goldenmunch.com/custom-cake?session=sample-session-token-123', 'https://goldenmunch.com/custom-cake-editor?session=sample-session-token-123', 'KIOSK-001', 'active', DATE_ADD(NOW(), INTERVAL 30 MINUTE));

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

SELECT 'Custom Cake Request System - Database Migration Completed Successfully!' as Status;
SELECT COUNT(*) as qr_sessions FROM qr_code_sessions;
SELECT COUNT(*) as custom_requests FROM custom_cake_request;
SELECT COUNT(*) as request_images FROM custom_cake_request_images;
