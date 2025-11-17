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
WHERE ($1::text IS NULL OR LOWER(first_name) LIKE LOWER('%' || $1 || '%'))
  AND ($2::text IS NULL OR LOWER(last_name) LIKE LOWER('%' || $2 || '%'))
  AND ($3::date IS NULL OR date_of_birth = $3)
ORDER BY last_name, first_name
LIMIT COALESCE($4, 50) OFFSET COALESCE($5, 0);