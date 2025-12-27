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
      pts.status AS pawn_status,
      pt.created_at,
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
  WHERE pt.transaction_date >= $1 AND pt.transaction_date <= $2
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
    pt.created_at,
    pts.status
  ORDER BY pt.transaction_date DESC;
