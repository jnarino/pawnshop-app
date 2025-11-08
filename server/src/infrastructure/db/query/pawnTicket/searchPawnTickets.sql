/* Dynamic-ish search via optional filters. Parameters:
  $1: customer_id UUID or NULL
  $2: pawn_ticket_type or NULL
  $3: start transaction_date (inclusive) or NULL
  $4: end transaction_date (inclusive) or NULL
  $5: limit
  $6: offset
*/
SELECT
  pt.id,
  pt.control_number        AS "controlNumber",
  pt.pawn_ticket_type      AS "type",
  pt.customer_id           AS "customerId",
  pt.amount_financed       AS "amountFinanced",
  pt.finance_charge        AS "financeCharge",
  pt.periodic_rate         AS "periodicRate",
  pt.total_of_payments     AS "totalOfPayments",
  pt.apr                   AS "annualPercentageRate",
  pt.purchase_trade_value  AS "purchaseTradeValue",
  pt.transaction_date      AS "transactionDate",
  pt.maturity_date         AS "maturityDate",
  pt.default_date          AS "defaultDate",
  pt.created_at            AS "createdAt",
  pt.updated_at            AS "updatedAt"
FROM pawn_ticket pt
WHERE ($1 IS NULL OR pt.customer_id = $1)
  AND ($2 IS NULL OR pt.pawn_ticket_type = $2)
  AND ($3 IS NULL OR pt.transaction_date >= $3)
  AND ($4 IS NULL OR pt.transaction_date <= $4)
ORDER BY pt.transaction_date DESC
LIMIT COALESCE($5, 50)
OFFSET COALESCE($6, 0);
