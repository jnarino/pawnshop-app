DELETE FROM inventory_category
WHERE code = 'tools' AND parent_id IS NULL;

-- Remove plural jewelry subcategories if they exist (we will add singular forms)
DELETE FROM inventory_category c
USING inventory_category p
WHERE c.parent_id = p.id AND p.code = 'jewelry'
  AND c.code IN ('rings','necklaces','bracelets','earrings','watches','chains');

---------------------------
-- 1) Ensure top-level parents exist
---------------------------
INSERT INTO inventory_category (name, code, parent_id) VALUES
  ('Jewelry','jewelry',NULL),
  ('Firearms','firearms',NULL),
  ('Electronics','electronics',NULL),
  ('Collectibles','collectibles',NULL),
  ('Games','games',NULL),
  ('Audio','audio',NULL),
  ('Cameras','cameras',NULL),
  ('Computers','computers',NULL),
  ('Mobile Phones','mobile',NULL),
  -- New top-level tool groups
  ('Power Tools','power_tools',NULL),
  ('Hand Tools','hand_tools',NULL),
  ('Lawn & Garden','lawn_garden',NULL)
ON CONFLICT (parent_id, code) DO NOTHING;

---------------------------
-- 2) JEWELRY (singular subtypes) + brands
---------------------------

INSERT INTO inventory_category (name, code, parent_id)
SELECT v.name, v.code, p.id
FROM (VALUES
  ('Ring','ring'),
  ('Necklace','necklace'),
  ('Bracelet','bracelet'),
  ('Earring','earring'),
  ('Watch','watch'),
  ('Chain','chain')
) AS v(name, code)
JOIN inventory_category p ON p.code='jewelry' AND p.parent_id IS NULL
ON CONFLICT (parent_id, code) DO NOTHING;

-- Common jewelry brands under all (except watch which has separate list below)
-- (Using generic list for ring/necklace/bracelet/earring/chain)
INSERT INTO inventory_category (name, code, parent_id)
SELECT b.name, b.code, s.id
FROM (VALUES
  ('Tiffany & Co.','tiffany_co'),
  ('Cartier','cartier'),
  ('David Yurman','david_yurman'),
  ('Swarovski','swarovski'),
  ('Pandora','pandora'),
  ('Kay','kay'),
  ('Zales','zales'),
  ('Jared','jared'),
  ('Unbranded','unbranded')
) AS b(name, code)
JOIN inventory_category s ON s.code IN ('ring','necklace','bracelet','earring','chain')
JOIN inventory_category p ON p.id=s.parent_id AND p.code='jewelry'
ON CONFLICT (parent_id, code) DO NOTHING;

-- Watch brands
INSERT INTO inventory_category (name, code, parent_id)
SELECT b.name, b.code, s.id
FROM (VALUES
  ('Rolex','rolex'),
  ('Omega','omega'),
  ('TAG Heuer','tag_heuer'),
  ('Seiko','seiko'),
  ('Citizen','citizen'),
  ('Casio','casio'),
  ('Fossil','fossil'),
  ('Bulova','bulova'),
  ('Tissot','tissot'),
  ('Hamilton','hamilton'),
  ('Invicta','invicta'),
  ('Swatch','swatch')
) AS b(name, code)
JOIN inventory_category s ON s.code='watch'
JOIN inventory_category p ON p.id=s.parent_id AND p.code='jewelry'
ON CONFLICT (parent_id, code) DO NOTHING;

---------------------------
-- 3) POWER TOOLS (as top-level) ▸ subcategory ▸ brand
---------------------------
-- Subcategories (tool types)
INSERT INTO inventory_category (name, code, parent_id)
SELECT v.name, v.code, pt.id
FROM (VALUES
  ('Chainsaw','chainsaw'),
  ('Drill','drill'),
  ('Hammer Drill','hammer_drill'),
  ('Impact Driver','impact_driver'),
  ('Circular Saw','circular_saw'),
  ('Miter Saw','miter_saw'),
  ('Table Saw','table_saw'),
  ('Jigsaw','jigsaw'),
  ('Reciprocating Saw','reciprocating_saw'),
  ('Angle Grinder','angle_grinder'),
  ('Sander','sander'),
  ('Oscillating Multi-Tool','oscillating_tool'),
  ('Rotary Hammer','rotary_hammer'),
  ('Nail Gun','nail_gun'),
  ('Air Compressor','air_compressor'),
  ('Router','router'),
  ('Planer','planer'),
  ('Heat Gun','heat_gun'),
  ('Shop Vac','shop_vac'),
  ('Battery Pack','battery_pack'),
  ('Charger','charger')
) AS v(name, code)
JOIN inventory_category pt ON pt.code='power_tools' AND pt.parent_id IS NULL
ON CONFLICT (parent_id, code) DO NOTHING;

