SELECT
  st.occurred_at AS occurred_at,
  stt.name AS transaction_type,
  st.legacy_ticketnum::text AS ticket_number,
  CASE
    WHEN stt.name ILIKE 'LAYAWAY PICKUP%' THEN COALESCE(st.tax_sales, 0)
    ELSE COALESCE(st.amount, 0)
  END AS gross_amount,
  COALESCE(st.tax_sales, 0) AS taxable_amount,
  COALESCE(st.state_tax, 0) AS tax_collected
FROM store_transaction st
JOIN store_transaction_type stt
  ON stt.id = st.type_id
 AND stt.id IN (10, 11, 15)
WHERE st.occurred_at >= $1::timestamptz
  AND st.occurred_at < date_trunc('day', $2::timestamptz) + interval '1 day'
ORDER BY st.occurred_at;
