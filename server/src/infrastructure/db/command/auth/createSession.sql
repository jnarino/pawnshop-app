INSERT INTO session (user_id, expires_at)
VALUES ($1, now() + interval '8 hours')
RETURNING id;
