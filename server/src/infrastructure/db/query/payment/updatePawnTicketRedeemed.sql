UPDATE pawn_ticket 
SET pawn_status = 'redeemed',
    last_payment_at = NOW(),
    last_activity_at = NOW(),
    updated_at = NOW()
WHERE id = $1;
