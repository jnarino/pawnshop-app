SELECT id, name, code, parent_id, path::text
FROM inventory_category
ORDER BY path;
