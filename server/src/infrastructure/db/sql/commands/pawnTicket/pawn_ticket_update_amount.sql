UPDATE pawn_ticket
SET 
  amount_financed = $2,
  updated_at = NOW()
WHERE id = $1
RETURNING *;
