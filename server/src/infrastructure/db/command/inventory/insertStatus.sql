INSERT INTO inventory_status (
  code, 
  description, 
  is_terminal, 
  sort_order, 
  active
) VALUES ($1, $2, $3, $4, true);
