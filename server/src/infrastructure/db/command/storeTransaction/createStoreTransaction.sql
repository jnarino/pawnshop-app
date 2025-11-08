INSERT INTO store_transaction (
  id, customer_id, clerk_user_id, type_id, occurred_at,
  amount, note, legacy_ticketnum
) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
RETURNING id;
