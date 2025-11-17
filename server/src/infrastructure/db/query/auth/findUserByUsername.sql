SELECT 
  u.id, 
  u.username, 
  u.password_hash, 
  u.is_active,
  COALESCE(array_agg(r.name) FILTER (WHERE r.name IS NOT NULL), '{}') AS roles
FROM app_user u
LEFT JOIN app_user_role ur ON ur.user_id = u.id
LEFT JOIN role r ON r.id = ur.role_id
WHERE u.username = $1
GROUP BY u.id, u.username, u.password_hash, u.is_active;
