-- Get the last MAIN BALANCE (close) transaction
SELECT 
  st.id,
  st.occurred_at,
  st.amount
FROM store_transaction st
WHERE st.type_id = 23
ORDER BY st.occurred_at DESC
LIMIT 1;
