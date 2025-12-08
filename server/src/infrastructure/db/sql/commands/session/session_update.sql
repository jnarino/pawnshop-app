UPDATE app_user_session
SET
  last_seen_at = $2,
  revoked_at = $3
WHERE id = $1;
