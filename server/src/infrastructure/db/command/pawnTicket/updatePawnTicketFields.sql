UPDATE pawn_ticket 
SET updated_at = NOW() 
WHERE id = $1;
