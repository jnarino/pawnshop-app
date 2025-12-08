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
-- Inventory: hierarchical categories
-------------------------------
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
DROP TRIGGER IF EXISTS trg_inventory_category_updated ON inventory_category;
CREATE TRIGGER trg_inventory_category_updated
BEFORE UPDATE ON inventory_category
FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

DROP TRIGGER IF EXISTS trg_inventory_category_path_ins ON inventory_category;
CREATE TRIGGER trg_inventory_category_path_ins
BEFORE INSERT ON inventory_category
FOR EACH ROW EXECUTE PROCEDURE inventory_category_set_path();

DROP TRIGGER IF EXISTS trg_inventory_category_path_upd ON inventory_category;
CREATE TRIGGER trg_inventory_category_path_upd
BEFORE UPDATE OF parent_id, code ON inventory_category
FOR EACH ROW EXECUTE PROCEDURE inventory_category_set_path();

CREATE INDEX IF NOT EXISTS inventory_category_path_gist ON inventory_category USING GIST (path);
CREATE INDEX IF NOT EXISTS inventory_category_parent_idx ON inventory_category(parent_id);

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
  ('B', NULL, 10),
  ('C', NULL, 20),
  ('D', NULL, 30),
  ('H', NULL, 40),
  ('I', NULL, 50),  -- default for new items
  ('J', NULL, 60),
  ('L', NULL, 70),
  ('O', NULL, 80),
  ('P', NULL, 90),
  ('S', NULL, 100),
  ('T', NULL, 110),
  ('U', NULL, 120),
  ('V', NULL, 130)
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
  category_id UUID NOT NULL REFERENCES inventory_category(id) ON DELETE RESTRICT,

  status TEXT NOT NULL DEFAULT 'I' REFERENCES inventory_status(code),

  brand TEXT,
  model TEXT,
  serial_number TEXT,
  -- color now stored in item attributes JSONB
  item_condition TEXT,

  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),

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

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS inventory_item_category_idx ON inventory_item(category_id);
CREATE INDEX IF NOT EXISTS inventory_item_status_idx   ON inventory_item(status);
CREATE INDEX IF NOT EXISTS inventory_item_brand_model_idx ON inventory_item(brand, model);

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
-- Pawn tickets
-------------------------
CREATE TABLE IF NOT EXISTS pawn_ticket (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  control_number TEXT NOT NULL,
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

  rate_plan_id UUID REFERENCES rate_plan(id) ON DELETE RESTRICT,
  paid_through_date DATE,
  next_charge_date DATE,
  interest_credit NUMERIC(12,2) NOT NULL DEFAULT 0,

  last_payment_at TIMESTAMPTZ,
  last_activity_at TIMESTAMPTZ,
  default_marked_at TIMESTAMPTZ,
  default_marked_by UUID REFERENCES app_user(id) ON DELETE SET NULL,
  default_reason TEXT,

  pawn_status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT pawn_ticket_finance_charge_min
    CHECK (finance_charge IS NULL OR finance_charge >= 3.00),

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
  ),

  CONSTRAINT pawn_ticket_pawn_status_check CHECK (
    pawn_status IN ('active','redeemed','defaulted','police hold','confiscation','voided')
  )
);
CREATE INDEX IF NOT EXISTS pawn_ticket_customer_idx     ON pawn_ticket(customer_id);
CREATE INDEX IF NOT EXISTS pawn_ticket_type_idx         ON pawn_ticket(transaction_type);
CREATE INDEX IF NOT EXISTS pawn_ticket_transaction_idx  ON pawn_ticket(transaction_date);
CREATE INDEX IF NOT EXISTS idx_pawn_ticket_pawn_status  ON pawn_ticket(pawn_status);
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
  legacy_code TEXT UNIQUE,          -- original PawnMaster code: 'SS','PPP', etc.
  name TEXT NOT NULL,
  cash_dir SMALLINT NOT NULL DEFAULT 0 CHECK (cash_dir IN (-1,0,1)),
  active BOOLEAN NOT NULL DEFAULT TRUE
);

INSERT INTO store_transaction_type (id, code, legacy_code, name, cash_dir) VALUES
  (1,  'RETAIL_SALE',             'SS',  'Retail sale',               +1),
  (2,  'LAYAWAY_DEPOSIT',         'SL',  'Layaway deposit',           +1),
  (3,  'PAWN_PAYMENT',            'PPP', 'Pawn payment',              +1),
  (4,  'PAWN_REDEMPTION_PAYMENT', 'PPU', 'Pawn redemption payment',   +1),
  (5,  'PAWN_DISBURSEMENT',       'P',   'Pawn (cash out)',           -1),
  (6,  'BUY_OUTRIGHT',            'B',   'Buy (cash out)',            -1),
  (7,  'BUY_REVERSAL',            'BV',  'Voided buy (reverse)',      +1),
  (8,  'CASH_FROM_BANK',          'MZ',  'Cash from bank/main',       +1),
  (9,  'CASH_TO_MAIN',            'MO',  'Cash to main',              -1),
  (10, 'BANK_DEPOSIT',            'MA',  'Bank deposit / to bank',    -1),
  (11, 'CASH_DRAWER_BALANCING',   'MB',  'Main balancing entry',       0),
  (12, 'OTHER_NON_CASH',          'T',   'Commission/other (no cash)', 0),
  (13, 'PAWN_DEFAULTED',          'PD',  'Defaulted (no cash)',        0),
  (14, 'PAWN_REVERSAL',           'PV',  'Voided pawn (reverse)',     +1)
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
  legacy_acct_pk BIGINT,
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
  tax_exempt_certificate TEXT,
  state_tax NUMERIC(12,2),
  tender_change NUMERIC(12,2),

  gun_proc_fee NUMERIC(12,2),

  note TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
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
-- Pawn ticket payments (PPP / PPU linkage)
-----------------------
CREATE TABLE IF NOT EXISTS pawn_ticket_payment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pawn_ticket_id UUID NOT NULL REFERENCES pawn_ticket(id) ON DELETE CASCADE,
  store_transaction_id UUID NOT NULL UNIQUE REFERENCES store_transaction(id) ON DELETE CASCADE,
  payment_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  interest_paid NUMERIC(12,2) NOT NULL DEFAULT 0,
  principal_paid NUMERIC(12,2) NOT NULL DEFAULT 0,
  fees_paid NUMERIC(12,2) NOT NULL DEFAULT 0,
  clerk_user_id UUID REFERENCES app_user(id) ON DELETE SET NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_pawn_payment_ticket ON pawn_ticket_payment(pawn_ticket_id);
