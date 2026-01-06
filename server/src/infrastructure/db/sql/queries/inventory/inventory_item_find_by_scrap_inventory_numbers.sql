SELECT 
  inventory_item.inventory_number,
  inventory_item.item_description
FROM 
  inventory_item
WHERE 
  inventory_number IN (
    'I-2', 'I-4', 'I-6', 'I-8', 'I-9',
    'I-10', 'I-11', 'I-12', 'I-13', 'I-14', 'I-15',
    'G-I-50', 'I-53', 'I-58', 'I-97', 'I-111', 'I-206',
    'I-230', 'I-260', 'I-275'
  )
ORDER BY 
  inventory_item.item_description ASC
