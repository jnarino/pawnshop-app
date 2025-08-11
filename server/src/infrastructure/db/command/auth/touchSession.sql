UPDATE session SET last_seen_at = now() WHERE id = $1;
