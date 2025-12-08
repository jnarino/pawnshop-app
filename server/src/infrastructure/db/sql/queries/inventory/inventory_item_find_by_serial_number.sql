SELECT *
FROM inventory_item
WHERE serial_number = $1
LIMIT 1;
