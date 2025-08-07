INSERT INTO customers (
  first_name, middle_name, last_name, suffix,
  date_of_birth, sex, eye_color, height, streetaddress,
  city, us_state, zipcode, id_number,
  issue_date, expiration_date, issuing_state,
  phone, email
) VALUES (
  $1, $2, $3, $4,
  $5, $6, $7, $8, $9,
  $10, $11, $12, $13,
  $14, $15, $16,
  $17, $18
)
RETURNING id;
