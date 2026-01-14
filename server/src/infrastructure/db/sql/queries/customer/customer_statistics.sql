-- Get customer statistics including pawn and purchase activity
WITH customer_info AS (
  SELECT 
    c.id,
    c.first_name,
    c.last_name
  FROM customer c
  WHERE c.id = $1
),
pawn_stats AS (
  SELECT 
    COUNT(*) FILTER (WHERE pts.status = 'P') AS active_pawns,
    COUNT(*) FILTER (WHERE pts.status = 'U') AS redeemed_pawns,
    COUNT(*) FILTER (WHERE pts.status = 'D') AS defaulted_pawns,
    COUNT(*) FILTER (WHERE pt.transaction_type = 'PAWN') AS total_pawns
  FROM pawn_ticket pt
  JOIN pawn_ticket_status pts ON pts.id = pt.status_id
  WHERE pt.customer_id = $1
    AND pt.transaction_type = 'PAWN'
),
buy_stats AS (
  SELECT 
    COUNT(*) AS buy_count
  FROM pawn_ticket pt
  WHERE pt.customer_id = $1
    AND pt.transaction_type = 'PURCHASE'
),
sales_stats AS (
  SELECT 
    COALESCE(SUM(st.amount), 0) AS total_sales_amount
  FROM store_transaction st
  JOIN store_transaction_type stt ON stt.id = st.type_id
  WHERE st.customer_id = $1
    AND stt.code = 'SS'  -- Retail sales only
)
SELECT 
  ci.id AS customer_id,
  ci.first_name || ' ' || ci.last_name AS customer_name,
  COALESCE(ps.active_pawns, 0) AS active_pawns,
  COALESCE(ps.redeemed_pawns, 0) AS redeemed_pawns,
  COALESCE(ps.defaulted_pawns, 0) AS defaulted_pawns,
  COALESCE(bs.buy_count, 0) AS buys,
  COALESCE(ps.total_pawns, 0) AS total_pawns,
  COALESCE(ss.total_sales_amount, 0) AS total_sales_amount
FROM customer_info ci
LEFT JOIN pawn_stats ps ON TRUE
LEFT JOIN buy_stats bs ON TRUE
LEFT JOIN sales_stats ss ON TRUE;
