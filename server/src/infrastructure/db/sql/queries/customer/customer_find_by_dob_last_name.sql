SELECT *
FROM customer
WHERE date_of_birth = $1
  AND last_name ILIKE $2 || '%'
ORDER BY last_name, first_name, date_of_birth NULLS LAST;
