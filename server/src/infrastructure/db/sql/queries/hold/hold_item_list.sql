SELECT 
    h.id,
    h.control_number,
    h.customer_id,
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
    h.updated_by,
    h.created_at,
    h.updated_at,
    i.id as inventory_item_id,
    i.model,
    i.item_description,
    i.serial_number,
    i.inventory_number
FROM hold_item h
JOIN hold_item_inventory hi ON hi.hold_item_id = h.id
JOIN inventory_item i ON i.id = hi.inventory_item_id
WHERE 1=1
-- Filters will be appended dynamically or via IS NULL checks
    AND ($1::text IS NULL OR h.control_number = $1)
    AND ($2::text IS NULL OR h.case_number = $2)
    AND ($3::text IS NULL OR i.inventory_number = $3)
    AND ($4::text IS NULL OR h.jurisdiction ILIKE '%' || $4 || '%')
    AND ($5::text IS NULL OR h.agency ILIKE '%' || $5 || '%')
ORDER BY h.hold_date DESC;
