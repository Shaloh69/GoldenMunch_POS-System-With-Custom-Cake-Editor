-- ============================================================================
-- MIGRATION: Add Analytics Stored Procedures
-- Description: Add missing stored procedures for analytics endpoints
-- Date: 2025-12-17
-- ============================================================================

USE defaultdb;

-- Drop procedures if they exist
DROP PROCEDURE IF EXISTS GetTrendingItems;
DROP PROCEDURE IF EXISTS GetWasteReport;
DROP PROCEDURE IF EXISTS RecalculatePopularityScore;

DELIMITER //

-- ============================================================================
-- Procedure: Get Trending Items
-- Description: Get the most popular menu items based on recent orders
-- Parameters:
--   - p_days: Number of days to look back (default: 7)
--   - p_limit: Maximum number of items to return (default: 10)
-- ============================================================================
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
    WHERE co.created_at >= DATE_SUB(CURDATE(), INTERVAL v_days DAY)
        AND co.payment_status = 'paid'
        AND mi.status = 'available'
    GROUP BY mi.menu_item_id
    HAVING recent_orders > 0
    ORDER BY recent_revenue DESC, recent_orders DESC, mi.popularity_score DESC
    LIMIT v_limit;
END//

-- ============================================================================
-- Procedure: Get Waste Report
-- Description: Get waste statistics for a date range
-- Parameters:
--   - p_start_date: Start date (YYYY-MM-DD)
--   - p_end_date: End date (YYYY-MM-DD)
-- ============================================================================
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
        SUM(wt.quantity) as total_items_wasted,
        SUM(wt.estimated_value) as total_waste_cost,
        AVG(wt.estimated_value) as avg_waste_cost,
        SUM(CASE WHEN wt.waste_reason = 'expired' THEN wt.quantity ELSE 0 END) as expired_items,
        SUM(CASE WHEN wt.waste_reason = 'damaged' THEN wt.quantity ELSE 0 END) as damaged_items,
        SUM(CASE WHEN wt.waste_reason = 'spoiled' THEN wt.quantity ELSE 0 END) as spoiled_items,
        SUM(CASE WHEN wt.waste_reason = 'overproduction' THEN wt.quantity ELSE 0 END) as overproduced_items
    FROM waste_tracking wt
    WHERE wt.waste_date BETWEEN v_start_date AND v_end_date;
END//

-- ============================================================================
-- Procedure: Recalculate Popularity Score
-- Description: Recalculate popularity scores for all menu items based on recent sales
-- Parameters:
--   - p_days: Number of days to consider for calculation (default: 30)
-- ============================================================================
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
        WHERE co.created_at >= DATE_SUB(CURDATE(), INTERVAL v_days DAY)
            AND co.payment_status = 'paid'
        GROUP BY oi.menu_item_id
    ) stats ON mi.menu_item_id = stats.menu_item_id
    SET mi.popularity_score = COALESCE(
        (stats.order_count * 10) + (stats.total_quantity * 2) + (stats.total_revenue / 100),
        0
    );

    -- Log the update
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
        WHERE co.created_at >= DATE_SUB(CURDATE(), INTERVAL v_days DAY)
            AND co.payment_status = 'paid'
        GROUP BY oi.menu_item_id
    ) stats ON mi.menu_item_id = stats.menu_item_id;

    SELECT CONCAT('Popularity scores recalculated for ', ROW_COUNT(), ' items') as message;
END//

DELIMITER ;

-- ============================================================================
-- Verification
-- ============================================================================

-- Show created procedures
SELECT
    ROUTINE_NAME as procedure_name,
    CREATED as created_at
FROM information_schema.ROUTINES
WHERE ROUTINE_SCHEMA = 'defaultdb'
    AND ROUTINE_TYPE = 'PROCEDURE'
    AND ROUTINE_NAME IN ('GetTrendingItems', 'GetWasteReport', 'RecalculatePopularityScore')
ORDER BY ROUTINE_NAME;

SELECT '✅ Analytics stored procedures created successfully!' as status;
