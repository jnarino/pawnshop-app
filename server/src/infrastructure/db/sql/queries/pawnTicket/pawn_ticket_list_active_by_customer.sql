SELECT
  pt.id,
  pt.control_number,
  pt.transaction_type,
  pt.customer_id,
  pt.default_marked_by,
  pt.amount_financed,
  pt.finance_charge,
  pt.periodic_rate,
  pt.total_of_payments,
  pt.apr,
  pt.rate_plan_id,
  pt.purchase_trade_value,
  pt.transaction_date,
  pt.maturity_date,
  pt.default_date,
  pt.pawn_status,
  -- Aggregate inventory items as JSONB array
  COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id', ii.id,
        'inventory_subcategory_id', ii.inventory_subcategory_id,
        'status', ii.status,
        'quantity', ii.quantity,
        'brand', ii.inventory_brand_id,
        'model', ii.model,
        'serial_number', ii.serial_number,
        'color_id', ii.color,
        'item_condition', ii.item_condition,
        'owner_mark', ii.owner_mark,
        'item_description', ii.item_description,
        'price_amount', ii.price_amount,
        'resale', ii.resale,
        'min_resale', ii.min_resale,
        'item_replace', ii.item_replace,
        'extra', ii.extra,
        'attributes', ii.attributes,
        'legacy_inventory_number', ii.legacy_inventory_number,
        'legacy_item_guid', ii.legacy_item_guid,
        'legacy_category_description', ii.legacy_category_description,
        'legacy_brand_color_description', ii.legacy_brand_color_description,
        'inventory_number', ii.inventory_number,
        'last_updated_user_id', ii.last_updated_user_id,
        'created_at', ii.created_at,
        'updated_at', ii.updated_at
      ) ORDER BY ii.created_at
    ) FILTER (WHERE ii.id IS NOT NULL),
    '[]'::jsonb
  ) AS items_data
FROM pawn_ticket pt
LEFT JOIN pawn_ticket_item pti
  ON pti.pawn_ticket_id = pt.id
LEFT JOIN inventory_item ii
  ON ii.id = pti.inventory_item_id
WHERE pt.customer_id = $1
  AND pt.pawn_status = 'active'
GROUP BY
  pt.id,
  pt.control_number,
  pt.transaction_type,
  pt.customer_id,
  pt.default_marked_by,
  pt.amount_financed,
  pt.finance_charge,
  pt.periodic_rate,
  pt.total_of_payments,
  pt.apr,
  pt.rate_plan_id,
  pt.purchase_trade_value,
  pt.transaction_date,
  pt.maturity_date,
  pt.default_date,
  pt.pawn_status
ORDER BY pt.transaction_date DESC;