SELECT
  id,
  inventory_number AS "inventory_number",
  status,
  category_id     AS "category_id",
  brand,
  model,
  serial_number   AS "serial_number",
  color,
  item_condition  AS "item_condition",
  quantity,
  price_amount    AS "price_amount",
  resale,
  min_resale      AS "min_resale",
  item_replace    AS "item_replace",
  owner_mark      AS "owner_mark",
  item_description AS "item_description",
  attributes,
  created_at      AS "created_at",
  updated_at      AS "updated_at"
FROM inventory_item
ORDER BY updated_at DESC;
