-- Get all store transactions and their tenders since the last MAIN BALANCE close
-- Returns all transactions after the most recent type 23 (MAIN BALANCE)
WITH last_close_time AS (
  SELECT COALESCE(MAX(occurred_at), '1900-01-01'::timestamp) AS close_at
  FROM store_transaction
  WHERE type_id = 23
)
SELECT 
  st.id,
  st.occurred_at,
  stt_tender.tender_type_id,
  tt.name AS tender_type_name,
  stt_tender.amount
FROM store_transaction st
LEFT JOIN store_transaction_tender stt_tender ON stt_tender.store_transaction_id = st.id
LEFT JOIN tender_type tt ON tt.id = stt_tender.tender_type_id
CROSS JOIN last_close_time
WHERE st.occurred_at > last_close_time.close_at
  AND st.type_id != 23
ORDER BY st.occurred_at DESC;
