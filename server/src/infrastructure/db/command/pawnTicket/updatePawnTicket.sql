UPDATE pawn_ticket SET
  control_number = COALESCE($2, control_number),
  -- pawn_ticket_type immutable after creation
  maturity_date = COALESCE($3, maturity_date),
  default_date = COALESCE($4, default_date),
  updated_at = now()
WHERE id = $1;
