-- 0006: Add inventory_number to inventory_item and unique index
-- Purpose: Tie inventory items to pawn ticket control numbers with pattern <controlNumber>-<sequence>
-- Existing rows get NULL (will be backfilled when associated to a pawn ticket if desired)

ALTER TABLE inventory_item ADD COLUMN IF NOT EXISTS inventory_number TEXT;

-- Ensure uniqueness of assigned numbers while allowing NULL for unassigned
CREATE UNIQUE INDEX IF NOT EXISTS inventory_item_number_unique ON inventory_item(inventory_number) WHERE inventory_number IS NOT NULL;
