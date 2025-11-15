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
  AND ($4::text IS NULL OR phone_number = $4)
  AND ($5::text IS NULL OR id_number = $5)
ORDER BY last_name, first_name
LIMIT $6 OFFSET $7;
