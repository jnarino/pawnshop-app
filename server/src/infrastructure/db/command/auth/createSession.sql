INSERT INTO session (id, user_id, expires_at, last_seen_at)
VALUES ($1, $2, $3, NOW())
RETURNING id;
