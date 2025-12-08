SELECT
  u.id,
  u.username,
  u.password_hash,
  u.first_name,
  u.middle_name,
  u.last_name,
  u.street_address,
  u.suite_number,
  u.city,
  u.state_us,
  u.zip_code,
  u.phone_number,
  u.ss_number,
  u.birth_date,
  u.starting_date,
  u.terminated_date,
  u.is_active,
  u.role_id,
  r.name AS role_name,
  u.created_at,
  u.updated_at
FROM app_user AS u
JOIN role AS r ON r.id = u.role_id
ORDER BY u.username;
