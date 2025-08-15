-- Aligned with migration table 'customer' and column names
INSERT INTO customer (
  first_name, middle_name, last_name, suffix,
  date_of_birth, sex, eye_color, height, street_address,
  city, state_us, zip_code, id_number,
  id_expiration, id_issue_date, issuing_state,
  phone_number, email
) VALUES (
  $1, $2, $3, $4,
  $5, $6, $7, $8, $9,
  $10, $11, $12, $13,
  $14, $15, $16,
  $17, $18
)
RETURNING id;
