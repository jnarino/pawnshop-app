SELECT *
FROM customer
WHERE date_of_birth = $1
ORDER BY last_name, first_name, date_of_birth NULLS LAST;
