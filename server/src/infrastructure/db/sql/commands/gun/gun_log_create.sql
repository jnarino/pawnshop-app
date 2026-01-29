INSERT INTO gunlog (
    id,
    inventory_item_id,
    manufacturer,
    model,
    serial,
    caliber,
    action,
    condition,
    guntype,
    importer,
    buyer_amount,
    buyer_date,
    buyer_first_name,
    buyer_middle_name,
    buyer_last_name,
    buyer_street_address,
    buyer_city,
    buyer_state_us,
    buyer_zip_code,
    buyer_id_type,
    buyer_id_number,
    created_at,
    updated_at
) VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
    $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21,
    NOW(), NOW()
);
