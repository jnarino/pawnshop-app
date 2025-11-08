INSERT INTO pawn_ticket (
  id, 
  control_number, 
  transaction_type, 
  customer_id,
  amount_financed, 
  finance_charge, 
  periodic_rate, 
  total_of_payments, 
  apr, 
  purchase_trade_value,
  transaction_date, 
  maturity_date, 
  default_date,
  rate_plan_id,
  paid_through_date,
  next_charge_date,
  interest_credit,
  pawn_status,
  last_activity_at,
  created_at,
  updated_at
) VALUES (
  $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21
) RETURNING id;
