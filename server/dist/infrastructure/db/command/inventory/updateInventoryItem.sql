UPDATE inventory_item SET
  status = COALESCE($1, status),
  category_id = COALESCE($2, category_id),
  brand = COALESCE($3, brand),
  model = COALESCE($4, model),
  serial_number = COALESCE($5, serial_number),
  color = COALESCE($6, color),
  item_condition = COALESCE($7, item_condition),
  quantity = COALESCE($8, quantity),
  amount = COALESCE($9, amount),
  resale = COALESCE($10, resale),
  item_replace = COALESCE($11, item_replace),
  bin_number = COALESCE($12, bin_number),
  owner_tag = COALESCE($13, owner_tag),
  item_description = COALESCE($14, item_description),
  attributes = CASE WHEN $15 IS NOT NULL THEN $15 ELSE attributes END
WHERE id = $16;
