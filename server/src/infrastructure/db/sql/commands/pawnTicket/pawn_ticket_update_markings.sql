-- Update transaction_date and default_marked_by for a pawn ticket
UPDATE pawn_ticket
SET transaction_date = $1,
    default_marked_by = $2,
    default_marked_at = NOW(),
    updated_at = NOW()
WHERE id = $3;