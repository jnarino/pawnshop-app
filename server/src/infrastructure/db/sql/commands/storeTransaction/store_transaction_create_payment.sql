-- Creates a store transaction for payment/redemption
WITH new_tx AS (
  INSERT INTO store_transaction (
    id, customer_id, clerk_user_id, type_id, occurred_at, amount, pawn_ticket_id, created_at, updated_at
  )
  SELECT
    gen_random_uuid(),
    pt.customer_id,
    $2, -- clerk_user_id
    $3, -- type_id (7=PPP, 8=PPU)
    NOW(),
    $4, -- amount (positive)
    $1, -- pawn_ticket_id
    NOW(),
    NOW()
  FROM pawn_ticket pt WHERE pt.id = $1
  RETURNING id
)
INSERT INTO store_transaction_tender (
  id, store_transaction_id, sequence, tender_type_id, amount, created_at
)
SELECT
  gen_random_uuid(),
  new_tx.id,
  1,
  $5, -- tender_type_id
  $6, -- amount (positive)
  NOW()
FROM new_tx;
