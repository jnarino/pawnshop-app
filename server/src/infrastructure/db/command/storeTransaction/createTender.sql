INSERT INTO store_transaction_tender (
  id, store_transaction_id, sequence, tender_type_id, amount
) VALUES ($1, $2, $3, $4, $5);
