WITH params AS (
  SELECT
    date_trunc('day', $1::timestamptz) AS start_ts,
    date_trunc('day', $2::timestamptz) + interval '1 day' AS end_ts
),
initial_balance AS (
  SELECT COALESCE((
    SELECT ttt.amount
    FROM store_transaction st
    JOIN store_transaction_type sttype ON sttype.id = st.type_id
    JOIN store_transaction_tender ttt ON ttt.store_transaction_id = st.id
    CROSS JOIN params p
    WHERE sttype.name = 'MAIN BALANCE (admin)'
      AND st.occurred_at < p.start_ts
    ORDER BY st.occurred_at DESC
    LIMIT 1
  ), 0) AS amount
),
filtered AS (
  SELECT
    st.id AS store_transaction_id,
    st.occurred_at,
    st.legacy_ticketnum,
    au.username AS employee,
    sttype.name AS transaction_type,
    (COALESCE(st.amount, 0) + COALESCE(st.state_tax, 0)) AS amount,
    COALESCE(st.tender_change, 0) AS tender_change,
    st.note AS remarks,
    ttype.name AS payment_method
  FROM store_transaction AS st
  JOIN app_user AS au
    ON au.id = st.clerk_user_id
  JOIN store_transaction_type AS sttype
    ON sttype.id = st.type_id
  JOIN store_transaction_tender AS tttender
    ON tttender.store_transaction_id = st.id
  JOIN tender_type AS ttype
    ON ttype.id = tttender.tender_type_id
  CROSS JOIN params p
  WHERE st.occurred_at >= p.start_ts
    AND st.occurred_at <  p.end_ts
    AND sttype.code NOT IN ('T')
)
SELECT
  f.occurred_at,
  f.legacy_ticketnum,
  f.employee,
  f.transaction_type,
  f.amount,
  f.tender_change,
  f.remarks,
  f.payment_method,
  ib.amount + SUM(f.amount) OVER (
    ORDER BY f.occurred_at, f.store_transaction_id
    ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
  ) AS balance
FROM filtered f
CROSS JOIN initial_balance ib
ORDER BY f.occurred_at ASC, f.store_transaction_id ASC;