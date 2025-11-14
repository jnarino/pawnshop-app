INSERT INTO store_transaction (
  id, 
  customer_id, 
  clerk_user_id, 
  type_id, 
  occurred_at, 
  amount, 
  note, 
  created_at, 
  updated_at
) VALUES (
  $1, $2, $3, $4, NOW(), $5, $6, NOW(), NOW()
);
