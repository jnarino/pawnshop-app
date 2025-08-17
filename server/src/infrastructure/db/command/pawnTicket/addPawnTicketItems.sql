INSERT INTO pawn_ticket_item (pawn_ticket_id, inventory_item_id)
SELECT $1, UNNEST($2::uuid[]);
