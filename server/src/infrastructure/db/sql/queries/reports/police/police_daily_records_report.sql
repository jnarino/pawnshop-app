SELECT 
  pt.control_number, 
  pt.created_at AS transaction_date, 
  CASE 
    WHEN pt.transaction_type = 'PURCHASE' THEN 'B' 
    WHEN pt.transaction_type = 'PAWN' THEN 'P' 
    ELSE NULL 
  END AS transaction_type, 

  c.first_name, 
  c.middle_name, 
  c.last_name, 
  c.date_of_birth, 
  c.sex, 
  LEFT(c.race, 1) AS race, 
  c.street_address, 
  c.city, 
  c.state_us, 
  c.zip_code, 
  CASE 
    WHEN length(regexp_replace(coalesce(c.phone_number, ''), '\\D', '', 'g')) = 10 THEN 
      '(' || substr(regexp_replace(coalesce(c.phone_number, ''), '\\D', '', 'g'), 1, 3) || ') ' || 
      substr(regexp_replace(coalesce(c.phone_number, ''), '\\D', '', 'g'), 4, 3) || '-' || 
      substr(regexp_replace(coalesce(c.phone_number, ''), '\\D', '', 'g'), 7, 4) 
    ELSE c.phone_number 
  END AS phone_number, 
  c.employer_name, 
  CASE 
    WHEN length(regexp_replace(coalesce(c.employer_phone_number, ''), '\\D', '', 'g')) = 10 THEN 
      '(' || substr(regexp_replace(coalesce(c.employer_phone_number, ''), '\\D', '', 'g'), 1, 3) || ') ' || 
      substr(regexp_replace(coalesce(c.employer_phone_number, ''), '\\D', '', 'g'), 4, 3) || '-' || 
      substr(regexp_replace(coalesce(c.employer_phone_number, ''), '\\D', '', 'g'), 7, 4) 
    ELSE c.employer_phone_number 
  END AS employer_phone_number, 
  c.id_number, 
  c.id_state, 
  split_part(c.id_type, ' ', 1) as id_type, 
  c.height, 
  c.weight, 
  c.eye_color, 
  c.hair_color, 
  ii.serial_number, 
  ii.owner_mark, 
  isub.name AS subcategory_name, 
  ib.name AS brand_name, 
  ii.model, 
  ii.item_description, 
  LEFT(isub.name, 1) AS subcategory_initial, 
  LEFT( 
    ( 
      SELECT iav.value 
      FROM item_attribute_value iav 
      WHERE iav.id = (ii.attributes ->> 'metal')::uuid 
    ), 
    1 
  ) AS metal_color, 
  ( 
    SELECT iav.value 
    FROM item_attribute_value iav 
    WHERE iav.id = (ii.attributes ->> 'karat')::uuid 
  ) AS karat, 
  (ii.attributes ->> 'weight')::numeric AS weight, 
  ( 
    SELECT iav.value 
    FROM item_attribute_value iav 
    WHERE iav.id = (ii.attributes ->> 'sizeLength')::uuid 
  ) AS sizeLength, 
  ( 
    (ii.extra -> 'stones')-> 0 ->> 'quantity' 
  )::int AS quantity, 
  LEFT( 
    ( 
      SELECT iav.value 
      FROM item_attribute_value iav 
      WHERE iav.id = ((ii.extra -> 'stones')-> 0 ->> 'shape')::uuid 
    ), 
    1 
  ) AS shape_id, 
  LEFT( 
    ( 
      SELECT iav.value 
      FROM item_attribute_value iav 
      WHERE iav.id = ((ii.extra -> 'stones')-> 0 ->> 'color')::uuid 
    ), 
    1 
  ) AS color, 
  ii.price_amount,
  au.username
FROM pawn_ticket pt 
JOIN customer c ON pt.customer_id = c.id 
JOIN pawn_ticket_item pti ON pti.pawn_ticket_id = pt.id 
JOIN inventory_item ii ON ii.id = pti.inventory_item_id 
JOIN inventory_subcategory isub ON isub.id = ii.inventory_subcategory_id 
JOIN inventory_brand ib ON ib.id = ii.inventory_brand_id 
JOIN app_user au ON au.id = pt.created_by
WHERE pt.created_at >= $1 
  AND pt.created_at < $2 
ORDER BY pt.created_at ASC, pt.control_number ASC, ii.id ASC;
