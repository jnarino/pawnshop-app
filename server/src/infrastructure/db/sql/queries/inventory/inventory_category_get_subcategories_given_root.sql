SELECT id, name
FROM inventory_subcategory
WHERE
    inventory_category_id = $1
ORDER BY name DESC