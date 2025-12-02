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
