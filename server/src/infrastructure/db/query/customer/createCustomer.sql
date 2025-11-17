INSERT INTO customer (
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
    id_number
) VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
) RETURNING id;
