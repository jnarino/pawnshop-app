-- =========================================
-- 001_initial_schema.sql
-- Full clean schema for PawnExpress with colors + attribute dictionary
-- Idempotent DDL where possible
-- =========================================

-----------------------
-- Extensions
-----------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS ltree;

-----------------------
-- Shared updated_at trigger func
-----------------------
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

---------------------------------------
-- Inventory category path helper
---------------------------------------
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

-----------------------
-- Roles / Users / Auth
-----------------------
CREATE TABLE IF NOT EXISTS role (
  id   SMALLINT PRIMARY KEY,
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
  role_id SMALLINT NOT NULL REFERENCES role(id),
  legacy_usr_pk BIGINT,
  legacy_usr_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS app_user_name_idx ON app_user (last_name, first_name);

CREATE TABLE IF NOT EXISTS app_user_session (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  revoked_at TIMESTAMPTZ,
  refresh_token_hash TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS app_user_session_user_idx ON app_user_session(user_id);
CREATE INDEX IF NOT EXISTS app_user_session_refresh_hash_idx ON app_user_session(refresh_token_hash);

-----------------------
-- Customer
-----------------------
CREATE TABLE IF NOT EXISTS customer (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Legacy linkage
  old_customer_pk     TEXT,
  old_customer_id     TEXT,

  -- Person
  first_name          TEXT NOT NULL,
  middle_name         TEXT,
  last_name           TEXT NOT NULL,
  street_address      TEXT,
  suite_number        TEXT,
  city                TEXT,
  state_us            TEXT,
  zip_code            TEXT,
  phone_number        TEXT,
  height              TEXT,
  weight              TEXT,
  hair_color          TEXT,
  eye_color           TEXT,
  race                TEXT,
  sex                 TEXT,
  marks               TEXT,
  date_of_birth       DATE,
  birth_city          TEXT,
  birth_state         TEXT,
  birth_country       TEXT,

  -- Identification
  id_type             TEXT,
  id_number           TEXT,
  id_expiration       DATE,
  id_issue_date       DATE,
  ss_number           TEXT,
  id_address          TEXT,
  id_suite_number     TEXT,
  id_city             TEXT,
  id_state            TEXT,
  id_zip              TEXT,

  -- Employer
  employer_name         TEXT,
  employer_address      TEXT,
  employer_suite_number TEXT,
  employer_city         TEXT,
  employer_state        TEXT,
  employer_zip          TEXT,
  employer_phone_number TEXT,

  -- Misc / compliance
  description            TEXT,
  ffl_number             TEXT,
  locked                 BOOLEAN DEFAULT FALSE,
  tax_id                 TEXT,
  cell_phone             TEXT,
  email                  TEXT,
  entered_at             TIMESTAMPTZ,
  military               BOOLEAN DEFAULT FALSE,
  ffl_expire_date        DATE,
  tax_exempt             BOOLEAN DEFAULT FALSE,
  tax_exempt_certificate TEXT,

  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS customer_name_idx ON customer (last_name, first_name);
CREATE INDEX IF NOT EXISTS customer_dob_idx  ON customer (date_of_birth);

-------------------------------
-- Inventory: Category / Subcategory / Brand
-------------------------------
CREATE TABLE IF NOT EXISTS inventory_category (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS trg_inventory_category_updated ON inventory_category;
CREATE TRIGGER trg_inventory_category_updated
BEFORE UPDATE ON inventory_category
FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

CREATE TABLE IF NOT EXISTS inventory_subcategory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_category_id UUID NOT NULL REFERENCES inventory_category(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT inventory_subcategory_unique_code UNIQUE (inventory_category_id, code)
);

DROP TRIGGER IF EXISTS trg_inventory_subcategory_updated ON inventory_subcategory;
CREATE TRIGGER trg_inventory_subcategory_updated
BEFORE UPDATE ON inventory_subcategory
FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

CREATE TABLE IF NOT EXISTS inventory_brand (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_category_id UUID NOT NULL REFERENCES inventory_category(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT inventory_brand_unique_code UNIQUE (inventory_category_id, code)
);

DROP TRIGGER IF EXISTS trg_inventory_brand_updated ON inventory_brand;
CREATE TRIGGER trg_inventory_brand_updated
BEFORE UPDATE ON inventory_brand
FOR EACH ROW EXECUTE PROCEDURE set_updated_at();


------------------------------------
-- Inventory status (letter codes)
------------------------------------
CREATE TABLE IF NOT EXISTS inventory_status (
  code TEXT PRIMARY KEY,     -- 'B','C','D','H','I','J','L','O','P','S','T','U','V'
  description TEXT,
  is_terminal BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order INT NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS trg_inventory_status_updated ON inventory_status;
CREATE TRIGGER trg_inventory_status_updated
BEFORE UPDATE ON inventory_status
FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

INSERT INTO inventory_status(code, description, sort_order)
VALUES
  ('B', 'Purchased', 10),
  ('C', 'Confiscation', 20),
  ('D', 'Deleted', 30),
  ('H', 'Police Hold', 40),
  ('I', 'Inventory', 50),  -- default for new items
  ('J', 'Scrapped', 60),
  ('L', 'Layaway', 70),
  ('O', 'Police Hold', 80),
  ('P', 'Pawn', 90),
  ('S', 'Sold', 100),
  ('T', 'Transferred', 110),
  ('U', 'Redeemed', 120),
  ('V', 'Voided', 130)
ON CONFLICT DO NOTHING;

------------------------------------
-- Item Attributes: Types & Values
------------------------------------

-----------------------------
-- Inventory: Attributes
-----------------------------
CREATE TABLE IF NOT EXISTS item_attribute_type (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL UNIQUE,
    description text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS item_attribute_value (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    attribute_type_id uuid NOT NULL REFERENCES item_attribute_type(id) ON DELETE CASCADE,
    value text NOT NULL,
    sort_order integer DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE(attribute_type_id, value)
);

CREATE INDEX IF NOT EXISTS idx_item_attribute_value_type ON item_attribute_value(attribute_type_id);

-----------------------------
-- Inventory: inventory_item
-----------------------------
CREATE TABLE IF NOT EXISTS inventory_item (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  inventory_subcategory_id UUID NOT NULL REFERENCES inventory_subcategory(id) ON DELETE RESTRICT,
  inventory_brand_id UUID REFERENCES inventory_brand(id) ON DELETE RESTRICT,

  status TEXT NOT NULL DEFAULT 'I' REFERENCES inventory_status(code),

  model TEXT,
  serial_number TEXT,
  color UUID REFERENCES item_attribute_value(id) ON DELETE SET NULL,
  item_condition TEXT,

  quantity NUMERIC(12,2) NOT NULL DEFAULT 1 CHECK (quantity >= 0),

  price_amount NUMERIC(12,2),
  resale NUMERIC(12,2),
  min_resale NUMERIC(12,2),
  item_replace NUMERIC(12,2),

  owner_mark TEXT,
  item_description TEXT,

  -- New fields
  bin_location TEXT,
  storage_fee NUMERIC(12,2) DEFAULT 0,
  extra JSONB NOT NULL DEFAULT '{}'::jsonb,
  attributes JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Legacy linkages
  legacy_inventory_number TEXT,
  legacy_item_guid TEXT,
  legacy_category_description TEXT,
  legacy_brand_color_description TEXT,

  inventory_number TEXT UNIQUE,

  last_updated_user_id UUID REFERENCES app_user(id) ON DELETE SET NULL,

  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS inventory_item_subcategory_idx ON inventory_item(inventory_subcategory_id);
CREATE INDEX IF NOT EXISTS inventory_item_brand_idx ON inventory_item(inventory_brand_id);
CREATE INDEX IF NOT EXISTS inventory_item_status_idx   ON inventory_item(status);
CREATE INDEX IF NOT EXISTS inventory_item_model_idx ON inventory_item(model);

DROP TRIGGER IF EXISTS trg_inventory_item_updated ON inventory_item;
CREATE TRIGGER trg_inventory_item_updated
BEFORE UPDATE ON inventory_item
FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

-------------------------
-- Pawn transaction types (lookup)
-------------------------
CREATE TABLE IF NOT EXISTS pawn_transaction_type (
  code TEXT PRIMARY KEY,      -- 'PAWN' | 'PURCHASE'
  description TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
DROP TRIGGER IF EXISTS trg_pawn_transaction_type_updated ON pawn_transaction_type;
CREATE TRIGGER trg_pawn_transaction_type_updated
BEFORE UPDATE ON pawn_transaction_type
FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

INSERT INTO pawn_transaction_type(code, description, sort_order) VALUES
  ('PAWN','Collateralized loan (pawn)', 10),
  ('PURCHASE','Outright purchase', 20)
ON CONFLICT DO NOTHING;

-----------------------
-- Rate Plan
-----------------------
CREATE TABLE IF NOT EXISTS rate_plan (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  period_days INT NOT NULL,                 -- e.g., 30
  grace_days INT NOT NULL DEFAULT 0,        -- e.g., 30 (total 60 days to default)
  periodic_rate NUMERIC(9,4) NOT NULL,      -- e.g., 0.2500 (=25% per 30 days)
  min_finance_charge NUMERIC(12,2) NOT NULL DEFAULT 0,
  extend_on_interest_payment BOOLEAN NOT NULL DEFAULT TRUE,
  extension_days_per_payment INT NOT NULL DEFAULT 30,
  max_extensions INT,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
DROP TRIGGER IF EXISTS trg_rate_plan_updated ON rate_plan;
CREATE TRIGGER trg_rate_plan_updated
BEFORE UPDATE ON rate_plan
FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

INSERT INTO rate_plan(name, period_days, grace_days, periodic_rate, min_finance_charge)
VALUES ('FL 30/30 @25%', 30, 30, 0.2500, 5.00)
ON CONFLICT (name) DO NOTHING;

-------------------------
-- Pawn ticket status
-------------------------
CREATE TABLE IF NOT EXISTS pawn_ticket_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status TEXT NOT NULL,
  description TEXT,
  transaction_type TEXT NOT NULL REFERENCES pawn_transaction_type(code),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(status, transaction_type)
);

DROP TRIGGER IF EXISTS trg_pawn_ticket_status_updated ON pawn_ticket_status;
CREATE TRIGGER trg_pawn_ticket_status_updated
BEFORE UPDATE ON pawn_ticket_status
FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

-- Seed Statuses
-- Seed Statuses
INSERT INTO pawn_ticket_status (status, description, transaction_type, is_active) VALUES
  -- PAWN statuses
  ('U', 'Redeem', 'PAWN', true),
  ('D', 'Defaulted', 'PAWN', false),
  ('H', 'Police Hold', 'PAWN', true),
  ('C', 'Confiscation', 'PAWN', false),
  ('V', 'Voided', 'PAWN', false),
  ('P', 'Pawn', 'PAWN', true), 
  
  -- PURCHASE statuses
  ('B', 'Buy', 'PURCHASE', true),
  ('I', 'Inventory', 'PURCHASE', true),
  ('V', 'Voided', 'PURCHASE', false),
  ('H', 'Police Hold', 'PURCHASE', true),
  ('C', 'Confiscation', 'PURCHASE', false)
ON CONFLICT (status, transaction_type) DO NOTHING;

-------------------------
-- Pawn tickets
-------------------------
CREATE TABLE IF NOT EXISTS pawn_ticket (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  control_number TEXT NOT NULL,
  transaction_type TEXT NOT NULL REFERENCES pawn_transaction_type(code),
  customer_id UUID NOT NULL REFERENCES customer(id) ON DELETE RESTRICT,

  amount_financed NUMERIC(12,2),
  original_pawn_amount NUMERIC(12,2),
  finance_charge NUMERIC(12,2),
  periodic_rate NUMERIC(6,4),
  total_of_payments NUMERIC(12,2),
  apr NUMERIC(9,2),
  purchase_trade_value NUMERIC(12,2),

  transaction_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  maturity_date TIMESTAMPTZ NOT NULL,
  default_date TIMESTAMPTZ NOT NULL,

  rate_plan_id UUID REFERENCES rate_plan(id) ON DELETE RESTRICT,
  paid_through_date DATE,
  next_charge_date DATE,
  interest_credit NUMERIC(12,2) NOT NULL DEFAULT 0,

  last_payment_at TIMESTAMPTZ,
  last_activity_at TIMESTAMPTZ,
  default_marked_at TIMESTAMPTZ,
  default_marked_by UUID REFERENCES app_user(id) ON DELETE SET NULL,
  default_reason TEXT,

  status_id UUID NOT NULL REFERENCES pawn_ticket_status(id),
  created_by UUID REFERENCES app_user(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT pawn_ticket_finance_charge_min
    CHECK (finance_charge IS NULL OR finance_charge >= 0.00),

  CONSTRAINT pawn_ticket_amount_consistency CHECK (
    (transaction_type = 'PAWN'
      AND amount_financed IS NOT NULL AND periodic_rate IS NOT NULL
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
CREATE INDEX IF NOT EXISTS idx_pawn_ticket_status_id    ON pawn_ticket(status_id);
CREATE INDEX IF NOT EXISTS idx_pawn_ticket_last_payment ON pawn_ticket(last_payment_at);
CREATE INDEX IF NOT EXISTS idx_pawn_ticket_control_num  ON pawn_ticket(control_number);

DROP TRIGGER IF EXISTS pawn_ticket_updated ON pawn_ticket;
CREATE TRIGGER pawn_ticket_updated
BEFORE UPDATE ON pawn_ticket
FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

CREATE TABLE IF NOT EXISTS pawn_ticket_item (
  pawn_ticket_id UUID REFERENCES pawn_ticket(id) ON DELETE CASCADE,
  inventory_item_id UUID REFERENCES inventory_item(id) ON DELETE RESTRICT,
  PRIMARY KEY (pawn_ticket_id, inventory_item_id)
);

-----------------------------------
-- Store Transactions (header + tenders + lines)
-----------------------------------
CREATE TABLE IF NOT EXISTS store_transaction_type (
  id SMALLINT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,        -- e.g., 'RETAIL_SALE'
  legacy_code TEXT UNIQUE,          
  name TEXT NOT NULL,
  cash_dir SMALLINT NOT NULL DEFAULT 0 CHECK (cash_dir IN (-1,0,1)),
  active BOOLEAN NOT NULL DEFAULT TRUE
);

INSERT INTO store_transaction_type (id, code, legacy_code, name, cash_dir, active) VALUES
  -- Unknown/adjustments 
  (1 , 'ASF', 'ASF', 'ADJUSTMENT (store/fee?)',                 0, TRUE), 
  (2 , 'ASL', 'ASL', 'ADJUSTMENT (sale/ledger?)',               0, TRUE), 

  -- Buy / Pawn
  (3, 'B'  , 'B'  , 'BUY (cash out to seller)',               -1, TRUE),
  (4, 'BV' , 'BV' , 'VOIDED BUY (reverse)',                   +1, TRUE),
  (5, 'P'  , 'P'  , 'PAWN (loan cash out)',                   -1, TRUE),
  (6, 'PD' , 'PD' , 'PAWN DEFAULTED (status)',                 0, TRUE),
  (7, 'PPP', 'PPP', 'PAWN PAYMENT (interest/principal)',      +1, TRUE),
  (8, 'PPU', 'PPU', 'REDEMPTION PAYMENT',                     +1, TRUE),
  (9, 'PV' , 'PV' , 'VOIDED PAWN (reverse loan)',             +1, TRUE),

  -- Retail sales
  (10, 'SS' , 'SS' , 'RETAIL SALE',                            +1, TRUE),
  (11, 'SSV', 'SSV', 'VOIDED SALE',                            -1, TRUE),

  -- Layaway
  (12, 'SL' , 'SL' , 'LAYAWAY DEPOSIT',                        +1, TRUE),
  (13, 'SLD', 'SLD', 'LAYAWAY DEFAULTED (status)',              0, TRUE),
  (14, 'SLP', 'SLP', 'LAYAWAY PAYMENT',                        +1, TRUE),
  (15, 'SLU', 'SLU', 'LAYAWAY PICKUP (close)',                  0, TRUE),
  (16, 'SLV', 'SLV', 'VOIDED LAYAWAY',                         -1, TRUE),
  (17, 'SLX', 'SLX', 'UNDO LAYAWAY PAYMENT',                   -1, TRUE),

  -- Repairs / Service
  (18, 'SF' , 'SF' , 'REPAIR DEPOSIT',                         +1, TRUE),
  (19, 'SFU', 'SFU', 'REPAIR PICKUP (close)',                   0, TRUE),
  (20, 'SFV', 'SFV', 'VOIDED REPAIR',                          -1, TRUE),

  -- Cash management (drawer vs. main/bank)
  (21, 'EB' , 'EB' , 'EMPLOYEE BALANCE (admin)',                0, TRUE),
  (22, 'MA' , 'MA' , 'DEPOSIT FROM MAIN (to drawer)',          +1, TRUE),
  (23, 'MB' , 'MB' , 'MAIN BALANCE (admin)',                    0, TRUE),
  (24, 'MI' , 'MI' , 'CASH ADDED - MAIN (safe/bank op)',        0, TRUE),
  (25, 'MO' , 'MO' , 'CASH OUT - MAIN (from drawer to main)',  -1, TRUE),
  (26, 'MZ' , 'MZ' , 'WITHDRAWAL FROM BANK (to drawer)',       +1, TRUE),

  -- Other
  (27, 'T'  , 'T'  , 'COMMISSION / OTHER (no cash)',            0, TRUE)
ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS tender_type (
  id SMALLINT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  legacy_code TEXT UNIQUE,
  active BOOLEAN NOT NULL DEFAULT TRUE
);

INSERT INTO tender_type(id, name, legacy_code) VALUES
  (1, 'CASH',             '1001'),
  (2, 'AMERICAN EXPRESS', '35001'),
  (3, 'DEBIT',            '36001'),
  (4, 'DISCOVER',         '37001'),
  (5, 'MASTER CARD',      '38001'),
  (6, 'VISA',             '39001'),
  (7, 'CHECK',            '287001'),
  (8, 'CASH PASS',        '1186001')
ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS store_transaction (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- legacy keys for traceability
  legacy_acct_pk TEXT, 
  legacy_acct_id TEXT, 
  legacy_ticketnum TEXT,
  legacy_cus_fk TEXT,
  legacy_usr_fk TEXT,

  customer_id UUID REFERENCES customer(id) ON DELETE SET NULL,
  clerk_user_id UUID REFERENCES app_user(id) ON DELETE SET NULL,

  type_id SMALLINT NOT NULL REFERENCES store_transaction_type(id),
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(), 

  amount NUMERIC(12,2),
  tax_sales NUMERIC(12,2), 
  tax_exempt_used        BOOLEAN NOT NULL DEFAULT FALSE,
  state_tax NUMERIC(12,2), 
  tender_change NUMERIC(12,2), 
  override_amount NUMERIC(12,2),
  gun_proc_fee NUMERIC(12,2),
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  pawn_ticket_id UUID REFERENCES pawn_ticket(id) ON DELETE SET NULL,
  interest_amount NUMERIC(12,2) DEFAULT 0,
  principal_amount NUMERIC(12,2) DEFAULT 0,
  fees_amount NUMERIC(12,2) DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_store_tx_pawn_ticket ON store_transaction(pawn_ticket_id);
CREATE INDEX IF NOT EXISTS idx_store_tx_time     ON store_transaction(occurred_at);
CREATE INDEX IF NOT EXISTS idx_store_tx_type_id  ON store_transaction(type_id);

DROP TRIGGER IF EXISTS trg_store_tx_updated ON store_transaction;
CREATE TRIGGER trg_store_tx_updated
BEFORE UPDATE ON store_transaction
FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

CREATE TABLE IF NOT EXISTS store_transaction_tender (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_transaction_id UUID NOT NULL REFERENCES store_transaction(id) ON DELETE CASCADE,
  sequence SMALLINT NOT NULL DEFAULT 1,
  tender_type_id SMALLINT NOT NULL REFERENCES tender_type(id),
  amount NUMERIC(12,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_store_tx_tender_tx   ON store_transaction_tender(store_transaction_id);
CREATE INDEX IF NOT EXISTS idx_store_tx_tender_type ON store_transaction_tender(tender_type_id);

-----------------------------------
-- Store transaction LINE ITEMS
-----------------------------------
CREATE TABLE IF NOT EXISTS store_transaction_item (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_transaction_id UUID NOT NULL REFERENCES store_transaction(id) ON DELETE CASCADE,
  sequence SMALLINT NOT NULL DEFAULT 1,
  inventory_item_id UUID REFERENCES inventory_item(id) ON DELETE SET NULL,

  description TEXT,
  quantity NUMERIC(12,2) NOT NULL DEFAULT 1,
  line_amount NUMERIC(12,2),
  line_cost NUMERIC(12,2),
  tax_exempt BOOLEAN,
  county_tax_exempt BOOLEAN,
  returned BOOLEAN,
  status TEXT,

  -- legacy linkage
  legacy_sitem_pk BIGINT,
  legacy_items_pk BIGINT,
  legacy_items_guid TEXT,
  legacy_invnum TEXT,
  legacy_vendor_pk BIGINT,
  legacy_from_customer_pk BIGINT,
  legacy_cflag INT,
  legacy_sit_id TEXT,
  legacy_sales_loc TEXT,
  legacy_last_updated_usr TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_store_tx_item_tx        ON store_transaction_item(store_transaction_id);
CREATE INDEX IF NOT EXISTS idx_store_tx_item_inventory ON store_transaction_item(inventory_item_id);


-----------------------
-- Layaway
-----------------------
CREATE TABLE IF NOT EXISTS layaway_agreement (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_store_tx_id UUID NOT NULL UNIQUE REFERENCES store_transaction(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','completed','voided','defaulted')),
  service_charge_percent NUMERIC(9,4),
  service_charge_grace_days INT,
  service_charge_amount NUMERIC(12,2),
  deposit NUMERIC(12,2),
  period_days INT,
  late_fee NUMERIC(12,2),
  message TEXT,
  reminder BOOLEAN,
  county_taxable NUMERIC(12,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
DROP TRIGGER IF EXISTS trg_layaway_agreement_updated ON layaway_agreement;
CREATE TRIGGER trg_layaway_agreement_updated
BEFORE UPDATE ON layaway_agreement
FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

CREATE TABLE IF NOT EXISTS layaway_payment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  layaway_agreement_id UUID NOT NULL REFERENCES layaway_agreement(id) ON DELETE CASCADE,
  store_transaction_id UUID NOT NULL UNIQUE REFERENCES store_transaction(id) ON DELETE CASCADE,
  amount NUMERIC(12,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_layaway_payment_agreement ON layaway_payment(layaway_agreement_id);

-----------------------
-- ATF Bound Book (gunlog)
-----------------------
CREATE TABLE IF NOT EXISTS gunlog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  legacy_gunlog_pk BIGINT,
  gunlog_number INTEGER NOT NULL UNIQUE,
  prev_gunlog_rec BIGINT,
  next_gunlog_rec BIGINT,
  
  inventory_item_id UUID NOT NULL REFERENCES inventory_item(id) ON DELETE CASCADE,

  manufacturer TEXT,
  model TEXT,
  serial TEXT,
  caliber TEXT,
  action TEXT,
  condition TEXT,

  buyer_amount NUMERIC(12,2),
  buyer_date TIMESTAMPTZ,
  buyer_first_name TEXT,
  buyer_middle_name TEXT,
  buyer_last_name TEXT,
  buyer_street_address TEXT,
  buyer_id_address TEXT,
  buyer_city TEXT,
  buyer_state_us TEXT,
  buyer_zip_code TEXT,
  buyer_id_type TEXT,
  buyer_id_number TEXT,

  sold_date TIMESTAMPTZ,
  sold_first_name TEXT,
  sold_middle_name TEXT,
  sold_last_name TEXT,
  sold_street_address TEXT,
  sold_id_address TEXT,
  sold_city TEXT,
  sold_state_us TEXT,
  sold_zip_code TEXT,
  sold_amount NUMERIC(12,2),
  sold_id_type TEXT,
  sold_id_number TEXT,

  transaction_num TEXT,
  notes_1 TEXT,
  notes_2 TEXT,

  voided BOOLEAN DEFAULT FALSE,
  changed BOOLEAN DEFAULT FALSE,

  guntype TEXT,
  importer TEXT,
  nicstn TEXT,

  legacy_gun_id UUID,
  legacy_user_id UUID REFERENCES app_user(id) ON DELETE SET NULL,

  orig_manufacturer TEXT,
  orig_model TEXT,
  orig_serial TEXT,
  orig_caliber TEXT,
  orig_action TEXT,
  orig_buy_date TIMESTAMPTZ,
  orig_buy_fname TEXT,
  orig_buy_mname TEXT,
  orig_buy_lname TEXT,
  orig_buy_add1 TEXT,
  orig_buy_add2 TEXT,
  orig_buy_city TEXT,
  orig_buy_state TEXT,
  orig_buy_zip TEXT,
  orig_buy_id_type TEXT,
  orig_buy_id_num TEXT,
  orig_sold_date TIMESTAMPTZ,
  orig_sold_fname TEXT,
  orig_sold_mname TEXT,
  orig_sold_lname TEXT,
  orig_sold_add1 TEXT,
  orig_sold_add2 TEXT,
  orig_sold_city TEXT,
  orig_sold_state TEXT,
  orig_sold_zip TEXT,
  orig_sold_id_type TEXT,
  orig_sold_id_num TEXT,
  orig_trans_num TEXT,
  orig_guntype TEXT,
  orig_importer TEXT,
  orig_nicstn TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_gunlog_legacy_pk ON gunlog(legacy_gunlog_pk);
CREATE INDEX IF NOT EXISTS idx_gunlog_serial ON gunlog(serial);
CREATE INDEX IF NOT EXISTS idx_gunlog_buyer_date ON gunlog(buyer_date);
CREATE INDEX IF NOT EXISTS idx_gunlog_sold_date ON gunlog(sold_date);
CREATE INDEX IF NOT EXISTS idx_gunlog_inventory ON gunlog(inventory_item_id);

DROP TRIGGER IF EXISTS trg_gunlog_updated ON gunlog;
CREATE TRIGGER trg_gunlog_updated
BEFORE UPDATE ON gunlog
FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

CREATE INDEX IF NOT EXISTS inv_sub_cat_active ON inventory_subcategory (inventory_category_id) WHERE is_active;
CREATE INDEX IF NOT EXISTS inv_brand_cat_active ON inventory_brand (inventory_category_id) WHERE is_active;
CREATE INDEX IF NOT EXISTS inv_cat_name_active ON inventory_category (name) WHERE is_active;

-----------------------
-- App settings (control numbers)
-----------------------
CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES app_user(id) ON DELETE SET NULL
);

-- Initialize control numbers for pawn tickets
-- Separate sequences for PAWN and PURCHASE transactions

-- Add store_sale_control_number_next for retail/layaway sales
INSERT INTO app_settings (key, value, description)
VALUES 
  ('pawn_ticket_control_number_next', '100001', 'Next control number for pawn tickets (PAWN type)'),
  ('purchase_ticket_control_number_next', '1', 'Next control number for purchase tickets (PURCHASE type)'),
  ('store_sale_control_number_next', '1', 'Next control number for store sales (retail, layaway, etc)'),
  ('gun_transfer_number_next', '1', 'Next control number for gun log transactions')
ON CONFLICT (key) DO NOTHING;

-- NOTE: After migration, run a script to set store_sale_control_number_next to (max ticketnum + 1) from legacy acct table for types:
--   'SL', 'SLD', 'SLP', 'SLU', 'SS', 'SSV', 'SLV'
-- Example:
--   SELECT MAX(acct.TICKETNUM) FROM acct WHERE acct.TYPE IN ('SL','SLD','SLP','SLU','SS','SSV','SLV');
--   UPDATE app_settings SET value = '<max+1>' WHERE key = 'store_sale_control_number_next';

-- Function to get next control number for PAWN transactions
CREATE OR REPLACE FUNCTION get_next_pawn_control_number()
RETURNS TEXT AS $$
DECLARE
  next_num TEXT;
BEGIN
  UPDATE app_settings
  SET value = (value::INTEGER + 1)::TEXT,
      updated_at = NOW()
  WHERE key = 'pawn_ticket_control_number_next'
  RETURNING (value::INTEGER - 1)::TEXT INTO next_num;

  RETURN next_num;
END;
$$ LANGUAGE plpgsql;

-- Function to get next control number for store sales transactions  
CREATE OR REPLACE FUNCTION get_next_store_sale_control_number()
RETURNS TEXT AS $$
DECLARE
  next_num TEXT;
BEGIN
  UPDATE app_settings
  SET value = (value::INTEGER + 1)::TEXT,
      updated_at = NOW()
  WHERE key = 'store_sale_control_number_next'
  RETURNING (value::INTEGER - 1)::TEXT INTO next_num;

  RETURN next_num;
END;
$$ LANGUAGE plpgsql;

-- Function to get next control number for PURCHASE transactions  
CREATE OR REPLACE FUNCTION get_next_purchase_control_number()
RETURNS TEXT AS $$
DECLARE
  next_num TEXT;
BEGIN
  UPDATE app_settings
  SET value = (value::INTEGER + 1)::TEXT,
      updated_at = NOW()
  WHERE key = 'purchase_ticket_control_number_next'
  RETURNING (value::INTEGER - 1)::TEXT INTO next_num;

  RETURN next_num;
END;
$$ LANGUAGE plpgsql;

-- Function to get next control number for gun transfer transactions  
CREATE OR REPLACE FUNCTION get_next_gun_transfer_number()
RETURNS TEXT AS $$
DECLARE
  next_num TEXT;
BEGIN
  UPDATE app_settings
  SET value = (value::INTEGER + 1)::TEXT,
      updated_at = NOW()
  WHERE key = 'gun_transfer_number_next'
  RETURNING (value::INTEGER - 1)::TEXT INTO next_num;

  RETURN next_num;
END;
$$ LANGUAGE plpgsql;

-- Legacy function - defaults to pawn control number for backward compatibility
CREATE OR REPLACE FUNCTION get_next_control_number()
RETURNS TEXT AS $$
BEGIN
  RETURN get_next_pawn_control_number();
END;
$$ LANGUAGE plpgsql;



-----------------------
-- Attribute dictionary (schema only; seeds later)
-----------------------
-- Removed duplicate item_attribute tables (consolidated on item_attribute_type/value)

-------------------------
-- Police Hold Items
-------------------------
CREATE TABLE IF NOT EXISTS hold_item (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  control_number TEXT, -- Matches LookupKey
  customer_id UUID REFERENCES customer(id) ON DELETE SET NULL, -- Matches emp_fk
  hold_date DATE, -- date
  agency TEXT, -- agency
  case_number TEXT, -- casenum
  date_out DATE, -- dateout
  is_hold BOOLEAN, -- ishold
  is_inventory BOOLEAN, -- isinv
  item_list TEXT, -- itemlist
  comment TEXT, -- comment
  agent_last_name TEXT, -- agentln
  agent_first_name TEXT, -- agentfn
  agent_middle_initial TEXT, -- agentmi
  badge_number TEXT, -- badge
  phone_area_code TEXT, -- ac1
  phone_number TEXT, -- phone1
  phone_extension TEXT, -- ext1
  jurisdiction TEXT, -- jurisdict
  legacy_hcn_id UUID, -- HCN_id
  updated_by UUID REFERENCES app_user(id) ON DELETE SET NULL, -- LastUpdatedUSR_ID
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS trg_hold_item_updated ON hold_item;
CREATE TRIGGER trg_hold_item_updated
BEFORE UPDATE ON hold_item
FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

CREATE TABLE IF NOT EXISTS hold_item_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hold_item_id UUID NOT NULL REFERENCES hold_item(id) ON DELETE CASCADE,
  inventory_item_id UUID NOT NULL REFERENCES inventory_item(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ,
  UNIQUE(hold_item_id, inventory_item_id)
);

-------------------------
-- Gun Transaction Types (lookup)
-------------------------
CREATE TABLE IF NOT EXISTS gun_transaction_type (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS trg_gun_transaction_type_updated ON gun_transaction_type;
CREATE TRIGGER trg_gun_transaction_type_updated
BEFORE UPDATE ON gun_transaction_type
FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

INSERT INTO gun_transaction_type (code, description, sort_order) VALUES
  ('PAWN',        'Pawned firearm', 10),
  ('REDEEMED',    'Pawn redeemed by customer', 20),
  ('SALE',        'Sold to customer', 30),
  ('SOLD',        'Sold (legacy)', 35),
  ('BUY',         'Purchased from customer', 40),
  ('PICKED UP',   'Firearm picked up', 50),
  ('RETURNED',    'Returned to customer', 60),
  ('TRANSFER',    'Transferred to another location', 70),
  ('HOLD',        'Police/legal hold placed', 80),
  ('RELEASE',     'Hold released', 90),
  ('CONFISCATE',  'Confiscated by police', 100),
  ('VOID',        'Transaction voided', 110),
  ('VOID SALE',   'Sale voided', 120),
  ('CHANGE',      'Information changed/corrected', 130),
  ('UNDO REDEE',  'Redemption reversed', 140),
  ('DELETE',      'Record deleted', 150),
  ('INVENTORY',   'Added to inventory', 160)
ON CONFLICT (code) DO NOTHING;

-------------------------
-- Gun Transaction History
-------------------------
CREATE TABLE IF NOT EXISTS gun_transaction_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_number TEXT,
  inventory_item_id UUID REFERENCES inventory_item(id) ON DELETE CASCADE,
  transaction_date TIMESTAMPTZ,
  type_id UUID REFERENCES gun_transaction_type(id) ON DELETE RESTRICT,
  clerk_user_id UUID REFERENCES app_user(id) ON DELETE SET NULL,
  notes TEXT,
  legacy_GNT_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS gun_transaction_history_item_idx ON gun_transaction_history(inventory_item_id);
CREATE INDEX IF NOT EXISTS gun_transaction_history_date_idx ON gun_transaction_history(transaction_date);
CREATE INDEX IF NOT EXISTS gun_transaction_history_type_idx ON gun_transaction_history(type_id);

DROP TRIGGER IF EXISTS trg_gun_transaction_history_updated ON gun_transaction_history;
CREATE TRIGGER trg_gun_transaction_history_updated
BEFORE UPDATE ON gun_transaction_history
FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
