SELECT
  i.*
FROM store_transaction_item i
WHERE i.store_transaction_id = ANY ($1::uuid[])
ORDER BY i.store_transaction_id, i.sequence;
