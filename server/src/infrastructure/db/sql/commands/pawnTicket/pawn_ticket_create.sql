-- Inserts a pawn_ticket and its items in one atomic statement.
WITH new_ticket AS (
  INSERT INTO pawn_ticket (
    id,
    control_number,
    transaction_type,
    customer_id,
    amount_financed,
    purchase_trade_value,
    transaction_date,
    maturity_date,
    default_date,
    pawn_status
  )
  VALUES (
    $1,                       -- id (uuid)
    get_next_control_number(),-- control_number
    $2,                       -- transaction_type
    $3,                       -- customer_id
    $4,                       -- amount_financed
    $5,                       -- purchase_trade_value
    $6,                       -- transaction_date
    $7,                       -- maturity_date
    $8,                       -- default_date
    'active'
  )
  RETURNING
    id,
    control_number,
    transaction_type,
    customer_id,
    amount_financed,
    purchase_trade_value,
    transaction_date,
    maturity_date,
    default_date,
    pawn_status
),
insert_items AS (
  INSERT INTO pawn_ticket_item (pawn_ticket_id, inventory_item_id)
  SELECT (SELECT id FROM new_ticket), unnest($9::uuid[])
)
SELECT
  id,
  control_number,
  transaction_type,
  customer_id,
  amount_financed,
  purchase_trade_value,
  transaction_date,
  maturity_date,
  default_date,
  pawn_status
FROM new_ticket;
