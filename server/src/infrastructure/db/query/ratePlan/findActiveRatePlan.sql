SELECT id, name, period_days, grace_days, periodic_rate, min_finance_charge 
FROM rate_plan 
WHERE id = $1 AND active = true;
