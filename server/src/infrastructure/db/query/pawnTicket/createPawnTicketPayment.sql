INSERT INTO pawn_ticket_payment (
  id, 
  pawn_ticket_id, 
  store_transaction_id, 
  payment_date,
  interest_paid, 
  principal_paid, 
  fees_paid, 
  clerk_user_id,
  note, 
  created_at
) VALUES (
  $1, $2, $3, NOW(), $4, $5, $6, $7, $8, NOW()
);
