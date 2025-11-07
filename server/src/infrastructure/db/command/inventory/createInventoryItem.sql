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
  extra
) VALUES (
  $1,  -- id
  $2,  -- inventory_number
  $3,  -- status
  $4,  -- category_id
  $5,  -- brand
  $6,  -- model
  $7,  -- serial_number
  $8,  -- color_id
  $9,  -- item_condition
  $10, -- quantity
  $11, -- price_amount
  $12, -- resale
  $13, -- min_resale
  $14, -- item_replace
  $15, -- owner_mark
  $16, -- item_description
  $17, -- attributes
  $18  -- extra
) RETURNING id;
