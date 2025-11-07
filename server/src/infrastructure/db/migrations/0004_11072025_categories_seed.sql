-- =========================================
-- 004_seed_categories.sql
-- Category taxonomy (types/subtypes/brands). Idempotent.
-- =========================================

-- Helper: idempotent insert by (parent_id, code)
CREATE OR REPLACE FUNCTION insert_category(
  p_name TEXT,
  p_code TEXT,
  p_parent_code TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_parent_id UUID;
  v_id UUID;
BEGIN
  IF p_parent_code IS NOT NULL THEN
    SELECT id INTO v_parent_id
    FROM inventory_category
    WHERE code = p_parent_code
    ORDER BY created_at
    LIMIT 1;
    IF v_parent_id IS NULL THEN
      RAISE EXCEPTION 'Parent category with code % not found', p_parent_code;
    END IF;
  END IF;

  INSERT INTO inventory_category(name, code, parent_id)
  VALUES (p_name, p_code, v_parent_id)
  ON CONFLICT (parent_id, code) DO UPDATE SET name = EXCLUDED.name
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$ LANGUAGE plpgsql;

-- Top-level
SELECT insert_category('JEWELRY',  'JEWELRY',  NULL);
SELECT insert_category('FIREARMS', 'FIREARMS', NULL);
SELECT insert_category('TOOLS',    'TOOLS',    NULL);

-- Jewelry subtypes
SELECT insert_category('WATCHES',   'WATCHES',   'JEWELRY');
SELECT insert_category('RINGS',     'RINGS',     'JEWELRY');
SELECT insert_category('NECKLACES', 'NECKLACES', 'JEWELRY');
SELECT insert_category('BRACELETS', 'BRACELETS', 'JEWELRY');
SELECT insert_category('EARRINGS',  'EARRINGS',  'JEWELRY');
SELECT insert_category('PENDANTS',  'PENDANTS',  'JEWELRY');
SELECT insert_category('CHAINS',    'CHAINS',    'JEWELRY');
SELECT insert_category('CUFFLINKS', 'CUFFLINKS', 'JEWELRY');
SELECT insert_category('CHARMS',    'CHARMS',    'JEWELRY');

-- Jewelry brands under WATCHES
SELECT insert_category('NONE',     'NONE',     'WATCHES');
SELECT insert_category('ROLEX',    'ROLEX',    'WATCHES');
SELECT insert_category('OMEGA',    'OMEGA',    'WATCHES');
SELECT insert_category('TAG HEUER','TAG-HEUER','WATCHES');
SELECT insert_category('SEIKO',    'SEIKO',    'WATCHES');
SELECT insert_category('CITIZEN',  'CITIZEN',  'WATCHES');
SELECT insert_category('BULOVA',   'BULOVA',   'WATCHES');
SELECT insert_category('TISSOT',   'TISSOT',   'WATCHES');
SELECT insert_category('CASIO',    'CASIO',    'WATCHES');
SELECT insert_category('MOVADO',   'MOVADO',   'WATCHES');
SELECT insert_category('LONGINES', 'LONGINES', 'WATCHES');

-- Jewelry brands under RINGS (sample luxury)
SELECT insert_category('NONE',          'NONE',          'RINGS');
SELECT insert_category('TIFFANY & CO',  'TIFFANY',       'RINGS');
SELECT insert_category('CARTIER',       'CARTIER',       'RINGS');
SELECT insert_category('DAVID YURMAN',  'DAVID-YURMAN',  'RINGS');
SELECT insert_category('PANDORA',       'PANDORA',       'RINGS');
SELECT insert_category('KAY JEWELERS',  'KAY',           'RINGS');
SELECT insert_category('ZALES',         'ZALES',         'RINGS');
SELECT insert_category('SWAROVSKI',     'SWAROVSKI',     'RINGS');

-- Minimal styles as categories? keep styles in attributes; categories remain structure/brands.

-- Firearms subtypes
SELECT insert_category('HANDGUNS', 'HANDGUNS', 'FIREARMS');
SELECT insert_category('RIFLES',   'RIFLES',   'FIREARMS');
SELECT insert_category('SHOTGUNS', 'SHOTGUNS', 'FIREARMS');
SELECT insert_category('REVOLVERS','REVOLVERS','FIREARMS');
SELECT insert_category('SEMI-AUTO PISTOLS', 'SEMI-AUTO', 'FIREARMS');
SELECT insert_category('ANTIQUE FIREARMS',  'ANTIQUE-FIREARMS', 'FIREARMS');

-- Firearm brands under HANDGUNS (sample + NONE)
SELECT insert_category('NONE',           'NONE',          'HANDGUNS');
SELECT insert_category('SMITH & WESSON', 'SMITH-WESSON',  'HANDGUNS');
SELECT insert_category('GLOCK',          'GLOCK',         'HANDGUNS');
SELECT insert_category('SIG SAUER',      'SIG-SAUER',     'HANDGUNS');
SELECT insert_category('RUGER',          'RUGER',         'HANDGUNS');
SELECT insert_category('COLT',           'COLT',          'HANDGUNS');
SELECT insert_category('BERETTA',        'BERETTA',       'HANDGUNS');
SELECT insert_category('SPRINGFIELD',    'SPRINGFIELD',   'HANDGUNS');
SELECT insert_category('KIMBER',         'KIMBER',        'HANDGUNS');
SELECT insert_category('TAURUS',         'TAURUS',        'HANDGUNS');
SELECT insert_category('WALTHER',        'WALTHER',       'HANDGUNS');

-- Tools (minimal skeleton)
SELECT insert_category('HAND TOOLS',  'HAND-TOOLS',  'TOOLS');
SELECT insert_category('POWER TOOLS', 'POWER-TOOLS', 'TOOLS');

-- Clean up helper
DROP FUNCTION IF EXISTS insert_category;
