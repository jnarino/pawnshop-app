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
  pt.created_at,
  pt.updated_at,
  c.first_name,
  c.last_name,
  -- ✅ Get payment history
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
      ) ORDER BY ptp.payment_date DESC
    ) FILTER (WHERE ptp.id IS NOT NULL),
    '[]'::json
  ) as payments
FROM pawn_ticket pt
LEFT JOIN customer c ON c.id = pt.customer_id
LEFT JOIN pawn_ticket_payment ptp ON ptp.pawn_ticket_id = pt.id
WHERE pt.control_number = $1
GROUP BY pt.id, c.first_name, c.last_name;
