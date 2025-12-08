INSERT INTO
    inventory_item (
        id,
        category_id,
        status,
        brand,
        model,
        serial_number,
        color_id,
        item_condition,
        quantity,
        price_amount,
        resale,
        min_resale,
        item_replace,
        owner_mark,
        item_description,
        extra,
        attributes,
        legacy_inventory_number,
        legacy_item_guid,
        legacy_category_description,
        legacy_brand_color_description,
        inventory_number,
        last_updated_user_id,
        created_at,
        updated_at
    )
VALUES (
        $1, -- id
        $2, -- category_id
        $3, -- status
        $4, -- brand
        $5, -- model
        $6, -- serial_number
        $7, -- color_id
        $8, -- item_condition
        $9, -- quantity
        $10, -- price_amount
        $11, -- resale
        $12, -- min_resale
        $13, -- item_replace
        $14, -- owner_mark
        $15, -- item_description
        $16, -- extra
        $17, -- attributes
        $18, -- legacy_inventory_number
        $19, -- legacy_item_guid
        $20, -- legacy_category_description
        $21, -- legacy_brand_color_description
        $22, -- inventory_number
        $23, -- last_updated_user_id
        $24 -- created_at / updated_at (same as in domain)
    ) RETURNING *;