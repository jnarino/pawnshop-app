UPDATE customer 
SET locked = false 
WHERE id = $1;
