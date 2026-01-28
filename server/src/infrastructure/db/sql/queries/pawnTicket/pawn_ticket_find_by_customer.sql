SELECT
  pt.id,
  pt.control_number,
  pt.transaction_type,
  pt.customer_id,
  c.first_name,
  c.last_name,
  pt.amount_financed,
  pt.finance_charge,
  pt.periodic_rate,
  pt.total_of_payments,
  pt.apr,
  pt.purchase_trade_value,
  pt.transaction_date,
  pt.maturity_date,
  pt.default_date,
  pt.created_by AS clerk_user_id,
  au.username AS clerk_username,
  pts.status AS pawn_status,
  COALESCE(
    array_agg(pti.inventory_item_id ORDER BY pti.inventory_item_id)
      FILTER (WHERE pti.inventory_item_id IS NOT NULL),
    '{}'
  ) AS item_ids
FROM pawn_ticket pt
LEFT JOIN pawn_ticket_item pti
  ON pti.pawn_ticket_id = pt.id
LEFT JOIN pawn_ticket_status pts
  ON pt.status_id = pts.id
LEFT JOIN customer c
  ON pt.customer_id = c.id
LEFT JOIN app_user au
  ON au.id = pt.created_by
WHERE pt.customer_id = $1
GROUP BY
  pt.id,
  pt.control_number,
  pt.transaction_type,
  pt.customer_id,
  c.first_name,
  c.last_name,
  pt.amount_financed,
  pt.finance_charge,
  pt.periodic_rate,
  pt.total_of_payments,
  pt.apr,
  pt.purchase_trade_value,
  pt.transaction_date,
  pt.maturity_date,
  pt.default_date,
  pt.created_by,
  au.username,
  pts.status
ORDER BY pt.transaction_date DESC;
