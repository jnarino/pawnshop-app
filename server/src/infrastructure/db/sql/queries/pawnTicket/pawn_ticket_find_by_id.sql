SELECT 
  p.*,
  au.username as clerk_username,
  ARRAY(SELECT pti.inventory_item_id FROM pawn_ticket_item pti WHERE pti.pawn_ticket_id = p.id) AS item_ids
FROM pawn_ticket p
LEFT JOIN app_user au ON au.id = p.created_by
WHERE p.id = $1;