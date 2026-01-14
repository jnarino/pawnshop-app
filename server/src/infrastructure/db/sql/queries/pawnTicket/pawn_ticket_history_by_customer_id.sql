-- List pawn history for a customer with status, dates, amounts, and items
-- Params: $1 = customer_id (uuid)
SELECT
  pt.id,
  pt.control_number,
  pt.created_at AS date_in,
  pt.default_date AS date_out,
  pts.description AS status,
  pt.original_pawn_amount AS amount,
  pt.total_of_payments AS amount_paid,
  JSON_AGG(
    JSON_BUILD_OBJECT(
      'id', ii.id,
      'description', TRIM(ii.item_description)
    ) ORDER BY ii.item_description
  ) AS items
FROM pawn_ticket pt
INNER JOIN pawn_ticket_item pti ON pti.pawn_ticket_id = pt.id
INNER JOIN inventory_item ii ON ii.id = pti.inventory_item_id AND ii.status IN ('U', 'T', 'V')
INNER JOIN pawn_ticket_status pts ON pts.id = pt.status_id
WHERE pt.customer_id = $1
GROUP BY pt.id, pt.control_number, pt.created_at, pt.default_date, pt.original_pawn_amount, pt.total_of_payments, pts.description
ORDER BY pt.created_at DESC;