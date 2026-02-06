UPDATE hold_item
SET
    hold_date = $2,
    agency = $3,
    case_number = $4,
    is_hold = $5,
    is_inventory = $6,
    comment = $7,
    agent_last_name = $8,
    agent_first_name = $9,
    agent_middle_initial = $10,
    badge_number = $11,
    phone_area_code = $12,
    phone_number = $13,
    phone_extension = $14,
    jurisdiction = $15,
    updated_at = NOW()
WHERE id = $1
RETURNING *;