-- Brands under each power tool subtype
WITH brands AS (
  SELECT * FROM (VALUES
    ('DeWalt','dewalt'),
    ('Milwaukee','milwaukee'),
    ('Makita','makita'),
    ('Bosch','bosch'),
    ('Ryobi','ryobi'),
    ('Ridgid','ridgid'),
    ('Craftsman','craftsman'),
    ('Kobalt','kobalt'),
    ('Black+Decker','black_decker'),
    ('Porter-Cable','porter_cable'),
    ('Hilti','hilti'),
    ('Metabo HPT','metabo_hpt'),
    ('Festool','festool'),
    ('Skil','skil')
  ) AS t(name, code)
)
INSERT INTO inventory_category (name, code, parent_id)
SELECT b.name, b.code, s.id
FROM brands b
JOIN inventory_category s
  ON s.parent_id = (SELECT id FROM inventory_category WHERE code='power_tools' AND parent_id IS NULL)
 AND s.code IN ('chainsaw','drill','hammer_drill','impact_driver','circular_saw','miter_saw','table_saw','jigsaw',
                'reciprocating_saw','angle_grinder','sander','oscillating_tool','rotary_hammer','nail_gun',
                'air_compressor','router','planer','heat_gun','shop_vac','battery_pack','charger')
ON CONFLICT (parent_id, code) DO NOTHING;

---------------------------
-- 4) HAND TOOLS (top-level) ▸ subcategory ▸ brand
---------------------------
INSERT INTO inventory_category (name, code, parent_id)
SELECT v.name, v.code, ht.id
FROM (VALUES
  ('Hammer','hammer'),
  ('Screwdriver','screwdriver'),
  ('Wrench Set','wrench_set'),
  ('Socket Set','socket_set'),
  ('Pliers','pliers'),
  ('Tape Measure','tape_measure'),
  ('Level','level'),
  ('Utility Knife','utility_knife'),
  ('Chisel','chisel'),
  ('Hex Key Set','hex_key_set'),
  ('Crimping Tool','crimping_tool'),
  ('Stud Finder','stud_finder')
) AS v(name, code)
JOIN inventory_category ht ON ht.code='hand_tools' AND ht.parent_id IS NULL
ON CONFLICT (parent_id, code) DO NOTHING;

WITH ht_brands AS (
  SELECT * FROM (VALUES
    ('Craftsman','craftsman'),
    ('Husky','husky'),
    ('Kobalt','kobalt'),
    ('GearWrench','gearwrench'),
    ('Stanley','stanley'),
    ('Snap-on','snap_on'),
    ('Channellock','channellock'),
    ('Klein Tools','klein'),
    ('Irwin','irwin'),
    ('Wiha','wiha')
  ) AS t(name, code)
)
INSERT INTO inventory_category (name, code, parent_id)
SELECT b.name, b.code, s.id
FROM ht_brands b
JOIN inventory_category s
  ON s.parent_id = (SELECT id FROM inventory_category WHERE code='hand_tools' AND parent_id IS NULL)
 AND s.code IN ('hammer','screwdriver','wrench_set','socket_set','pliers','tape_measure','level','utility_knife',
                'chisel','hex_key_set','crimping_tool','stud_finder')
ON CONFLICT (parent_id, code) DO NOTHING;

---------------------------
-- 5) LAWN & GARDEN (top-level) ▸ subcategory ▸ brand
---------------------------
INSERT INTO inventory_category (name, code, parent_id)
SELECT v.name, v.code, lg.id
FROM (VALUES
  ('String Trimmer','string_trimmer'),
  ('Leaf Blower','leaf_blower'),
  ('Hedge Trimmer','hedge_trimmer'),
  ('Chainsaw','chainsaw_lg'),
  ('Lawn Mower','lawn_mower'),
  ('Pressure Washer','pressure_washer')
) AS v(name, code)
JOIN inventory_category lg ON lg.code='lawn_garden' AND lg.parent_id IS NULL
ON CONFLICT (parent_id, code) DO NOTHING;

