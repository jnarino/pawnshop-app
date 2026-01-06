SELECT 
  id, 
  inventory_subcategory_id, 
  inventory_brand_id, 
  status, 
  model, 
  serial_number, 
  color, 
  item_condition, 
  quantity, 
  price_amount, 
  resale, 
  min_resale, 
  item_replace, 
  owner_mark, 
  item_description, 
  bin_location, 
  storage_fee, 
  extra, 
  attributes, 
  legacy_inventory_number, 
  legacy_item_guid, 
  legacy_category_description, 
  legacy_brand_color_description, 
  inventory_number, 
  last_updated_user_id, 
  created_at, 
  updated_at 
FROM 
  inventory_item 
WHERE 
  created_at IS NOT NULL 
  AND status = 'I' 
  AND inventory_number = $1;
