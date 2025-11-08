UPDATE inventory_item
SET 
  status = COALESCE($1, status),
  category_id = COALESCE($2, category_id),
  brand = $3,
  model = $4,
  serial_number = $5,
  color = $6,
  item_condition = $7,
  quantity = COALESCE($8, quantity),
  price_amount = $9,
  resale = $10,
  min_resale = $11,
  item_replace = $12,
  owner_mark = $13,
  item_description = $14,
  attributes = COALESCE($15::jsonb, attributes),
  updated_at = NOW()
WHERE id = $16;
