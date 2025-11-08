SELECT 
  code,
  description,
  is_terminal,
  sort_order,
  active
FROM inventory_status
WHERE active = true
ORDER BY sort_order, code;
