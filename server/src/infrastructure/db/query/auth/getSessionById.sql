SELECT id, user_id, expires_at, last_seen_at
FROM session
WHERE id = $1 AND expires_at > NOW();
