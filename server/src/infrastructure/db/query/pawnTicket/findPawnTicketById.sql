SELECT 
  pt.id,
  pt.control_number,
  pt.transaction_type,
  pt.customer_id,
  pt.pawn_status,
  pt.amount_financed,
  pt.finance_charge,
  pt.periodic_rate,
  pt.total_of_payments,
  pt.apr,
  pt.purchase_trade_value,
  pt.transaction_date,
  pt.maturity_date,
  pt.default_date,
  pt.rate_plan_id,
  pt.paid_through_date,
  pt.next_charge_date,
  pt.interest_credit,
  pt.last_payment_at,
  pt.last_activity_at,
  pt.default_marked_at,
  pt.default_marked_by,
  pt.default_reason,
  pt.created_at,
  pt.updated_at,
  COALESCE(
    array_agg(ii.id) FILTER (WHERE ii.id IS NOT NULL),
    '{}'::uuid[]
  ) as inventory_item_ids
FROM pawn_ticket pt
LEFT JOIN pawn_ticket_item pti ON pti.pawn_ticket_id = pt.id
LEFT JOIN inventory_item ii ON ii.id = pti.inventory_item_id
WHERE pt.id = $1
GROUP BY pt.id;
