INSERT INTO inventory_item (
  inventory_number, status, category_id, brand, model, serial_number,
  color, item_condition, quantity, price_amount, resale, min_resale, item_replace,
  owner_mark, item_description, attributes
) VALUES (
  $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16
)
RETURNING id;
