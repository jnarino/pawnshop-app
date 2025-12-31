-- Daily police records report (transactions by date range)
SELECT 
  pt.id,
  pt.control_number,
  pt.transaction_type,
  pt.transaction_date,

  c.first_name,
  c.middle_name,
  c.last_name,
  c.date_of_birth,
  c.gender,
  c.address AS customer_address,
  c.city AS customer_city,
  c.state AS customer_state,
  c.zip AS customer_zip,
  c.phone_number AS customer_phone,
  c.employer_name AS customer_employer,
  c.id_type AS customer_id_type,
  c.id_number AS customer_id_number,
  c.height AS customer_height,
  c.weight AS customer_weight,
  c.hair_color AS customer_hair_color,
  c.eye_color AS customer_eye_color,

  ii.id AS inventory_item_id,
  isub.name AS item_type,
  ib.name AS item_brand,
  ii.item_description,
  ii.model,
  ii.serial_number,
  ii.color,
  ii.quantity,
  COALESCE(ii.price_amount, 0) AS item_amount,
  ii.status AS item_status,
  CASE 
    WHEN isub.code ILIKE '%GUN%' OR isub.code ILIKE '%FIREARM%' THEN 'G'
    WHEN ii.status = 'I' THEN 'J'
    ELSE 'O'
  END AS record_type
FROM pawn_ticket pt
JOIN customer c ON pt.customer_id = c.id
LEFT JOIN pawn_ticket_item pti ON pt.id = pti.pawn_ticket_id
LEFT JOIN inventory_item ii ON ii.id = pti.inventory_item_id
LEFT JOIN inventory_subcategory isub ON ii.inventory_subcategory_id = isub.id
LEFT JOIN inventory_brand ib ON ii.inventory_brand_id = ib.id
WHERE pt.transaction_date >= $1 
  AND pt.transaction_date < $2 + INTERVAL '1 day'
  AND ($3::TEXT IS NULL OR pt.control_number = $3)
ORDER BY pt.transaction_date ASC, pt.control_number ASC, ii.id ASC
LIMIT $4 OFFSET $5;
