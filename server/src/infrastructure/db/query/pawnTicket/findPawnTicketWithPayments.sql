SELECT 
  pt.id,
  pt.control_number,
  pt.transaction_type,
  pt.customer_id,
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
  pt.pawn_status,
  pt.created_at,
  pt.updated_at,
  
  -- Payment history as JSON array
  COALESCE(
    json_agg(
      json_build_object(
        'id', ptp.id,
        'payment_date', ptp.payment_date,
        'interest_paid', ptp.interest_paid,
        'principal_paid', ptp.principal_paid,
        'fees_paid', ptp.fees_paid,
        'note', ptp.note,
        'store_transaction_id', ptp.store_transaction_id
      ) ORDER BY ptp.payment_date ASC
    ) FILTER (WHERE ptp.id IS NOT NULL),
    '[]'::json
  ) as payments,
  
  -- Inventory items
  COALESCE(
    array_agg(pti.inventory_item_id) FILTER (WHERE pti.inventory_item_id IS NOT NULL),
    '{}'::uuid[]
  ) as inventory_item_ids

FROM pawn_ticket pt
LEFT JOIN pawn_ticket_payment ptp ON ptp.pawn_ticket_id = pt.id
LEFT JOIN pawn_ticket_item pti ON pti.pawn_ticket_id = pt.id
WHERE pt.control_number = $1 OR pt.id = $1
GROUP BY pt.id;
