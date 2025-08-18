SELECT
  id,
  inventory_number AS "inventoryNumber",
  status,
  category_id     AS "categoryId",
  brand           AS "brand",
  model           AS "model",
  serial_number   AS "serialNumber",
  color           AS "color",
  item_condition  AS "itemCondition",
  quantity        AS "quantity",
  amount          AS "amount",
  resale          AS "resale",
  item_replace    AS "itemReplace",
  bin_number      AS "binNumber",
  owner_tag       AS "ownerTag",
  item_description AS "itemDescription",
  attributes      AS "attributes",
  created_at      AS "createdAt",
  updated_at      AS "updatedAt"
FROM inventory_item
ORDER BY updated_at DESC;
