SELECT id
FROM pawn_ticket_status
WHERE status = $1
  AND transaction_type = $2
  AND is_active = true
LIMIT 1;
