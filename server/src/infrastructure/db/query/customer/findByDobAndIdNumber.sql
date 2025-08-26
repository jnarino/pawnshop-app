select c.*
from customer c
where c.date_of_birth = $1
  and c.id_number = $2
limit 1;