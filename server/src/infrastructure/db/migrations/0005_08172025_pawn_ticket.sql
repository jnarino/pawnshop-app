-- Migration 0005: Pawn Ticket core tables
-- Avoid reserved words; use pawn_ticket_type instead of type
-- Includes linking table pawn_ticket_item for many-to-many flexibility (future history)

CREATE TYPE pawn_ticket_type AS ENUM ('PAWN','PURCHASE');

CREATE TABLE pawn_ticket (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  control_number TEXT,
  pawn_ticket_type pawn_ticket_type NOT NULL,
  customer_id UUID NOT NULL REFERENCES customer(id) ON DELETE RESTRICT,
  amount_financed NUMERIC(12,2),          -- pawn only
  finance_charge NUMERIC(12,2),           -- pawn only (>= 5.00 when present)
  periodic_rate NUMERIC(6,4),             -- decimal (e.g. 0.2500) pawn only
  total_of_payments NUMERIC(12,2),        -- pawn only
  apr NUMERIC(9,2),                       -- pawn only (percentage like 304.17)
  purchase_trade_value NUMERIC(12,2),     -- purchase only
  transaction_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  maturity_date TIMESTAMPTZ NOT NULL,
  default_date TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT pawn_ticket_finance_charge_min CHECK (finance_charge IS NULL OR finance_charge >= 5.00),
  CONSTRAINT pawn_ticket_amount_consistency CHECK (
    (pawn_ticket_type = 'PAWN' AND amount_financed IS NOT NULL AND finance_charge IS NOT NULL AND periodic_rate IS NOT NULL AND total_of_payments IS NOT NULL AND apr IS NOT NULL AND purchase_trade_value IS NULL)
    OR (pawn_ticket_type = 'PURCHASE' AND purchase_trade_value IS NOT NULL AND amount_financed IS NULL AND finance_charge IS NULL AND periodic_rate IS NULL AND total_of_payments IS NULL AND apr IS NULL)
  )
);

CREATE INDEX IF NOT EXISTS pawn_ticket_customer_idx ON pawn_ticket(customer_id);
CREATE INDEX IF NOT EXISTS pawn_ticket_type_idx ON pawn_ticket(pawn_ticket_type);
CREATE INDEX IF NOT EXISTS pawn_ticket_transaction_idx ON pawn_ticket(transaction_date);

-- Linking table for items (allows multiple items per ticket)
CREATE TABLE pawn_ticket_item (
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
