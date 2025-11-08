-- =========================================
-- 002_seed_colors.sql
-- Idempotent seeding for color groups and colors
-- =========================================

-- Groups
INSERT INTO color_group (code, name) VALUES
  ('GENERIC_ITEM',        'Generic item colors'),
  ('FIREARM',             'Firearm colors / finishes'),
  ('JEWELRY_METAL_TONE',  'Jewelry metal tones'),
  ('JEWELRY_STONE_COLOR', 'Jewelry stone colors'),
  ('PERSON_HAIR',         'Person hair colors'),
  ('PERSON_EYE',          'Person eye colors')
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name;

-- ---------- GENERIC ITEM ----------
INSERT INTO color (group_code, slug, name, hex, legacy_code, sort_order, active) VALUES
  ('GENERIC_ITEM','BLACK','Black','#000000',NULL,10,TRUE),
  ('GENERIC_ITEM','WHITE','White','#FFFFFF',NULL,20,TRUE),
  ('GENERIC_ITEM','GRAY','Gray','#808080',NULL,30,TRUE),
  ('GENERIC_ITEM','SILVER','Silver','#C0C0C0',NULL,40,TRUE),
  ('GENERIC_ITEM','BLUE','Blue','#1E90FF',NULL,50,TRUE),
  ('GENERIC_ITEM','RED','Red','#D32F2F',NULL,60,TRUE),
  ('GENERIC_ITEM','GREEN','Green','#2E7D32',NULL,70,TRUE),
  ('GENERIC_ITEM','YELLOW','Yellow','#F9A825',NULL,80,TRUE),
  ('GENERIC_ITEM','ORANGE','Orange','#FB8C00',NULL,90,TRUE),
  ('GENERIC_ITEM','PURPLE','Purple','#7E57C2',NULL,100,TRUE),
  ('GENERIC_ITEM','PINK','Pink','#EC407A',NULL,110,TRUE),
  ('GENERIC_ITEM','BROWN','Brown','#6D4C41',NULL,120,TRUE),
  ('GENERIC_ITEM','TAN','Tan','#D2B48C',NULL,130,TRUE),
  ('GENERIC_ITEM','BEIGE','Beige','#F5F5DC',NULL,140,TRUE),
  ('GENERIC_ITEM','GOLD','Gold','#D4AF37',NULL,150,TRUE),
  ('GENERIC_ITEM','ROSE_GOLD','Rose Gold','#B76E79',NULL,160,TRUE),
  ('GENERIC_ITEM','MULTICOLOR','Multi-color',NULL,NULL,170,TRUE),
  ('GENERIC_ITEM','CAMO','Camo',NULL,NULL,180,TRUE),
  ('GENERIC_ITEM','WOOD','Wood',NULL,NULL,190,TRUE)
ON CONFLICT (group_code, slug) DO UPDATE
  SET name=EXCLUDED.name, hex=EXCLUDED.hex, legacy_code=EXCLUDED.legacy_code, sort_order=EXCLUDED.sort_order, active=TRUE;

-- ---------- FIREARM ----------
INSERT INTO color (group_code, slug, name, hex, legacy_code, sort_order, active) VALUES
  ('FIREARM','BLACK','Black','#000000',NULL,10,TRUE),
  ('FIREARM','FDE','Flat Dark Earth','#C3A97C',NULL,20,TRUE),
  ('FIREARM','OD_GREEN','OD Green','#556B2F',NULL,30,TRUE),
  ('FIREARM','TAN','Tan','#D2B48C',NULL,40,TRUE),
  ('FIREARM','GRAY','Gray','#808080',NULL,50,TRUE),
  ('FIREARM','STAINLESS','Stainless','#C0C0C0',NULL,60,TRUE),
  ('FIREARM','NICKEL','Nickel','#B0B0B0',NULL,70,TRUE),
  ('FIREARM','BLUE_STEEL','Blue Steel','#0B1A3A',NULL,80,TRUE),
  ('FIREARM','PARKERIZED','Parkerized','#4B5320',NULL,90,TRUE),
  ('FIREARM','CAMO','Camo',NULL,NULL,100,TRUE),
  ('FIREARM','TWO_TONE','Two-Tone',NULL,NULL,110,TRUE),
  ('FIREARM','WOOD','Wood',NULL,NULL,120,TRUE)
ON CONFLICT (group_code, slug) DO UPDATE
  SET name=EXCLUDED.name, hex=EXCLUDED.hex, legacy_code=EXCLUDED.legacy_code, sort_order=EXCLUDED.sort_order, active=TRUE;

