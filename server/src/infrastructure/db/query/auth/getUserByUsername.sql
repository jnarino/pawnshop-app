SELECT id, username, password_hash, is_active
FROM app_user
WHERE username = $1;
