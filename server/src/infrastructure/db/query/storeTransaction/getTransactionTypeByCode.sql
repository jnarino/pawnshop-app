SELECT id, code, name, cash_dir
FROM store_transaction_type 
WHERE code = $1 AND active = true;
