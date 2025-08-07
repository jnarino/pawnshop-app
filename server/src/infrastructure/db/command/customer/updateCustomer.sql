UPDATE customers
SET
  first_name      = $1,
  middle_name     = $2,
  last_name       = $3,
  suffix          = $4,
  date_of_birth   = $5,
  sex             = $6,
  eye_color       = $7,
  height          = $8,
  street_address  = $9,
  city            = $10,
  us_state        = $11,
  zipcode         = $12,
  id_number       = $13,
  issue_date      = $14,
  expiration_date = $15,
  issuing_state   = $16,
  phone           = $17,
  email           = $18
WHERE id = $19;
