SELECT id, name, legacy_code, active 
FROM tender_type 
WHERE active = true 
ORDER BY name ASC;