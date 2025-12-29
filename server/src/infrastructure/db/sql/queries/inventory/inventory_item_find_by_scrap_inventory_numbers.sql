SELECT 
  inventory_item.inventory_number,
  inventory_item.item_description
FROM 
  inventory_item
WHERE 
  inventory_number IN (
    'I-11243', 'I-183', '3441-1', 'I-195', 'I-256',
    'I-511', 'I-526', 'I-185', 'I-512', 'I-524', 'I-224',
    'I-755', 'I-212', 'I-518', 'I-525', 'I-251', 'I-522',
    'I-239', 'I-315', 'I-776'
  )
ORDER BY 
  inventory_item.item_description ASC
