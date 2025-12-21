-- Inserts a pawn_ticket and all related records in one atomic statement:
-- 1. pawn_ticket
-- 2. pawn_ticket_item (junction table)
-- 3. store_transaction (for the disbursement)
-- 4. store_transaction_tender
-- (pawn_ticket_payment removed)
--
-- Parameters:
-- $1  = pawn_ticket.id (uuid)
-- $2  = transaction_type ('PAWN' or 'PURCHASE')
-- $3  = customer_id (uuid)
-- $4  = clerk_user_id (uuid)
-- $5  = amount_financed (numeric, nullable)
-- $6  = original_pawn_amount (numeric, nullable)
-- $7  = periodic_rate (numeric, nullable)
-- $8  = apr (numeric, nullable)
-- $9  = purchase_trade_value (numeric, nullable)
-- $10 = transaction_date (timestamptz)
-- $11 = maturity_date (timestamptz)
-- $12 = default_date (timestamptz)
-- $13 = item_ids (uuid[])
-- $14 = tenders (jsonb array: [{tenderTypeId: number, amount: number}])
-- $15 = note (text, nullable)
-- $16 = control_number (text)

WITH
status_lookup AS (
  SELECT id FROM pawn_ticket_status
  WHERE status = CASE 
    WHEN $2 = 'PAWN' THEN 'P'
    WHEN $2 = 'PURCHASE' THEN 'B'
    ELSE 'P'
  END
  LIMIT 1
),
new_ticket AS (
  INSERT INTO pawn_ticket (
    id,
    control_number,
    transaction_type,
    customer_id,
    amount_financed,
    original_pawn_amount,
    periodic_rate,
    apr,
    purchase_trade_value,
    transaction_date,
    maturity_date,
    default_date,
    status_id,
    created_by
  )
  VALUES (
    $1,
    $16, -- control_number passed as param
    $2,
    $3,
    $5,
    $6,
    $7,
    $8,
    $9,
    $10,
    $11,
    $12,
    (SELECT id FROM status_lookup),
    $4
  )
  RETURNING
    id,
    control_number,
    transaction_type,
    customer_id,
    amount_financed,
    original_pawn_amount,
    periodic_rate,
    apr,
    purchase_trade_value,
    transaction_date,
    maturity_date,
    default_date,
    status_id,
    created_by,
    created_at
),
insert_items AS (
  INSERT INTO pawn_ticket_item (pawn_ticket_id, inventory_item_id)
  SELECT (SELECT id FROM new_ticket), unnest($13::uuid[])
),
new_store_transaction AS (
  INSERT INTO store_transaction (
    id,
    legacy_ticketnum,
    customer_id,
    clerk_user_id,
    type_id,
    pawn_ticket_id,
    occurred_at,
    amount,
    note
  )
  SELECT
    gen_random_uuid(),
    $16,
    $3,  -- customer_id
    $4,  -- clerk_user_id
    CASE 
      WHEN $2 = 'PAWN' THEN 5      -- PAWN_DISBURSEMENT
      WHEN $2 = 'PURCHASE' THEN 3  -- BUY_OUTRIGHT
    END,
    nt.id,
    $10, -- transaction_date (occurred_at)
    -- Negative amount for disbursement
    CASE 
      WHEN $2 = 'PAWN' THEN -($5)         -- negative amount_financed
      WHEN $2 = 'PURCHASE' THEN -($9)    -- negative purchase_trade_value
    END,
    $15  -- note
  FROM new_ticket nt
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
    CASE 
      WHEN $2 = 'PAWN' THEN -($5)
      WHEN $2 = 'PURCHASE' THEN -($9)
      ELSE (tender->>'amount')::NUMERIC(12,2)
    END
  FROM jsonb_array_elements($14::jsonb) AS tender
)

SELECT
  nt.id,
  nt.control_number,
  nt.transaction_type,
  nt.customer_id,
  nt.amount_financed,
  nt.original_pawn_amount,
  nt.periodic_rate,
  nt.apr,
  nt.purchase_trade_value,
  nt.transaction_date,
  nt.maturity_date,
  nt.default_date,
  nt.created_at,
  nt.created_by AS clerk_user_id,
  pts.status AS pawn_status,
  COALESCE($13, ARRAY[]::uuid[]) AS item_ids,
  COALESCE($14, '[]'::jsonb) AS tenders
FROM new_ticket nt
LEFT JOIN pawn_ticket_status pts ON pts.id = nt.status_id;