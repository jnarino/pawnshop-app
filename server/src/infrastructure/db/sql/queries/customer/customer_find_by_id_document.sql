SELECT *
FROM customer
WHERE id_type = $1
  AND id_number = $2
  AND id_state = $3
ORDER BY last_name, first_name, date_of_birth NULLS LAST;
