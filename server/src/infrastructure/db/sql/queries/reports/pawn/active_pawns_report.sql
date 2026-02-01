SELECT 
  pt.id AS pawn_ticket_id,
  pt.control_number AS ticket_number,
  CONCAT(c.first_name, ' ', c.last_name) AS customer_name,
  au.username AS employee_username,
  pt.created_at AS date_in,
  pt.default_date AS date_out,
  pt.amount_financed AS service_charge_due,
  ii.price_amount AS item_amount,
  ii.quantity,
  ii.item_description,
  ii.inventory_brand_id AS brand,
  ii.model,
  ii.serial_number,
  ii.extra,
  ii.attributes,
  pts.status
FROM pawn_ticket pt
JOIN pawn_ticket_item pti ON pti.pawn_ticket_id = pt.id
JOIN inventory_item ii ON ii.id = pti.inventory_item_id
JOIN customer c ON c.id = pt.customer_id
JOIN app_user au ON au.id = pt.created_by
JOIN pawn_ticket_status pts ON pts.id = pt.status_id
LEFT JOIN inventory_subcategory isc ON isc.id = ii.inventory_subcategory_id
JOIN inventory_category ON inventory_category.id = isc.inventory_category_id
WHERE pts.status IN ('H', 'P')
  AND pts.transaction_type = 'PAWN'
  AND ($1::uuid IS NULL OR isc.inventory_category_id = $1)
  AND ($2::uuid IS NULL OR ii.inventory_subcategory_id = $2)
   AND ($3::boolean IS FALSE OR inventory_category.name NOT IN ('JEWELRY', 'FIREARM'))
ORDER BY pt.control_number ASC;
