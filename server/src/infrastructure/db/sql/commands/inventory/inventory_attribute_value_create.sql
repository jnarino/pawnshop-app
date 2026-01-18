INSERT INTO item_attribute_value (
  id,
  attribute_type_id,
  value,
  sort_order,
  created_at,
  updated_at
) VALUES (
  $1,
  $2,
  $3,
  0,
  NOW(),
  NOW()
)
RETURNING *;
