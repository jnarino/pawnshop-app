SELECT code, description, is_terminal, sort_order, active FROM inventory_item_status WHERE code = $1;
