SELECT
  id,
  customer_id       AS "customerId",
  item_description  AS "itemDescription",
  principal_amount  AS "principalAmount",
  interest_rate     AS "interestRate",
  date_issued       AS "dateIssued",
  due_date          AS "dueDate",
  status
FROM pawn_tickets
ORDER BY date_issued DESC;
