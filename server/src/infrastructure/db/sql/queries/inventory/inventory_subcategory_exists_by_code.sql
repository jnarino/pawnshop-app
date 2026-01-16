SELECT 1 
FROM inventory_subcategory
WHERE code = $1
LIMIT 1;
