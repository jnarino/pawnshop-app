SELECT 
  id, 
  name, 
  period_days, 
  grace_days, 
  periodic_rate, 
  min_finance_charge,
  extend_on_interest_payment,
  extension_days_per_payment,
  max_extensions,
  active,
  created_at,
  updated_at
FROM rate_plan 
ORDER BY name;
