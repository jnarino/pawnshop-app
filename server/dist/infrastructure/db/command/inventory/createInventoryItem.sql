INSERT INTO inventory_item (
  status,category_id,brand,model,serial_number,color,item_condition,quantity,amount,resale,item_replace,bin_number,owner_tag,item_description,attributes,inventory_number
) VALUES (
  $1,$2,$3,$4,$5,$6,$7,COALESCE($8,1),$9,$10,$11,$12,$13,$14,$15,$16
) RETURNING id;
