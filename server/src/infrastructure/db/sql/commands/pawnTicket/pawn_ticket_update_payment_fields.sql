UPDATE pawn_ticket
SET total_of_payments = total_of_payments + $1,
    transaction_date = $2,
    updated_at = $3,
    default_date = $4,
    maturity_date = $5
    {STATUS_CLAUSE}
WHERE id = $6;
