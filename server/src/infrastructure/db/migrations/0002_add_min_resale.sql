-- Add minimum resale value column for inventory items
ALTER TABLE inventory_item 
ADD COLUMN IF NOT EXISTS min_resale NUMERIC(12,2);

COMMENT ON COLUMN inventory_item.price_amount IS 'Amount financed/loaned to customer or purchase price paid';
COMMENT ON COLUMN inventory_item.resale IS 'Expected resale/retail price';
COMMENT ON COLUMN inventory_item.min_resale IS 'Minimum acceptable resale price (floor)';
COMMENT ON COLUMN inventory_item.item_replace IS 'Replacement cost for insurance purposes';
