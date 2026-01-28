SELECT 
  c.*,
  CASE 
    WHEN h.id IS NOT NULL THEN jsonb_build_object('id', h.id, 'name', h.value) 
    ELSE NULL 
  END as hair_color_obj,
  CASE 
    WHEN e.id IS NOT NULL THEN jsonb_build_object('id', e.id, 'name', e.value) 
    ELSE NULL 
  END as eye_color_obj
FROM customer c
LEFT JOIN item_attribute_value h 
  ON c.hair_color = h.value 
LEFT JOIN item_attribute_value e 
  ON c.eye_color = e.value 
WHERE c.id = $1;
