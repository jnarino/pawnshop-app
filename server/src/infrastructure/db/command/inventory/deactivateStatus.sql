UPDATE inventory_status 
SET 
  active = false, 
  updated_at = now() 
WHERE code = $1;
