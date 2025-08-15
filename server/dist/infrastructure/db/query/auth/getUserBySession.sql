SELECT
  u.id,
  u.username,
  ARRAY_REMOVE(ARRAY_AGG(r.name), NULL) AS roles
FROM session s
JOIN app_user u ON u.id = s.user_id
LEFT JOIN app_user_role ur ON ur.user_id = u.id
LEFT JOIN role r ON r.id = ur.role_id
WHERE s.id = $1
  AND s.expires_at > now()
GROUP BY u.id, u.username;
