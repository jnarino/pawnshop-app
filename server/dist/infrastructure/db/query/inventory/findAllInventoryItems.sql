SELECT
  id,
  type,
  status,
  category_id     AS "categoryId",
  subcategory_id  AS "subcategoryId",
  brand           AS "brand",
  model           AS "model",
  serial_number   AS "serialNumber",
  color           AS "color",
  item_condition  AS "itemCondition",
  quantity        AS "quantity",
  amount          AS "amount",
  resale          AS "resale",
  item_replace    AS "itemReplace",
  bin             AS "bin",
  owner_tag       AS "ownerTag",
  item_description AS "itemDescription",
  firearm_attributes AS "firearm",
  jewelry_attributes AS "jewelry",
  created_at      AS "createdAt",
  updated_at      AS "updatedAt"
FROM inventory_item
ORDER BY updated_at DESC;
