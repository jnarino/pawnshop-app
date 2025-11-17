INSERT INTO inventory_category (
    name,
    code,
    parent_id
) VALUES (
    $1, $2, $3
) RETURNING id;
