INSERT INTO store_transaction (
  id,
  customer_id,
  clerk_user_id,
  type_id,
  occurred_at,
  amount,
  tax_sales,
  tax_exempt_used,
  tax_exempt_certificate,
  state_tax,
  tender_change,
  gun_proc_fee,
  note
) VALUES (
  $1,  -- id
  $2,  -- customer_id
  $3,  -- clerk_user_id
  $4,  -- type_id
  $5,  -- occurred_at
  $6,  -- amount
  $7,  -- tax_sales
  $8,  -- tax_exempt_used
  $9,  -- tax_exempt_certificate
  $10, -- state_tax
  $11, -- tender_change
  $12, -- gun_proc_fee
  $13  -- note
)
RETURNING *;
