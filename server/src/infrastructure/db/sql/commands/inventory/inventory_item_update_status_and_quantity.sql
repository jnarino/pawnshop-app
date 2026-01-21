UPDATE inventory_item 
SET 
  status = $2,
  quantity = COALESCE(quantity, 0) + $3,
  updated_at = NOW()
WHERE id = $1;
