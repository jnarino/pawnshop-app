UPDATE customer 
SET locked = false, updated_at = now()
WHERE id = $1;
