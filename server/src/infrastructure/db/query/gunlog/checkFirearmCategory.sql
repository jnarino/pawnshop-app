WITH RECURSIVE category_tree AS (
  SELECT id, name, code, parent_id, path
  FROM inventory_category
  WHERE id = $1
  
  UNION ALL
  
  SELECT c.id, c.name, c.code, c.parent_id, c.path
  FROM inventory_category c
  INNER JOIN category_tree ct ON c.id = ct.parent_id
)
SELECT COUNT(*) > 0 as is_firearm
FROM category_tree
WHERE code = 'FIREARMS';