WITH lg_brands AS (
  SELECT * FROM (VALUES
    ('Stihl','stihl'),
    ('Husqvarna','husqvarna'),
    ('EGO','ego'),
    ('Greenworks','greenworks'),
    ('Toro','toro'),
    ('Ryobi','ryobi'),
    ('DeWalt','dewalt'),
    ('Craftsman','craftsman')
  ) AS t(name, code)
)
INSERT INTO inventory_category (name, code, parent_id)
SELECT b.name, b.code, s.id
FROM lg_brands b
JOIN inventory_category s
  ON s.parent_id = (SELECT id FROM inventory_category WHERE code='lawn_garden' AND parent_id IS NULL)
 AND s.code IN ('string_trimmer','leaf_blower','hedge_trimmer','chainsaw_lg','lawn_mower','pressure_washer')
ON CONFLICT (parent_id, code) DO NOTHING;

---------------------------
-- 6) GAMES ▸ CONSOLES ▸ brands ▸ versions
---------------------------
-- Ensure 'consoles' under 'games'
INSERT INTO inventory_category (name, code, parent_id)
SELECT 'Consoles','consoles', g.id
FROM inventory_category g
WHERE g.code='games' AND g.parent_id IS NULL
ON CONFLICT (parent_id, code) DO NOTHING;

-- Level: brand families under Consoles
INSERT INTO inventory_category (name, code, parent_id)
SELECT v.name, v.code, c.id
FROM (VALUES
  ('PlayStation','playstation'),
  ('Xbox','xbox'),
  ('Nintendo','nintendo'),
  ('SEGA','sega')
) AS v(name, code)
JOIN inventory_category c ON c.code='consoles'
JOIN inventory_category g ON g.id=c.parent_id AND g.code='games'
ON CONFLICT (parent_id, code) DO NOTHING;

-- Versions under PlayStation
INSERT INTO inventory_category (name, code, parent_id)
SELECT v.name, v.code, p.id
FROM (VALUES
  ('PS1','ps1'),
  ('PS2','ps2'),
  ('PS3','ps3'),
  ('PS4','ps4'),
  ('PS5','ps5'),
  ('PSP','psp'),
  ('PS Vita','ps_vita')
) AS v(name, code)
JOIN inventory_category p ON p.code='playstation'
JOIN inventory_category c ON c.id=p.parent_id AND c.code='consoles'
ON CONFLICT (parent_id, code) DO NOTHING;

-- Versions under Xbox
INSERT INTO inventory_category (name, code, parent_id)
SELECT v.name, v.code, x.id
FROM (VALUES
  ('Xbox (Original)','xbox_original'),
  ('Xbox 360','xbox_360'),
  ('Xbox One','xbox_one'),
  ('Xbox Series S','xbox_series_s'),
  ('Xbox Series X','xbox_series_x')
) AS v(name, code)
JOIN inventory_category x ON x.code='xbox'
JOIN inventory_category c ON c.id=x.parent_id AND c.code='consoles'
ON CONFLICT (parent_id, code) DO NOTHING;

-- Versions under Nintendo
INSERT INTO inventory_category (name, code, parent_id)
SELECT v.name, v.code, n.id
FROM (VALUES
  ('NES','nes'),
  ('SNES','snes'),
  ('Nintendo 64','n64'),
  ('GameCube','gamecube'),
  ('Wii','wii'),
  ('Wii U','wii_u'),
  ('Switch','switch'),
  ('Switch OLED','switch_oled'),
  ('Switch Lite','switch_lite'),
  ('Game Boy','game_boy'),
  ('Game Boy Color','game_boy_color'),
  ('Game Boy Advance','gba'),
  ('Nintendo DS','ds'),
  ('Nintendo 3DS','3ds')
) AS v(name, code)
JOIN inventory_category n ON n.code='nintendo'
JOIN inventory_category c ON c.id=n.parent_id AND c.code='consoles'
ON CONFLICT (parent_id, code) DO NOTHING;

-- Versions under SEGA
INSERT INTO inventory_category (name, code, parent_id)
SELECT v.name, v.code, s.id
FROM (VALUES
  ('Genesis','genesis'),
  ('Saturn','saturn'),
  ('Dreamcast','dreamcast')
) AS v(name, code)
JOIN inventory_category s ON s.code='sega'
JOIN inventory_category c ON c.id=s.parent_id AND c.code='consoles'
ON CONFLICT (parent_id, code) DO NOTHING;
