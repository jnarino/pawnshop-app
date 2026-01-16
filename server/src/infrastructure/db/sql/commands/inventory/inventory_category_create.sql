INSERT INTO inventory_category (
  id,
  name,
  code,
  is_active,
  created_at,
  updated_at
) VALUES (
  $1,
  $2,
  $3,
  $4,
  NOW(),
  NOW()
)
RETURNING *;
