-- Migration 0004: Replace enum inventory_item_status with lookup table for extensibility
-- Steps:
-- 1. Create lookup table inventory_item_status_lu
-- 2. Seed existing statuses
-- 3. Copy enum column values to new text column with FK
-- 4. Drop enum column & type, rename new column to status
-- (Transaction is managed by migration runner; no explicit BEGIN/COMMIT here)

CREATE TABLE inventory_item_status_lu (
  code TEXT PRIMARY KEY,
  description TEXT,
  is_terminal BOOLEAN NOT NULL DEFAULT false,
  sort_order INT NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ensure updated_at trigger function exists (idempotent)
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

CREATE TRIGGER trg_inventory_item_status_lu_updated
BEFORE UPDATE ON inventory_item_status_lu
FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

INSERT INTO inventory_item_status_lu(code, description, is_terminal, sort_order)
VALUES
  ('in_inventory','Item physically in inventory', false, 10),
  ('in_pawn','Item pledged / on active pawn ticket', false, 20),
  ('for_sale','Item available for sale', false, 30),
  ('sold','Item sold / ownership transferred', true, 40),
  ('scrapped','Item disposed / written off', true, 50);

-- Add new text column to hold status codes
ALTER TABLE inventory_item ADD COLUMN status_text TEXT;

-- Copy existing enum values
UPDATE inventory_item SET status_text = status::text;

-- Enforce NOT NULL + default
ALTER TABLE inventory_item ALTER COLUMN status_text SET DEFAULT 'in_inventory';
ALTER TABLE inventory_item ALTER COLUMN status_text SET NOT NULL;

-- Foreign key to lookup
ALTER TABLE inventory_item ADD CONSTRAINT fk_inventory_item_status FOREIGN KEY (status_text) REFERENCES inventory_item_status_lu(code);

-- Drop old index and recreate on new column (if it existed)
DROP INDEX IF EXISTS inventory_item_status_idx;
CREATE INDEX inventory_item_status_idx ON inventory_item(status_text);

-- Drop old enum column and type
ALTER TABLE inventory_item DROP COLUMN status;
ALTER TABLE inventory_item RENAME COLUMN status_text TO status;

-- Drop enum type now unused
DROP TYPE IF EXISTS inventory_item_status;
