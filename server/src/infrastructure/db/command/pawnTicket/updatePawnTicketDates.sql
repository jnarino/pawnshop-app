UPDATE pawn_ticket 
SET 
  maturity_date = COALESCE($2, maturity_date),
  default_date = COALESCE($3, default_date),
  updated_at = NOW()
WHERE id = $1;
