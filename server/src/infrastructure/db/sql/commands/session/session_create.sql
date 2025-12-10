INSERT INTO app_user_session (
  id,
  user_id,
  created_at,
  last_seen_at,
  revoked_at,
  refresh_token_hash
) VALUES (
  $1,$2,$3,$4,$5,$6
)
RETURNING
  id,
  user_id,
  created_at,
  last_seen_at,
  revoked_at,
  refresh_token_hash;
