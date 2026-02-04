SELECT *
FROM customer
WHERE first_name ILIKE $1 || '%'
ORDER BY last_name, first_name, date_of_birth NULLS LAST;
