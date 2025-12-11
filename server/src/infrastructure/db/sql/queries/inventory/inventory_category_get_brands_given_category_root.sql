SELECT id, name
FROM inventory_brand
WHERE
    inventory_category_id = $1