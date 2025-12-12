-- Inserts a pawn_ticket and all related records in one atomic statement:
-- 1. pawn_ticket
-- 2. pawn_ticket_item (junction table)
-- 3. store_transaction (for the disbursement)
-- 4. store_transaction_tender
-- 5. pawn_ticket_payment (initial disbursement record with negative amount)
--
-- Parameters:
-- $1  = pawn_ticket.id (uuid)
-- $2  = transaction_type ('PAWN' or 'PURCHASE')
-- $3  = customer_id (uuid)
-- $4  = clerk_user_id (uuid)
-- $5  = amount_financed (numeric, nullable)
-- $6  = finance_charge (numeric, nullable)
-- $7  = periodic_rate (numeric, nullable)
-- $8  = total_of_payments (numeric, nullable)
-- $9  = apr (numeric, nullable)
-- $10 = rate_plan_id (uuid, nullable)
-- $11 = purchase_trade_value (numeric, nullable)
-- $12 = transaction_date (timestamptz)
-- $13 = maturity_date (timestamptz)
-- $14 = default_date (timestamptz)
-- $15 = item_ids (uuid[])
-- $16 = tenders (jsonb array: [{tenderTypeId: number, amount: number}])
-- $17 = note (text, nullable)

WITH new_ticket AS (
  INSERT INTO pawn_ticket (
    id,
    control_number,
    transaction_type,
    customer_id,
    amount_financed,
    finance_charge,
    periodic_rate,
    total_of_payments,
    apr,
    rate_plan_id,
    purchase_trade_value,
    transaction_date,
    maturity_date,
    default_date,
    pawn_status
  )
  VALUES (
    $1,                         -- id
    get_next_control_number(),  -- control_number (auto-generated)
    $2,                         -- transaction_type
    $3,                         -- customer_id
    $5,                         -- amount_financed
    $6,                         -- finance_charge
    $7,                         -- periodic_rate
    $8,                         -- total_of_payments
    $9,                         -- apr
    $10,                        -- rate_plan_id
    $11,                        -- purchase_trade_value
    $12,                        -- transaction_date
    $13,                        -- maturity_date
    $14,                        -- default_date
    'active'
  )
  RETURNING
    id,
    control_number,
    transaction_type,
    customer_id,
    amount_financed,
    finance_charge,
    periodic_rate,
    total_of_payments,
    apr,
    rate_plan_id,
    purchase_trade_value,
    transaction_date,
    maturity_date,
    default_date,
    pawn_status
),
insert_items AS (
  INSERT INTO pawn_ticket_item (pawn_ticket_id, inventory_item_id)
  SELECT (SELECT id FROM new_ticket), unnest($15::uuid[])
),
new_store_transaction AS (
  INSERT INTO store_transaction (
    id,
    customer_id,
    clerk_user_id,
    type_id,
    occurred_at,
    amount,
    note
  )
  SELECT
    gen_random_uuid(),
    $3,  -- customer_id
    $4,  -- clerk_user_id
    CASE 
      WHEN $2 = 'PAWN' THEN 5      -- PAWN_DISBURSEMENT
      WHEN $2 = 'PURCHASE' THEN 6  -- BUY_OUTRIGHT
    END,
    $12, -- transaction_date (occurred_at)
    -- Negative amount for disbursement
    CASE 
      WHEN $2 = 'PAWN' THEN -($5)         -- negative amount_financed
      WHEN $2 = 'PURCHASE' THEN -($11)    -- negative purchase_trade_value
    END,
    $17  -- note
  RETURNING id, amount
),
insert_tenders AS (
  INSERT INTO store_transaction_tender (
    id,
    store_transaction_id,
    sequence,
    tender_type_id,
    amount
  )
  SELECT
    gen_random_uuid(),
    (SELECT id FROM new_store_transaction),
    ROW_NUMBER() OVER ()::SMALLINT,
    (tender->>'tenderTypeId')::SMALLINT,
    (tender->>'amount')::NUMERIC(12,2)
  FROM jsonb_array_elements($16::jsonb) AS tender
),
insert_payment AS (
  INSERT INTO pawn_ticket_payment (
    id,
    pawn_ticket_id,
    store_transaction_id,
    payment_date,
    interest_paid,
    principal_paid,
    fees_paid,
    clerk_user_id,
    note
  )
  SELECT
    gen_random_uuid(),
    (SELECT id FROM new_ticket),
    (SELECT id FROM new_store_transaction),
    $12,  -- transaction_date (payment_date)
    0,    -- interest_paid (initial disbursement)
    CASE 
      WHEN $2 = 'PAWN' THEN -($5)         -- negative principal (disbursement)
      WHEN $2 = 'PURCHASE' THEN -($11)    -- negative purchase value
    END,
    0,    -- fees_paid
    $4,   -- clerk_user_id
    'Initial disbursement'
  WHERE $2 = 'PAWN'  -- Only create payment record for PAWN transactions
)
SELECT
  id,
  control_number,
  transaction_type,
  customer_id,
  amount_financed,
  finance_charge,
  periodic_rate,
  total_of_payments,
  apr,
  rate_plan_id,
  purchase_trade_value,
  transaction_date,
  maturity_date,
  default_date,
  pawn_status
FROM new_ticket;
