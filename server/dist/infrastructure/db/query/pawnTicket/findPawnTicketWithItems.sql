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
  pt.updated_at            AS "updatedAt",
  ARRAY(SELECT inventory_item_id FROM pawn_ticket_item pti WHERE pti.pawn_ticket_id = pt.id) AS "inventoryItemIds"
FROM pawn_ticket pt
WHERE pt.id = $1;
