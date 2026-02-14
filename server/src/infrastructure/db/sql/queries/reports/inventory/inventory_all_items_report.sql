SELECT
  inventory_subcategory.name AS item_type,
  inventory_category.name AS type,
  inventory_brand.name AS brand,
  inventory_item.inventory_number,
  inventory_item.item_description,
  inventory_item.model,
  inventory_item.serial_number,
  inventory_item.quantity,
  inventory_item.price_amount AS cost,
  inventory_item.resale
FROM inventory_item
JOIN inventory_subcategory ON inventory_subcategory.id = inventory_item.inventory_subcategory_id
JOIN inventory_category ON inventory_category.id = inventory_subcategory.inventory_category_id
JOIN inventory_brand ON inventory_item.inventory_brand_id = inventory_brand.id
WHERE inventory_item.status = 'I'
  AND ($1::uuid IS NULL OR inventory_category.id = $1)
  AND ($2::uuid IS NULL OR inventory_subcategory.id = $2)
  AND ($3::boolean IS FALSE OR inventory_category.name NOT IN ('JEWELRY', 'FIREARM'))
ORDER BY inventory_item.inventory_number ASC
