-- Migration: Fix v_approved_custom_cakes view to include missing fields
-- Date: 2026-01-22
-- Description: Add preparation_days, special_instructions, and status fields to the view

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
    ccr.preparation_days,
    ccr.special_instructions,
    ccr.status,
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
