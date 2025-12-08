INSERT INTO store_transaction_item (
  id,
  store_transaction_id,
  sequence,
  inventory_item_id,
  description,
  quantity,
  line_amount,
  line_cost,
  tax_exempt,
  county_tax_exempt,
  returned,
  status,
  legacy_sitem_pk,
  legacy_items_pk,
  legacy_items_guid,
  legacy_invnum,
  legacy_vendor_pk,
  legacy_from_customer_pk,
  legacy_cflag,
  legacy_sit_id,
  legacy_sales_loc,
  legacy_last_updated_usr
) VALUES (
  $1,  -- id
  $2,  -- store_transaction_id
  $3,  -- sequence
  $4,  -- inventory_item_id
  $5,  -- description
  $6,  -- quantity
  $7,  -- line_amount
  $8,  -- line_cost
  $9,  -- tax_exempt
  $10, -- county_tax_exempt
  $11, -- returned
  $12, -- status
  NULL, -- legacy_sitem_pk
  NULL, -- legacy_items_pk
  NULL, -- legacy_items_guid
  NULL, -- legacy_invnum
  NULL, -- legacy_vendor_pk
  NULL, -- legacy_from_customer_pk
  NULL, -- legacy_cflag
  NULL, -- legacy_sit_id
  NULL, -- legacy_sales_loc
  NULL  -- legacy_last_updated_usr
);
