-- Migration 0003: Rename column 'type' on inventory_item to 'inventory_item_type'
-- Rationale: avoid generic/keyword column name; increase clarity.

ALTER TABLE inventory_item
  RENAME COLUMN type TO inventory_item_type;

-- Down migration (manual): RENAME COLUMN inventory_item_type BACK TO type;
