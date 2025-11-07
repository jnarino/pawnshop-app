UPDATE customer 
SET locked = true 
WHERE id = $1 AND locked = false
RETURNING id, first_name, last_name, locked;
