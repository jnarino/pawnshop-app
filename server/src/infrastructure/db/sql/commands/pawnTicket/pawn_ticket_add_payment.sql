-- Adds a payment to a pawn ticket (updates total_of_payments and last_payment_at)
UPDATE pawn_ticket
SET total_of_payments = COALESCE(total_of_payments, 0) + $2,
    last_payment_at = NOW(),
    updated_at = NOW()
WHERE id = $1;