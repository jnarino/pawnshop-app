SELECT 
    i.*
FROM inventory_item i
JOIN pawn_ticket_item pti ON pti.inventory_item_id = i.id
WHERE pti.pawn_ticket_id = $1;
