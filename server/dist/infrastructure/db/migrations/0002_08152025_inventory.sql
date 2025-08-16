-- 0002 revised to include hierarchical categories and renamed columns (reserved words avoidance)

CREATE TYPE inventory_item_type AS ENUM ('FIREARM', 'JEWELRY', 'GENERIC');
-- Updated statuses: in_inventory, in_pawn, for_sale, sold, scrapped
CREATE TYPE inventory_item_status AS ENUM ('in_inventory','in_pawn','for_sale','sold','scrapped');

-- Category table (self-referential for unlimited depth)
CREATE TABLE inventory_category (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  parent_id UUID REFERENCES inventory_category(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS inventory_category_parent_idx ON inventory_category(parent_id);

-- Inventory items
CREATE TABLE inventory_item (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type inventory_item_type NOT NULL,
  status inventory_item_status NOT NULL DEFAULT 'in_inventory',
  category_id UUID REFERENCES inventory_category(id) ON DELETE SET NULL,
  subcategory_id UUID REFERENCES inventory_category(id) ON DELETE SET NULL, -- optional explicit subcategory linkage
  brand TEXT,
  model TEXT,
  serial_number TEXT,
  color TEXT,
  item_condition TEXT,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  amount NUMERIC(12,2),
  resale NUMERIC(12,2),
  item_replace NUMERIC(12,2),
  bin TEXT,
  owner_tag TEXT,
  item_description TEXT,
  firearm_attributes JSONB,
  jewelry_attributes JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT inventory_item_subcategory_parent CHECK (subcategory_id IS NULL OR category_id IS NULL OR subcategory_id <> category_id)
);

CREATE INDEX IF NOT EXISTS inventory_item_type_idx ON inventory_item(type);
CREATE INDEX IF NOT EXISTS inventory_item_status_idx ON inventory_item(status);
CREATE INDEX IF NOT EXISTS inventory_item_brand_model_idx ON inventory_item(brand, model);
CREATE UNIQUE INDEX IF NOT EXISTS inventory_item_serial_unique ON inventory_item(serial_number) WHERE serial_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS inventory_item_category_idx ON inventory_item(category_id, subcategory_id);

-- trigger to auto-update updated_at timestamp (shared)
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_inventory_item_updated
BEFORE UPDATE ON inventory_item
FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

CREATE TRIGGER trg_inventory_category_updated
BEFORE UPDATE ON inventory_category
FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
