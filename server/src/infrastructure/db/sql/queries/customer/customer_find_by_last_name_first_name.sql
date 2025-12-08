SELECT *
FROM customer
WHERE last_name ILIKE $1 || '%'
  AND first_name ILIKE $2 || '%'
ORDER BY last_name, first_name, date_of_birth NULLS LAST;
