SELECT 
  c.id AS category_id, 
  s.id AS subcategory_id, 
  b.id AS brand, 
  (
    c.name || '.' || s.name || '.' || b.name
  ) AS path 
FROM 
  public.inventory_category c 
  JOIN public.inventory_subcategory s ON s.inventory_category_id = c.id 
  JOIN public.inventory_brand b ON b.inventory_category_id = c.id 
ORDER BY 
  c.code, 
  s.code, 
  b.code;
