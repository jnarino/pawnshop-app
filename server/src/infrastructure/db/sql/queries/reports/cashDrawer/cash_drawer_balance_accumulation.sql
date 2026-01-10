-- Get all transactions between last close date and report start date
-- Used when more than 1 day has passed since last close
-- Returns all transactions with tender breakdown to accumulate opening balance
SELECT
  st.id AS store_transaction_id,
  st.occurred_at,
  st.legacy_ticketnum,
  au.username AS employee,
  sttype.name AS transaction_type,
  sttype.code AS transaction_code,
  (COALESCE(st.amount, 0) + COALESCE(st.state_tax, 0)) AS amount,
  COALESCE(st.tender_change, 0) AS tender_change,
  st.note AS remarks,
  COALESCE(stt.amount, 0) AS tender_amount,
  ttype.name AS payment_method,
  CASE
    WHEN sttype.code = 'PPU' THEN COALESCE(pt.amount_financed, 0)
    ELSE 0
  END AS principal_component,
  CASE
    WHEN sttype.code = 'PPU' THEN (COALESCE(st.amount, 0) + COALESCE(st.state_tax, 0)) - COALESCE(pt.amount_financed, 0)
    ELSE 0
  END AS interest_component
FROM store_transaction AS st
JOIN app_user AS au ON au.id = st.clerk_user_id
JOIN store_transaction_type AS sttype ON sttype.id = st.type_id
LEFT JOIN store_transaction_tender AS stt ON stt.store_transaction_id = st.id
LEFT JOIN tender_type AS ttype ON ttype.id = stt.tender_type_id
LEFT JOIN pawn_ticket AS pt ON sttype.code = 'PPU' AND pt.control_number = st.legacy_ticketnum
WHERE st.occurred_at > $1::timestamptz
  AND st.occurred_at < $2::timestamptz
  AND sttype.code NOT IN ('T', 'MB','MA', 'PD')
ORDER BY st.occurred_at ASC, st.id ASC, stt.id ASC;
