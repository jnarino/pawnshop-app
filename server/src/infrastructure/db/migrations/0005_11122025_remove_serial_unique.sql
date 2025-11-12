-- Remove unique constraint on inventory_item.serial_number
-- This allows duplicate serial numbers which is common in pawn shops
-- (many items have no serial, or manufacturers reuse serials across product lines)

-- Drop the unique index
DROP INDEX IF EXISTS inventory_item_serial_unique;

-- Add a regular index for performance (serial lookups are still common)
CREATE INDEX IF NOT EXISTS idx_inventory_item_serial 
  ON inventory_item(serial_number) 
  WHERE serial_number IS NOT NULL AND serial_number != '';
