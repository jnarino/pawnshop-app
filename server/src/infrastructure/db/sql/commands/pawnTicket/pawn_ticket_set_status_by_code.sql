-- Update pawn ticket status, transaction_date, and default_marked_by
UPDATE pawn_ticket 
SET 
    status_id = $1,
    transaction_date = $2,
    default_marked_by = $3,
    default_marked_at = NOW(),
    updated_at = NOW()
WHERE id = $4;
