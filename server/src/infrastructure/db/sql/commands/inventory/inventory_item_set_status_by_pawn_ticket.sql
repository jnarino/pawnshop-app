-- Sets status for all inventory items linked to a pawn ticket
UPDATE inventory_item
SET status = $2,
    updated_at = NOW()
WHERE id IN (
  SELECT inventory_item_id FROM pawn_ticket_item WHERE pawn_ticket_id = $1
);