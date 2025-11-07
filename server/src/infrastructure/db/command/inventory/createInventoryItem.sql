INSERT INTO inventory_item (
  id,
  inventory_number,
  status,
  category_id,
  brand,
  model,
  serial_number,
  color_id,
  item_condition,
  quantity,
  price_amount,
  resale,
  min_resale,
  item_replace,
  owner_mark,
  item_description,
  attributes,
  extra,
  last_updated_user_id
) VALUES (
  $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19
) RETURNING id;
