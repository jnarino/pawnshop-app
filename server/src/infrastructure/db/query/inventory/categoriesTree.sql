select id, name, code, parent_id
from inventory_category
order by coalesce(parent_id, '00000000-0000-0000-0000-000000000000'), name;