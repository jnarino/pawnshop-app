SELECT code, description, is_terminal, sort_order, active FROM inventory_item_status_lu WHERE code = $1;
