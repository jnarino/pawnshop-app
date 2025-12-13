SELECT
  ptp.pawn_ticket_id,
  ptp.payment_date,
  ptp.principal_paid,
  ptp.clerk_user_id
FROM pawn_ticket_payment ptp
WHERE ptp.pawn_ticket_id = $1
ORDER BY ptp.payment_date;
