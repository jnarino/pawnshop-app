SELECT 
    h.id,
    h.control_number,
    h.hold_date,
    h.agency,
    h.case_number,
    h.date_out,
    h.is_hold,
    h.is_inventory,
    h.comment,
    h.agent_last_name,
    h.agent_first_name,
    h.agent_middle_initial,
    h.badge_number,
    h.phone_area_code,
    h.phone_number,
    h.phone_extension,
    h.jurisdiction,
    h.legacy_hcn_id,
    MAX(clerk.username) AS clerk_username,
    MAX(updater.username) AS updated_by_username,
    h.created_at,
    h.updated_at,
    COALESCE(
        jsonb_agg(
            jsonb_build_object(
                'id', ii.id,
                'inventorySubcategory', jsonb_build_object(
                    'id', isc.id,
                    'name', isc.name
                ),
                'inventoryCategory', jsonb_build_object(
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
                'serialNumber', ii.serial_number,
                'colorId', ii.color,
                'itemCondition', ii.item_condition,
                'ownerMark', ii.owner_mark,
                'itemDescription', ii.item_description,
                'priceAmount', ii.price_amount,
                'inventoryNumber', ii.inventory_number
            )
        ) FILTER (WHERE ii.id IS NOT NULL),
        '[]'::jsonb
    ) as items
FROM hold_item h
LEFT JOIN hold_item_inventory hi ON hi.hold_item_id = h.id
LEFT JOIN inventory_item ii ON ii.id = hi.inventory_item_id
LEFT JOIN inventory_subcategory isc ON isc.id = ii.inventory_subcategory_id
LEFT JOIN inventory_category ic ON ic.id = isc.inventory_category_id
LEFT JOIN inventory_brand ib ON ib.id = ii.inventory_brand_id
LEFT JOIN app_user clerk ON clerk.id = h.clerk_user_id
LEFT JOIN app_user updater ON updater.id = h.updated_by
WHERE 1=1
-- Filters will be appended dynamically or via IS NULL checks
    AND ($1::text IS NULL OR h.control_number = $1)
    AND ($2::text IS NULL OR h.case_number = $2)
    AND ($3::text IS NULL OR ii.inventory_number = $3)
    AND ($4::text IS NULL OR h.jurisdiction ILIKE '%' || $4 || '%')
    AND ($5::text IS NULL OR h.agency ILIKE '%' || $5 || '%')
GROUP BY h.id
ORDER BY h.hold_date DESC;