CREATE INDEX IF NOT EXISTS idx_pawn_payment_date   ON pawn_ticket_payment(payment_date);

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
  gunlog_number  INTEGER NOT NULL,
  CONSTRAINT gunlog_number_unique UNIQUE (gunlog_number),

  inventory_item_id UUID REFERENCES inventory_item(id) ON DELETE SET NULL,

  manufacturer    TEXT NOT NULL,
  importer        TEXT,
  model           TEXT,
  serial_number   TEXT NOT NULL,
  caliber_gauge   TEXT NOT NULL,
  firearm_type    TEXT NOT NULL,
  firearm_action  TEXT NOT NULL,

  acquisition_date        TIMESTAMPTZ NOT NULL,
  acquisition_customer_id UUID REFERENCES customer(id) ON DELETE SET NULL,

  acq_name_full   TEXT NOT NULL,
  acq_addr1       TEXT,
  acq_suite_number TEXT,
  acq_addr2       TEXT,
  acq_city        TEXT,
  acq_state       TEXT,
  acq_zip         TEXT,
  acq_id_type     TEXT,
  acq_id_number   TEXT,

  disposition_date        TIMESTAMPTZ,
  disposition_customer_id UUID REFERENCES customer(id) ON DELETE SET NULL,

  disp_name_full  TEXT,
  disp_addr1      TEXT,
  disp_suite_number TEXT,
  disp_addr2      TEXT,
  disp_city       TEXT,
  disp_state      TEXT,
  disp_zip        TEXT,
  disp_id_type    TEXT,
  disp_id_number  TEXT,

  acquisition_store_tx_id  UUID REFERENCES store_transaction(id) ON DELETE SET NULL,
  disposition_store_tx_id  UUID REFERENCES store_transaction(id) ON DELETE SET NULL,

  status          TEXT NOT NULL DEFAULT 'active'
                  CHECK (status IN ('active','voided','corrected')),
  supersedes_id   UUID REFERENCES gunlog(id) ON DELETE SET NULL,
  notes           TEXT,

  last_updated_user_id UUID REFERENCES app_user(id) ON DELETE SET NULL,

  -- legacy linkage
  legacy_gunlog_pk        BIGINT,
  legacy_gunlognum        INTEGER,
  legacy_prev_gunlogrec   BIGINT,
  legacy_next_gunlogrec   BIGINT,
  legacy_invnum           TEXT,
  legacy_transnum         TEXT,
  legacy_changed          BOOLEAN,
  legacy_voided           BOOLEAN,
  legacy_nicstn           TEXT,
  legacy_pickdate         TIMESTAMPTZ,
  legacy_gun_id           TEXT,
  legacy_last_updated_usr TEXT,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_gunlog_legacy_pk       ON gunlog(legacy_gunlog_pk);
CREATE INDEX        IF NOT EXISTS idx_gunlog_serial         ON gunlog(serial_number);
CREATE INDEX        IF NOT EXISTS idx_gunlog_acq_date       ON gunlog(acquisition_date);
CREATE INDEX        IF NOT EXISTS idx_gunlog_disp_date      ON gunlog(disposition_date);
CREATE INDEX        IF NOT EXISTS idx_gunlog_inventory      ON gunlog(inventory_item_id);
CREATE INDEX        IF NOT EXISTS idx_gunlog_legacy_invnum  ON gunlog(legacy_invnum);
CREATE INDEX        IF NOT EXISTS idx_gunlog_legacy_trans   ON gunlog(legacy_transnum);
CREATE INDEX        IF NOT EXISTS idx_gunlog_legacy_prev    ON gunlog(legacy_prev_gunlogrec);
CREATE INDEX        IF NOT EXISTS idx_gunlog_legacy_next    ON gunlog(legacy_next_gunlogrec);

DROP TRIGGER IF EXISTS trg_gunlog_updated ON gunlog;
CREATE TRIGGER trg_gunlog_updated
BEFORE UPDATE ON gunlog
FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

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

INSERT INTO app_settings (key, value, description)
VALUES ('pawn_ticket_control_number_next', '100001', 'Next control number for pawn tickets')
ON CONFLICT (key) DO NOTHING;

CREATE OR REPLACE FUNCTION get_next_control_number()
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

-----------------------
-- Attribute dictionary (schema only; seeds later)
-----------------------
-- Removed duplicate item_attribute tables (consolidated on item_attribute_type/value)
