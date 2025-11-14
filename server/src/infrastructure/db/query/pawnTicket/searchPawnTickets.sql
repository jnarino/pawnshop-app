/* Dynamic-ish search via optional filters. Parameters:
  $1: customer_id UUID or NULL
  $2: pawn_ticket_type or NULL
  $3: start transaction_date (inclusive) or NULL
  $4: end transaction_date (inclusive) or NULL
  $5: limit
  $6: offset
*/
SELECT 
  pt.id,
  pt.control_number,
  pt.transaction_type,
  pt.customer_id,
  pt.pawn_status,
  pt.amount_financed,
  pt.finance_charge,
  pt.periodic_rate,
  pt.total_of_payments,
  pt.apr,
  pt.purchase_trade_value,
  pt.transaction_date,
  pt.maturity_date,
  pt.default_date,
  pt.created_at,
  pt.updated_at,
  c.first_name,
  c.last_name,
  COALESCE(
    array_agg(ii.id) FILTER (WHERE ii.id IS NOT NULL),
    '{}'::uuid[]
  ) as inventory_item_ids,
  -- ✅ Add items array with full item details
  COALESCE(
    json_agg(
      json_build_object(
        'id', ii.id,
        'inventory_number', ii.inventory_number,
        'brand', ii.brand,
        'model', ii.model,
        'serial_number', ii.serial_number,
        'item_description', ii.item_description,
        'price_amount', ii.price_amount,
        'quantity', ii.quantity,
        'status', ii.status,
        'attributes', ii.attributes
      ) ORDER BY ii.inventory_number
    ) FILTER (WHERE ii.id IS NOT NULL),
    '[]'::json
  ) as items
FROM pawn_ticket pt
LEFT JOIN customer c ON c.id = pt.customer_id
LEFT JOIN pawn_ticket_item pti ON pti.pawn_ticket_id = pt.id
LEFT JOIN inventory_item ii ON ii.id = pti.inventory_item_id
WHERE ($1::text IS NULL OR pt.control_number ILIKE '%' || $1::text || '%')
  AND ($2::uuid IS NULL OR pt.customer_id = $2::uuid)
  AND ($3::text IS NULL OR pt.pawn_status = $3::text)
  AND ($4::text IS NULL OR pt.transaction_type = $4::text)
  AND ($5::timestamptz IS NULL OR pt.transaction_date >= $5::timestamptz)
  AND ($6::timestamptz IS NULL OR pt.transaction_date <= $6::timestamptz)
GROUP BY pt.id, c.first_name, c.last_name
ORDER BY pt.transaction_date DESC
LIMIT $7::integer OFFSET $8::integer;
