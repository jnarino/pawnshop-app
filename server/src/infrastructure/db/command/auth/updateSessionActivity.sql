UPDATE session
SET last_seen_at = NOW(),
    expires_at = $2
WHERE id = $1;
