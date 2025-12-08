INSERT INTO customer (
  old_customer_pk,
  old_customer_id,
  first_name,
  middle_name,
  last_name,
  street_address,
  suite_number,
  city,
  state_us,
  zip_code,
  phone_number,
  height,
  weight,
  hair_color_id,
  eye_color_id,
  race,
  sex,
  marks,
  date_of_birth,
  birth_city,
  birth_state,
  birth_country,
  id_type,
  id_number,
  id_expiration,
  id_issue_date,
  ss_number,
  id_address,
  id_suite_number,
  id_city,
  id_state,
  id_zip,
  employer_name,
  employer_address,
  employer_suite_number,
  employer_city,
  employer_state,
  employer_zip,
  employer_phone_number,
  description,
  ffl_number,
  locked,
  tax_id,
  cell_phone,
  email,
  entered_at,
  military,
  ffl_expire_date,
  tax_exempt,
  tax_exempt_certificate
)
VALUES (
  $1,  -- old_customer_pk
  $2,  -- old_customer_id
  $3,  -- first_name
  $4,  -- middle_name
  $5,  -- last_name
  $6,  -- street_address
  $7,  -- suite_number
  $8,  -- city
  $9,  -- state_us
  $10, -- zip_code
  $11, -- phone_number
  $12, -- height
  $13, -- weight
  $14, -- hair_color_id
  $15, -- eye_color_id
  $16, -- race
  $17, -- sex
  $18, -- marks
  $19, -- date_of_birth
  $20, -- birth_city
  $21, -- birth_state
  $22, -- birth_country
  $23, -- id_type
  $24, -- id_number
  $25, -- id_expiration
  $26, -- id_issue_date
  $27, -- ss_number
  $28, -- id_address
  $29, -- id_suite_number
  $30, -- id_city
  $31, -- id_state
  $32, -- id_zip
  $33, -- employer_name
  $34, -- employer_address
  $35, -- employer_suite_number
  $36, -- employer_city
  $37, -- employer_state
  $38, -- employer_zip
  $39, -- employer_phone_number
  $40, -- description
  $41, -- ffl_number
  $42, -- locked
  $43, -- tax_id
  $44, -- cell_phone
  $45, -- email
  $46, -- entered_at
  $47, -- military
  $48, -- ffl_expire_date
  $49, -- tax_exempt
  $50  -- tax_exempt_certificate
)
RETURNING *;
