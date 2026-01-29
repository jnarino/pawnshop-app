INSERT INTO store_transaction (
  id,
  legacy_ticketnum,
  customer_id,
  clerk_user_id,
  type_id,
  occurred_at,
  amount,
  tax_sales,
  tax_exempt_used,
  state_tax,
  tender_change,
  gun_proc_fee,
  note,
  created_at,
  updated_at,
  pawn_ticket_id
) VALUES (
  $1,  -- id
  COALESCE($15, get_next_store_sale_control_number()),  -- legacy_ticketnum (use provided or generate)
  $2,  -- customer_id
  $3,  -- clerk_user_id
  $4,  -- type_id
  $5,  -- occurred_at
  $6,  -- amount
  $7,  -- tax_sales
  $8,  -- tax_exempt_used
  $9,  -- state_tax
  $10, -- tender_change
  $11, -- gun_proc_fee
  $12, -- note
  $13, -- created_at
  $14, -- updated_at
  $16  -- pawn_ticket_id
)
RETURNING *;
