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
    ii.extra,
    ii.attributes,
    ii.legacy_inventory_number,
    ii.legacy_item_guid,
    ii.legacy_category_description,
    ii.legacy_brand_color_description,
    ii.inventory_number,
    ii.last_updated_user_id,
    ii.created_at,
    ii.updated_at,
    isc.id AS subcategory_id,
    isc.name AS subcategory_name,
    ic.id AS category_id,
    ic.name AS category_name,
    ib.id AS brand_id,
    ib.name AS brand_name
FROM inventory_item ii
LEFT JOIN inventory_brand ib ON ib.id = ii.inventory_brand_id
LEFT JOIN inventory_subcategory isc ON isc.id = ii.inventory_subcategory_id
LEFT JOIN inventory_category ic ON ic.id = isc.inventory_category_id
WHERE 1=1
    AND ($1::text IS NULL OR ib.name = $1)
    AND ($2::text IS NULL OR ic.name = $2)
    AND ($3::text IS NULL OR isc.name = $3)
    AND ($4::text IS NULL OR ii.serial_number ILIKE '%' || $4 || '%')
    AND ($5::text IS NULL OR ii.model ILIKE '%' || $5 || '%')
ORDER BY ii.created_at DESC;
