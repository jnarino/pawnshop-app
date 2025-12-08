SELECT 
    id,
    name,
    code,
    parent_id,
    path::text as path,
    depth
FROM inventory_category 
ORDER BY path;