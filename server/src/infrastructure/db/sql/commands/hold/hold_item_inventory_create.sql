INSERT INTO hold_item_inventory (
    id,
    hold_item_id,
    inventory_item_id,
    created_at
) VALUES (
    $1,
    $2,
    $3,
    NOW()
);
