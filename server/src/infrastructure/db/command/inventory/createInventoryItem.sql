INSERT INTO inventory_item (
  inventory_item_type,status,category_id,subcategory_id,brand,model,serial_number,color,item_condition,quantity,amount,resale,item_replace,bin,owner_tag,item_description,firearm_attributes,jewelry_attributes,inventory_number
) VALUES (
  $1,$2,$3,$4,$5,$6,$7,$8,$9,COALESCE($10,1),$11,$12,$13,$14,$15,$16,$17,$18,$19
) RETURNING id;
