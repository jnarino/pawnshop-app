-- Get the last MAIN BALANCE (MB) transaction before the report start date
-- Returns the balance amount and timestamp of the last close
SELECT
  st.id,
  st.amount,
  st.occurred_at
FROM store_transaction AS st
JOIN store_transaction_type AS stt ON stt.id = st.type_id
WHERE stt.code = 'MB'
  AND st.occurred_at < $1::timestamptz
ORDER BY st.occurred_at DESC
LIMIT 1;
