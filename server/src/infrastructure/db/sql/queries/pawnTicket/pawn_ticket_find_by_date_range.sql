SELECT
  ps.status AS pawn_status,

  -- pawn_ticket (pt) columns
  pt.id,
  pt.control_number,
  pt.transaction_type,
  pt.customer_id,
  pt.amount_financed,
  pt.original_pawn_amount,
  pt.periodic_rate,
  pt.total_of_payments,
  pt.apr,
  pt.purchase_trade_value,
  pt.transaction_date,
  pt.maturity_date,
  pt.default_date,
  pt.rate_plan_id,
  pt.default_marked_at,
  pt.default_marked_by,
  pt.default_reason,
  pt.status_id,
  pt.created_by,
  au.username AS clerk_username,
  pt.created_at,
  pt.updated_at,

  -- customer (c) columns
  c.first_name,
  c.last_name,

  -- inventory_item (ii) columns - aggregated into JSONB array
  COALESCE(
    json_agg(
      json_build_object(
        'id', ii.id,
        'inventory_subcategory', json_build_object('id', isc.id, 'name', isc.name),
        'inventory_category', json_build_object('id', ic.id, 'name', ic.name),
        'brand', json_build_object('id', ib.id, 'name', ib.name),
        'status', ii.status,
        'model', ii.model,
        'serial_number', ii.serial_number,
        'color_id', ii.color,
        'item_condition', ii.item_condition,
        'quantity', ii.quantity,
        'price_amount', ii.price_amount,
        'resale', ii.resale,
        'min_resale', ii.min_resale,
        'item_replace', ii.item_replace,
        'owner_mark', ii.owner_mark,
        'item_description', ii.item_description,
        'bin_location', ii.bin_location,
        'extra', ii.extra,
        'attributes', ii.attributes,
        'legacy_inventory_number', ii.legacy_inventory_number,
        'legacy_item_guid', ii.legacy_item_guid,
        'legacy_category_description', ii.legacy_category_description,
        'legacy_brand_color_description', ii.legacy_brand_color_description,
        'inventory_number', ii.inventory_number,
        'last_updated_user_id', ii.last_updated_user_id,
        'created_at', ii.created_at,
        'updated_at', ii.updated_at
      ) ORDER BY ii.id
    )
    FILTER (WHERE ii.id IS NOT NULL),
    '[]'::json
  ) AS items_data,

  COALESCE(
    array_agg(pti.inventory_item_id ORDER BY pti.inventory_item_id)
      FILTER (WHERE pti.inventory_item_id IS NOT NULL),
    '{}'::uuid[]
  ) AS item_ids

FROM pawn_ticket pt
JOIN pawn_ticket_status ps ON ps.id = pt.status_id
LEFT JOIN app_user au ON au.id = pt.created_by
LEFT JOIN pawn_ticket_item pti ON pti.pawn_ticket_id = pt.id
LEFT JOIN inventory_item ii ON ii.id = pti.inventory_item_id
LEFT JOIN inventory_subcategory isc ON ii.inventory_subcategory_id = isc.id
LEFT JOIN inventory_category ic ON isc.inventory_category_id = ic.id
LEFT JOIN inventory_brand ib ON ii.inventory_brand_id = ib.id
LEFT JOIN customer c ON pt.customer_id = c.id

WHERE (pt.default_date + interval '1 day') >= $1 
  AND (pt.default_date + interval '1 day') < $2
  AND ps.status IN ('P', 'B')

GROUP BY
  pt.id,
  pt.control_number,
  pt.transaction_type,
  pt.customer_id,
  pt.amount_financed,
  pt.original_pawn_amount,
  pt.periodic_rate,
  pt.total_of_payments,
  pt.apr,
  pt.purchase_trade_value,
  pt.transaction_date,
  pt.maturity_date,
  pt.default_date,
  pt.rate_plan_id,
  pt.default_marked_at,
  pt.default_marked_by,
  pt.default_reason,
  pt.status_id,
  pt.created_by,
  au.username,
  pt.created_at,
  pt.updated_at,
  ps.status,
  c.first_name,
  c.last_name

ORDER BY pt.created_at DESC;
