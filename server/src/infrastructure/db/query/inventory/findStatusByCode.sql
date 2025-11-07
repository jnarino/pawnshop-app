SELECT 
  code,
  description,
  is_terminal,
  sort_order,
  active
FROM inventory_status
WHERE code = $1;
