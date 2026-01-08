SELECT
	ii.id,
	ii.inventory_subcategory_id,
	ii.status,
	ii.quantity,
	ii.inventory_brand_id,
	ii.model,
	ii.serial_number,
	ii.color,
	ii.item_condition,
	ii.owner_mark,
	ii.item_description,
	ii.price_amount,
	ii.resale,
	ii.min_resale,
	ii.item_replace,
	-- Build mapped extra JSON similar to pawn_ticket_list_by_control_number
	(
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
	) AS extra,
	-- Build mapped attributes JSON similar to pawn_ticket_list_by_control_number
	(
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
	) AS attributes,
	ii.legacy_inventory_number,
	ii.legacy_item_guid,
	ii.legacy_category_description,
	ii.legacy_brand_color_description,
	ii.inventory_number,
	ii.last_updated_user_id,
	ii.created_at,
	ii.updated_at,
	-- lookups
	isub.id AS subcategory_id,
	isub.name AS subcategory_name,
	icat.id AS category_id,
	icat.name AS category_name,
	ibrand.id AS brand_id,
	ibrand.name AS brand_name
FROM inventory_item ii
LEFT JOIN inventory_subcategory isub ON ii.inventory_subcategory_id = isub.id
LEFT JOIN inventory_category icat ON isub.inventory_category_id = icat.id
LEFT JOIN inventory_brand ibrand ON ii.inventory_brand_id = ibrand.id
WHERE ii.inventory_number = $1
LIMIT 1;
