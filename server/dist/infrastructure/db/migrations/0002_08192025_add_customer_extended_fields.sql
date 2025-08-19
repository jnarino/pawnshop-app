-- 0002_08192025_add_customer_extended_fields.sql
-- Adds new optional descriptive fields to customer: hair_color, weight, race, country
-- Idempotent so it can run safely multiple times.

ALTER TABLE customer
  ADD COLUMN IF NOT EXISTS hair_color TEXT,
  ADD COLUMN IF NOT EXISTS weight TEXT,
  ADD COLUMN IF NOT EXISTS race TEXT,
  ADD COLUMN IF NOT EXISTS country TEXT;

-- All columns nullable so no data migration required.
