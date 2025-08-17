INSERT INTO pawn_ticket (
  control_number,pawn_ticket_type,customer_id,amount_financed,finance_charge,periodic_rate,total_of_payments,apr,purchase_trade_value,transaction_date,maturity_date,default_date
) VALUES (
  $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12
) RETURNING id;
