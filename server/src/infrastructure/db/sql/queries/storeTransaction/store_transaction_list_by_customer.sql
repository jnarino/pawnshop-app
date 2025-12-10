SELECT
  st.*
FROM store_transaction st
WHERE st.customer_id = $1
ORDER BY st.occurred_at DESC, st.id;
