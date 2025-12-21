SELECT 
  c.id,
  c.name,
  c.code
FROM inventory_category c
INNER JOIN inventory_subcategory s ON s.inventory_category_id = c.id
WHERE s.id = $1;
