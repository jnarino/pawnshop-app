SELECT
  t.*
FROM store_transaction_tender t
WHERE t.store_transaction_id = ANY ($1::uuid[])
ORDER BY t.store_transaction_id, t.sequence;
