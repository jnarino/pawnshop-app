SELECT
  pt.id,
  pt.control_number,
  pt.transaction_type,
  pt.customer_id,
  pt.amount_financed,
  pt.purchase_trade_value,
  pt.transaction_date,
  pt.maturity_date,
  pt.default_date,
  pt.pawn_status,
  COALESCE(
    array_agg(pti.inventory_item_id ORDER BY pti.inventory_item_id)
      FILTER (WHERE pti.inventory_item_id IS NOT NULL),
    '{}'
  ) AS item_ids
FROM pawn_ticket pt
LEFT JOIN pawn_ticket_item pti
  ON pti.pawn_ticket_id = pt.id
WHERE pt.customer_id = $1
  AND pt.pawn_status = 'active'
GROUP BY
  pt.id,
  pt.control_number,
  pt.transaction_type,
  pt.customer_id,
  pt.amount_financed,
  pt.purchase_trade_value,
  pt.transaction_date,
  pt.maturity_date,
  pt.default_date,
  pt.pawn_status
ORDER BY pt.transaction_date DESC;
