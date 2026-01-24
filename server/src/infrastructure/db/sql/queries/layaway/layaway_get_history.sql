SELECT 
  store_transaction.occurred_at, 
  store_transaction_type.name as transaction_type, 
  app_user.username as clerk_username, 
  store_transaction.amount  
FROM store_transaction 
JOIN store_transaction_type ON store_transaction_type.id = store_transaction.type_id
JOIN app_user ON app_user.id = store_transaction.clerk_user_id
JOIN layaway_agreement ON layaway_agreement.ticketnum = store_transaction.legacy_ticketnum
WHERE store_transaction.customer_id = $1 
  AND store_transaction.legacy_ticketnum = $2
  AND store_transaction.customer_id = layaway_agreement.customer_id
  AND store_transaction_type.code IN ('SL','SLD','SLP','SLU','SLV','SLX')
ORDER BY store_transaction.occurred_at DESC;
