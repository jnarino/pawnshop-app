SELECT 
  id,
  attribute_type_id,
  value
FROM item_attribute_value
WHERE attribute_type_id = $1
ORDER BY value;
