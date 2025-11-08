SELECT id, name, period_days, grace_days, periodic_rate, min_finance_charge 
FROM rate_plan 
WHERE active = true 
ORDER BY created_at ASC 
LIMIT 1;
