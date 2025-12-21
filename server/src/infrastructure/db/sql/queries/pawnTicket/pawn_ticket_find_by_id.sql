SELECT 
  p.*, 
  ARRAY(SELECT pti.inventory_item_id FROM pawn_ticket_item pti WHERE pti.pawn_ticket_id = p.id) AS item_ids
FROM pawn_ticket p
WHERE p.id = $1;