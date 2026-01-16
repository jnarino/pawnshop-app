SELECT
  p.id,
  acc.occurred_at,
  acc.amount,
  usr.username,
  sttype.name AS type_name
FROM store_transaction AS acc
JOIN app_user AS usr
  ON usr.id = acc.clerk_user_id
JOIN pawn_ticket AS p
  ON p.customer_id = acc.customer_id
 AND p.control_number = acc.legacy_ticketnum
JOIN store_transaction_type sttype ON sttype.id = acc.type_id
WHERE  p.id = $1
  AND acc.tax_sales IS NULL
ORDER BY acc.created_at DESC;