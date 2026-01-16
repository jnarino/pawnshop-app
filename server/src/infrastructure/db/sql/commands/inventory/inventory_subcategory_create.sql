INSERT INTO inventory_subcategory (
  id,
  inventory_category_id,
  name,
  code,
  is_active
) VALUES (
  $1,
  $2,
  $3,
  $4,
  $5
) RETURNING *;
