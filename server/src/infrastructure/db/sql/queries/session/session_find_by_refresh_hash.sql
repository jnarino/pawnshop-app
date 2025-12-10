SELECT
  id,
  user_id,
  created_at,
  last_seen_at,
  revoked_at,
  refresh_token_hash
FROM app_user_session
WHERE refresh_token_hash = $1;
