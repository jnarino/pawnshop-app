-- 0001_init_all.sql
-- One-time bootstrap: auth/users/customers + inventory categories/items + pawn tickets (no enums for ticket type).
-- Idempotent where possible.

-------------------------
-- Extensions
-------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS ltree;

-----------------------
-- Roles / Users / Auth
-----------------------
CREATE TABLE IF NOT EXISTS role (
  id SMALLINT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL
);

INSERT INTO role (id, name) VALUES
  (1, 'admin'),
  (2, 'manager'),
  (3, 'sales_associate')
ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS app_user (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  first_name TEXT NOT NULL,
  middle_name TEXT,
  last_name TEXT NOT NULL,
  street_address TEXT,
  suite_number TEXT,
  city TEXT,
  state_us TEXT,
  zip_code TEXT,
  phone_number TEXT,
  ss_number TEXT,
  birth_date DATE,
  starting_date DATE NOT NULL DEFAULT CURRENT_DATE,
  terminated_date DATE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS app_user_name_idx
  ON app_user (last_name, first_name);

CREATE TABLE IF NOT EXISTS app_user_role (
  user_id UUID REFERENCES app_user(id) ON DELETE CASCADE,
  role_id SMALLINT REFERENCES role(id) ON DELETE RESTRICT,
  PRIMARY KEY (user_id, role_id)
);

CREATE TABLE IF NOT EXISTS session (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS session_user_idx ON session(user_id);

CREATE TABLE IF NOT EXISTS customer (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL,
  middle_name TEXT,
  last_name TEXT NOT NULL,
  suffix TEXT,
  date_of_birth DATE NOT NULL,
  sex TEXT,
  eye_color TEXT,
  height TEXT,
  street_address TEXT,
  city TEXT,
  state_us TEXT,
  zip_code TEXT,
  id_number TEXT,
  ss_number TEXT,
  id_expiration DATE,
  id_issue_date DATE,
  issuing_state TEXT,
  phone_number TEXT,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS customer_name_idx ON customer (last_name, first_name);
CREATE INDEX IF NOT EXISTS customer_dob_idx  ON customer (date_of_birth);

-- Seed admin (replace hash with your Argon2id)
INSERT INTO app_user (username, password_hash, first_name, last_name, is_active)
VALUES ('admin',
        '$argon2id$v=19$m=65536,t=3,p=4$oMsE07oMFJ3aaU5sjkoxmA$E+zNFg6jX8oOT1sqf647JfRRWo956qHXGnTo8zdV7YM',
        'System','Admin', TRUE)
ON CONFLICT (username) DO NOTHING;

INSERT INTO app_user_role (user_id, role_id)
SELECT u.id, 1 FROM app_user u WHERE u.username = 'admin'
ON CONFLICT DO NOTHING;

---------------------------------
-- Shared updated_at trigger func
---------------------------------
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

---------------------------------------
-- Inventory: hierarchical categories --
---------------------------------------
CREATE TABLE IF NOT EXISTS inventory_category (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT NOT NULL,                       
  parent_id UUID REFERENCES inventory_category(id) ON DELETE CASCADE,
  path LTREE,                              
  depth INT GENERATED ALWAYS AS (nlevel(path)) STORED,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), 
  CONSTRAINT inventory_category_unique_sibling UNIQUE (parent_id, name),
  CONSTRAINT inventory_category_code_sibling   UNIQUE (parent_id, code)
);

CREATE TRIGGER trg_inventory_category_updated
BEFORE UPDATE ON inventory_category
FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

CREATE OR REPLACE FUNCTION inventory_category_set_path()
RETURNS TRIGGER AS $$
DECLARE
  parent_path ltree;
BEGIN
  IF NEW.parent_id IS NULL THEN
    NEW.path := replace(NEW.code, '-', '_')::ltree;
  ELSE
    SELECT path INTO parent_path FROM inventory_category WHERE id = NEW.parent_id;
    NEW.path := parent_path || replace(NEW.code, '-', '_')::ltree;
  END IF;
  RETURN NEW;
END $$ LANGUAGE plpgsql;

CREATE TRIGGER trg_inventory_category_path_ins
BEFORE INSERT ON inventory_category
FOR EACH ROW EXECUTE PROCEDURE inventory_category_set_path();

CREATE TRIGGER trg_inventory_category_path_upd
BEFORE UPDATE OF parent_id, code ON inventory_category
FOR EACH ROW EXECUTE PROCEDURE inventory_category_set_path();

CREATE INDEX IF NOT EXISTS inventory_category_path_gist ON inventory_category USING GIST (path);
CREATE INDEX IF NOT EXISTS inventory_category_parent_idx ON inventory_category(parent_id);

------------------------------------
-- Inventory: item status (lookup) --
------------------------------------
CREATE TABLE IF NOT EXISTS inventory_item_status (
  code TEXT PRIMARY KEY,          -- e.g., 'in_inventory', 'for_sale', 'sold'
  description TEXT,
  is_terminal BOOLEAN NOT NULL DEFAULT false,
  sort_order INT NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_inventory_item_status_updated
BEFORE UPDATE ON inventory_item_status
FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

INSERT INTO inventory_item_status(code, description, is_terminal, sort_order)
VALUES
  ('in_inventory','Item physically in inventory', false, 10),
  ('in_pawn','Item pledged / on active pawn ticket', false, 20),
  ('for_sale','Item available for sale', false, 30),
  ('sold','Item sold / ownership transferred', true, 40),
  ('scrapped','Item disposed / written off', true, 50)
ON CONFLICT DO NOTHING;

-----------------------------
-- Inventory: inventory_item
-----------------------------
CREATE TABLE IF NOT EXISTS inventory_item (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- single leaf category reference
  category_id UUID NOT NULL REFERENCES inventory_category(id) ON DELETE RESTRICT,

  status TEXT NOT NULL DEFAULT 'in_inventory' REFERENCES inventory_item_status(code),
  brand TEXT,
  model TEXT,
  serial_number TEXT,
  color TEXT,
  item_condition TEXT,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  amount NUMERIC(12,2),
  resale NUMERIC(12,2),
  item_replace NUMERIC(12,2),
  bin_number TEXT,
  owner_tag TEXT,
  item_description TEXT,
  attributes JSONB NOT NULL DEFAULT '{}'::jsonb, 
  inventory_number TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
);

-- Constraints & indexes
CREATE UNIQUE INDEX IF NOT EXISTS inventory_item_serial_unique
  ON inventory_item(serial_number) WHERE serial_number IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS inventory_item_number_unique
  ON inventory_item(inventory_number);

CREATE INDEX IF NOT EXISTS inventory_item_category_idx      ON inventory_item(category_id);
CREATE INDEX IF NOT EXISTS inventory_item_status_idx        ON inventory_item(status);
CREATE INDEX IF NOT EXISTS inventory_item_brand_model_idx   ON inventory_item(brand, model);

CREATE TRIGGER trg_inventory_item_updated
BEFORE UPDATE ON inventory_item
FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

-------------------------
-- Pawn tickets (lookup type, no enum)
-------------------------
CREATE TABLE IF NOT EXISTS pawn_transaction_type (
  code TEXT PRIMARY KEY,        
  description TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_pawn_transaction_type_updated
BEFORE UPDATE ON pawn_transaction_type
FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

INSERT INTO pawn_transaction_type(code, description, sort_order) VALUES
  ('PAWN','Collateralized loan (pawn)', 10),
  ('PURCHASE','Outright purchase', 20)
ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS pawn_ticket (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  control_number TEXT,                     
  transaction_type TEXT NOT NULL REFERENCES pawn_transaction_type(code),
  customer_id UUID NOT NULL REFERENCES customer(id) ON DELETE RESTRICT,
  amount_financed NUMERIC(12,2),
  finance_charge NUMERIC(12,2),
  periodic_rate NUMERIC(6,4),
  total_of_payments NUMERIC(12,2),
  apr NUMERIC(9,2),
  purchase_trade_value NUMERIC(12,2),
  transaction_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  maturity_date TIMESTAMPTZ NOT NULL,
  default_date TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT pawn_ticket_finance_charge_min CHECK (finance_charge IS NULL OR finance_charge >= 5.00),
  CONSTRAINT pawn_ticket_amount_consistency CHECK (
    (transaction_type = 'PAWN'
      AND amount_financed IS NOT NULL AND finance_charge IS NOT NULL
      AND periodic_rate IS NOT NULL AND total_of_payments IS NOT NULL AND apr IS NOT NULL
      AND purchase_trade_value IS NULL)
    OR
    (transaction_type = 'PURCHASE'
      AND purchase_trade_value IS NOT NULL
      AND amount_financed IS NULL AND finance_charge IS NULL
      AND periodic_rate IS NULL AND total_of_payments IS NULL AND apr IS NULL)
  )
);

CREATE INDEX IF NOT EXISTS pawn_ticket_customer_idx     ON pawn_ticket(customer_id);
CREATE INDEX IF NOT EXISTS pawn_ticket_type_idx         ON pawn_ticket(transaction_type);
CREATE INDEX IF NOT EXISTS pawn_ticket_transaction_idx  ON pawn_ticket(transaction_date);

CREATE TABLE IF NOT EXISTS pawn_ticket_item (
  pawn_ticket_id UUID REFERENCES pawn_ticket(id) ON DELETE CASCADE,
  inventory_item_id UUID REFERENCES inventory_item(id) ON DELETE RESTRICT,
  PRIMARY KEY (pawn_ticket_id, inventory_item_id)
);

CREATE OR REPLACE FUNCTION trg_set_updated_at_pawn_ticket()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

CREATE TRIGGER pawn_ticket_updated
BEFORE UPDATE ON pawn_ticket
FOR EACH ROW EXECUTE PROCEDURE trg_set_updated_at_pawn_ticket();
