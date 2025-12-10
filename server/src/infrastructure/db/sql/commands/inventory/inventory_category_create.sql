INSERT INTO inventory_category (id, name, code, parent_id)
VALUES ($1, $2, $3, $4)
RETURNING
  id,
  name,
  code,
  parent_id,
  path::text AS path,
  depth;
