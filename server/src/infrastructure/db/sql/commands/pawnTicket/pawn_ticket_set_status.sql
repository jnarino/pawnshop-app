-- Sets the status of a pawn ticket (by status code)
UPDATE pawn_ticket
SET status_id = (
  SELECT id FROM pawn_ticket_status WHERE status = $2 AND transaction_type = pawn_ticket.transaction_type LIMIT 1
),
updated_at = NOW()
WHERE id = $1;