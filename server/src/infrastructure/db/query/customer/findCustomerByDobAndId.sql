SELECT 
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
    created_at,
    updated_at
FROM customer
WHERE date_of_birth = $1 
  AND id_number = $2
LIMIT 1;
