SELECT
  inventory_subcategory.name AS item_type,
  inventory_category.name AS type,
  inventory_brand.name AS brand,
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
ORDER BY inventory_subcategory.name, inventory_item.item_description;
