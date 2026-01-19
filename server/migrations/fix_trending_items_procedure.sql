-- Migration: Fix GetTrendingItems stored procedure
-- Purpose: Fix column reference from mi.item_type to join with menu_item_type table
-- Date: 2026-01-19
-- Issue: Unknown column 'mi.item_type' in 'field list'

-- Drop and recreate the GetTrendingItems procedure with correct joins
DROP PROCEDURE IF EXISTS GetTrendingItems;

DELIMITER //

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
    -- FIXED: Added join with menu_item_type to get item_type name
    SELECT
        mi.menu_item_id,
        mi.name,
        mit.name as item_type,
        mi.popularity_score,
        COUNT(DISTINCT oi.order_id) as recent_orders,
        SUM(oi.quantity) as recent_quantity,
        SUM(oi.subtotal) as recent_revenue,
        AVG(oi.unit_price) as avg_price
    FROM menu_item mi
    LEFT JOIN menu_item_type mit ON mi.item_type_id = mit.type_id
    LEFT JOIN order_item oi ON mi.menu_item_id = oi.menu_item_id
    LEFT JOIN customer_order co ON oi.order_id = co.order_id
    WHERE COALESCE(co.order_datetime, co.created_at) >= DATE_SUB(CURDATE(), INTERVAL v_days DAY)
        AND co.payment_status = 'paid'
        AND co.is_deleted = FALSE
        AND mi.status = 'available'
    GROUP BY mi.menu_item_id, mi.name, mit.name, mi.popularity_score
    HAVING recent_orders > 0
    ORDER BY recent_revenue DESC, recent_orders DESC, mi.popularity_score DESC
    LIMIT v_limit;
END//

DELIMITER ;
