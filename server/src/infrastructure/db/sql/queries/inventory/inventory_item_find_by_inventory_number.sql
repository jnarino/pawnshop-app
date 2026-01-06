SELECT
	ii.*,
	isub.id AS subcategory_id,
	isub.name AS subcategory_name,
	icat.id AS category_id,
	icat.name AS category_name,
	ibrand.id AS brand_id,
	ibrand.name AS brand_name
FROM inventory_item ii
LEFT JOIN inventory_subcategory isub ON ii.inventory_subcategory_id = isub.id
LEFT JOIN inventory_category icat ON isub.inventory_category_id = icat.id
LEFT JOIN inventory_brand ibrand ON ii.inventory_brand_id = ibrand.id
WHERE ii.inventory_number = $1;