-- ---------- JEWELRY METAL TONE ----------
INSERT INTO color (group_code, slug, name, hex, legacy_code, sort_order, active) VALUES
  ('JEWELRY_METAL_TONE','YELLOW_GOLD','Yellow Gold','#FFD700',NULL,10,TRUE),
  ('JEWELRY_METAL_TONE','WHITE_GOLD','White Gold','#E5E4E2',NULL,20,TRUE),
  ('JEWELRY_METAL_TONE','ROSE_GOLD','Rose Gold','#B76E79',NULL,30,TRUE),
  ('JEWELRY_METAL_TONE','PLATINUM','Platinum','#E5E4E2',NULL,40,TRUE),
  ('JEWELRY_METAL_TONE','STERLING_SILVER','Sterling Silver','#C0C0C0',NULL,50,TRUE),
  ('JEWELRY_METAL_TONE','TWO_TONE','Two-Tone',NULL,NULL,60,TRUE),
  ('JEWELRY_METAL_TONE','OTHER','Other',NULL,NULL,999,TRUE)
ON CONFLICT (group_code, slug) DO UPDATE
  SET name=EXCLUDED.name, hex=EXCLUDED.hex, legacy_code=EXCLUDED.legacy_code, sort_order=EXCLUDED.sort_order, active=TRUE;

-- ---------- JEWELRY STONE COLOR (ticket codes)
INSERT INTO color (group_code, slug, name, hex, legacy_code, sort_order, active) VALUES
  ('JEWELRY_STONE_COLOR','BLACK','Black','#000000','K',10,TRUE),
  ('JEWELRY_STONE_COLOR','BROWN','Brown','#6D4C41','O',20,TRUE),
  ('JEWELRY_STONE_COLOR','GREEN','Green','#2E7D32','G',30,TRUE),
  ('JEWELRY_STONE_COLOR','RED','Red','#D32F2F','R',40,TRUE),
  ('JEWELRY_STONE_COLOR','YELLOW','Yellow','#F9A825','Y',50,TRUE),
  ('JEWELRY_STONE_COLOR','BLUE','Blue','#1E90FF','B',60,TRUE),
  ('JEWELRY_STONE_COLOR','PINK','Pink','#EC407A','P',70,TRUE),
  ('JEWELRY_STONE_COLOR','WHITE_CLEAR','White/Clear','#FFFFFF','W',80,TRUE),
  ('JEWELRY_STONE_COLOR','OTHER','Other',NULL,'X',999,TRUE)
ON CONFLICT (group_code, slug) DO UPDATE
  SET name=EXCLUDED.name, hex=EXCLUDED.hex, legacy_code=EXCLUDED.legacy_code, sort_order=EXCLUDED.sort_order, active=TRUE;

-- ---------- PERSON HAIR ----------
INSERT INTO color (group_code, slug, name, hex, legacy_code, sort_order, active) VALUES
  ('PERSON_HAIR','BLACK','Black','#000000',NULL,10,TRUE),
  ('PERSON_HAIR','BROWN','Brown','#6D4C41',NULL,20,TRUE),
  ('PERSON_HAIR','BLONDE','Blonde','#F5DEB3',NULL,30,TRUE),
  ('PERSON_HAIR','RED','Red','#B22222',NULL,40,TRUE),
  ('PERSON_HAIR','AUBURN','Auburn','#8B3A3A',NULL,50,TRUE),
  ('PERSON_HAIR','GRAY','Gray','#A9A9A9',NULL,60,TRUE),
  ('PERSON_HAIR','WHITE','White','#FFFFFF',NULL,70,TRUE),
  ('PERSON_HAIR','SANDY','Sandy','#D2B48C',NULL,80,TRUE),
  ('PERSON_HAIR','BALD','Bald',NULL,NULL,90,TRUE),
  ('PERSON_HAIR','OTHER','Other',NULL,NULL,999,TRUE)
ON CONFLICT (group_code, slug) DO UPDATE
  SET name=EXCLUDED.name, hex=EXCLUDED.hex, legacy_code=EXCLUDED.legacy_code, sort_order=EXCLUDED.sort_order, active=TRUE;

-- ---------- PERSON EYE ----------
INSERT INTO color (group_code, slug, name, hex, legacy_code, sort_order, active) VALUES
  ('PERSON_EYE','BROWN','Brown','#6D4C41',NULL,10,TRUE),
  ('PERSON_EYE','BLUE','Blue','#1E90FF',NULL,20,TRUE),
  ('PERSON_EYE','GREEN','Green','#2E7D32',NULL,30,TRUE),
  ('PERSON_EYE','GRAY','Gray','#A9A9A9',NULL,40,TRUE),
  ('PERSON_EYE','HAZEL','Hazel','#8E6B23',NULL,50,TRUE),
  ('PERSON_EYE','AMBER','Amber','#C68E17',NULL,60,TRUE),
  ('PERSON_EYE','BLACK','Black','#000000',NULL,70,TRUE),
  ('PERSON_EYE','OTHER','Other',NULL,NULL,999,TRUE)
ON CONFLICT (group_code, slug) DO UPDATE
  SET name=EXCLUDED.name, hex=EXCLUDED.hex, legacy_code=EXCLUDED.legacy_code, sort_order=EXCLUDED.sort_order, active=TRUE;
