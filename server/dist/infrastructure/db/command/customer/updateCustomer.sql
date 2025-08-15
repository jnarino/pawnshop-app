-- Aligned with migration table 'customer' and column names
UPDATE customer
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
  state_us        = $11,
  zip_code        = $12,
  id_number       = $13,
  id_expiration   = $14,
  id_issue_date   = $15,
  issuing_state   = $16,
  phone_number    = $17,
  email           = $18,
  updated_at      = now()
WHERE id = $19
RETURNING id;
