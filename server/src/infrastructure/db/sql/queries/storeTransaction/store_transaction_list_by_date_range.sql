SELECT
  st.*
FROM store_transaction st
WHERE st.occurred_at >= $1
  AND st.occurred_at <= $2
ORDER BY st.occurred_at DESC;
