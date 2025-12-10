UPDATE inventory_item
SET
  category_id                 = $2,
  status                      = $3,
  brand                       = $4,
  model                       = $5,
  serial_number               = $6,
  color_id                    = $7,
  item_condition              = $8,
  quantity                    = $9,
  price_amount                = $10,
  resale                      = $11,
  min_resale                  = $12,
  item_replace                = $13,
  owner_mark                  = $14,
  item_description            = $15,
  extra                       = $16,
  attributes                  = $17,
  legacy_inventory_number     = $18,
  legacy_item_guid            = $19,
  legacy_category_description = $20,
  legacy_brand_color_description = $21,
  inventory_number            = $22,
  last_updated_user_id        = $23,
  updated_at                  = $24
WHERE id = $1
RETURNING *;
