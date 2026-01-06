UPDATE inventory_item
SET 
    quantity = quantity - $2,
    status = CASE WHEN (quantity - $2) <= 0 THEN 'S' ELSE status END,
    updated_at = NOW()
WHERE id = $1;
