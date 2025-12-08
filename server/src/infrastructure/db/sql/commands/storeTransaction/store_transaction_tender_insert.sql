INSERT INTO store_transaction_tender (
  id,
  store_transaction_id,
  sequence,
  tender_type_id,
  amount
) VALUES (
  $1, -- id
  $2, -- store_transaction_id
  $3, -- sequence
  $4, -- tender_type_id
  $5  -- amount
);
