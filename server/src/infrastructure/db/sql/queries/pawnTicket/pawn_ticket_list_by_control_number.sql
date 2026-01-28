SELECT
  pt.id,
  pt.control_number,
  pt.transaction_type,
  pt.customer_id,
  c.first_name,
  c.last_name,
  pt.amount_financed,
  pt.finance_charge,
  pt.periodic_rate,
  pt.total_of_payments,
  pt.apr,
  pt.purchase_trade_value,
  pt.transaction_date,
  pt.maturity_date,
  pt.default_date,
  pt.created_at,
  pt.created_by AS clerk_user_id,
  au.username AS clerk_username,
  pts.status AS pawn_status,
  -- Aggregate inventory item ids for convenience
  COALESCE(
    array_agg(pti.inventory_item_id ORDER BY pti.inventory_item_id)
      FILTER (WHERE pti.inventory_item_id IS NOT NULL),
    '{}'
  ) AS item_ids,
  -- Aggregate inventory items as JSONB array (detailed objects)
  COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id', ii.id,
        'inventory_subcategory', jsonb_build_object(
          'id', isc.id,
          'name', isc.name
        ),
        'inventory_category', jsonb_build_object(
          'id', ic.id,
          'name', ic.name
        ),
        'status', ii.status,
        'quantity', ii.quantity,
        'brand', CASE 
          WHEN ib.id IS NOT NULL THEN jsonb_build_object(
            'id', ib.id,
            'name', ib.name
          )
          ELSE NULL
        END,
        'model', ii.model,
        'serial_number', ii.serial_number,
        'color_id', CASE 
          WHEN ii.color IS NOT NULL THEN jsonb_build_object(
            'id', ii.color,
            'name', iav_color.value
          )
          ELSE NULL
        END,
        'item_condition', ii.item_condition,
        'owner_mark', ii.owner_mark,
        'item_description', ii.item_description,
        'price_amount', ii.price_amount,
        'resale', ii.resale,
        'min_resale', ii.min_resale,
        'item_replace', ii.item_replace,
        'extra', (
          CASE
            WHEN ii.extra IS NULL THEN NULL
            ELSE (
              jsonb_build_object(
                'stones', (
                  CASE
                    WHEN ii.extra ? 'stones' THEN (
                      SELECT jsonb_agg(
                        (
                          jsonb_build_object(
                            'type', CASE
                              WHEN iav_type.id IS NOT NULL THEN jsonb_build_object('id', iav_type.id, 'name', iav_type.value, 'attribute_type_id', iav_type.attribute_type_id)
                              ELSE stone->'type'
                            END,
                            'color', CASE
                              WHEN iav_stone_color.id IS NOT NULL THEN jsonb_build_object('id', iav_stone_color.id, 'name', iav_stone_color.value, 'attribute_type_id', iav_stone_color.attribute_type_id)
                              ELSE stone->'color'
                            END,
                            'shape', CASE
                              WHEN iav_shape.id IS NOT NULL THEN jsonb_build_object('id', iav_shape.id, 'name', iav_shape.value, 'attribute_type_id', iav_shape.attribute_type_id)
                              ELSE stone->'shape'
                            END
                          ) || (stone - 'type' - 'color' - 'shape')
                        )
                      )
                      FROM jsonb_array_elements(ii.extra->'stones') stone
                      LEFT JOIN item_attribute_value iav_type ON iav_type.id = CASE WHEN (stone->>'type') ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN (stone->>'type')::uuid ELSE NULL END
                      LEFT JOIN item_attribute_value iav_stone_color ON iav_stone_color.id = CASE WHEN (stone->>'color') ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN (stone->>'color')::uuid ELSE NULL END
                      LEFT JOIN item_attribute_value iav_shape ON iav_shape.id = CASE WHEN (stone->>'shape') ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN (stone->>'shape')::uuid ELSE NULL END
                    )
                    ELSE NULL
                  END
                )
              ) || (ii.extra - 'stones')
            )
          END
        ),
        'attributes', (
          CASE WHEN ii.attributes IS NULL THEN NULL ELSE (
            (
              SELECT jsonb_object_agg(
                attr.key,
                CASE
                  WHEN attrval.id IS NOT NULL THEN jsonb_build_object('id', attrval.id, 'name', attrval.value, 'attribute_type_id', attrval.attribute_type_id)
                  ELSE attr.value
                END
              )
              FROM jsonb_each(ii.attributes) attr
              LEFT JOIN item_attribute_value attrval ON attrval.id = CASE WHEN (attr.value #>> '{}') ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN (attr.value #>> '{}')::uuid ELSE NULL END
            )
          ) END
        ),
        'legacy_inventory_number', ii.legacy_inventory_number,
        'legacy_item_guid', ii.legacy_item_guid,
        'legacy_category_description', ii.legacy_category_description,
        'legacy_brand_color_description', ii.legacy_brand_color_description,
        'inventory_number', ii.inventory_number,
        'last_updated_user_id', ii.last_updated_user_id,
        'created_at', ii.created_at,
        'updated_at', ii.updated_at
      ) ORDER BY ii.created_at
    ) FILTER (WHERE ii.id IS NOT NULL),
    '[]'::jsonb
  ) AS items_data
FROM pawn_ticket pt
LEFT JOIN pawn_ticket_status pts
  ON pts.id = pt.status_id
LEFT JOIN customer c
  ON pt.customer_id = c.id
LEFT JOIN app_user au
  ON au.id = pt.created_by
LEFT JOIN pawn_ticket_item pti
  ON pti.pawn_ticket_id = pt.id
LEFT JOIN inventory_item ii
  ON ii.id = pti.inventory_item_id
LEFT JOIN inventory_subcategory isc
  ON isc.id = ii.inventory_subcategory_id
LEFT JOIN inventory_category ic
  ON ic.id = isc.inventory_category_id
LEFT JOIN inventory_brand ib
  ON ib.id = ii.inventory_brand_id
LEFT JOIN item_attribute_value iav_color
  ON iav_color.id = ii.color
WHERE pt.control_number = $1
GROUP BY
  pt.id,
  pt.control_number,
  pt.transaction_type,
  pt.customer_id,
  c.first_name,
  c.last_name,
  pt.amount_financed,
  pt.finance_charge,
  pt.periodic_rate,
  pt.total_of_payments,
  pt.apr,
  pt.purchase_trade_value,
  pt.transaction_date,
  pt.maturity_date,
  pt.default_date,
  pt.created_at,
  pt.created_by,
  au.username,
  pts.status
ORDER BY pt.transaction_date DESC;
