UPDATE customer 
SET locked = true, updated_at = now()
WHERE id = $1
RETURNING 
    id,
    first_name,
    middle_name,
    last_name,
    street_address,
    suite_number,
    city,
    state_us,
    zip_code,
    phone_number,
    date_of_birth,
    id_number,
    locked,
    created_at,
    updated_at;
