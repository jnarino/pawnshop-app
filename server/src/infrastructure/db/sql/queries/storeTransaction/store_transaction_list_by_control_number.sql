SELECT
  st.*
FROM store_transaction st
WHERE st.legacy_ticketnum = $1
ORDER BY st.occurred_at DESC, st.id;
