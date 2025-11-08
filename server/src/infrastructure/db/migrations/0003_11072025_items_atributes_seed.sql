-- Basic seed data for inventory categories focusing on Jewelry and Firearms
-- This enables the autocomplete functionality in the inventory item form

-- Function to make insertions idempotent
CREATE OR REPLACE FUNCTION insert_category(
  p_name TEXT,
  p_code TEXT,
  p_parent_code TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_parent_id UUID;
  v_id UUID;
BEGIN
  -- Find parent ID if provided
  IF p_parent_code IS NOT NULL THEN
    SELECT id INTO v_parent_id FROM inventory_category WHERE code = p_parent_code;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Parent category with code % not found', p_parent_code;
    END IF;
  END IF;

  -- Try to find existing category
  SELECT id INTO v_id FROM inventory_category
  WHERE code = p_code AND (
    (p_parent_code IS NULL AND parent_id IS NULL) OR
    (parent_id = v_parent_id)
  );

  -- Insert if not found
  IF NOT FOUND THEN
    INSERT INTO inventory_category(name, code, parent_id)
    VALUES (p_name, p_code, v_parent_id)
    RETURNING id INTO v_id;
  END IF;

  RETURN v_id;
END;
$$ LANGUAGE plpgsql;

-- Top-level categories
SELECT insert_category('JEWELRY', 'JEWELRY');
SELECT insert_category('FIREARMS', 'FIREARMS');

-- Jewelry subcategories
SELECT insert_category('RINGS', 'RINGS', 'JEWELRY');
SELECT insert_category('NECKLACES', 'NECKLACES', 'JEWELRY');
SELECT insert_category('BRACELETS', 'BRACELETS', 'JEWELRY');
SELECT insert_category('EARRINGS', 'EARRINGS', 'JEWELRY');
SELECT insert_category('PENDANTS', 'PENDANTS', 'JEWELRY');
SELECT insert_category('WATCHES', 'WATCHES', 'JEWELRY');
SELECT insert_category('CHAINS', 'CHAINS', 'JEWELRY');
SELECT insert_category('ANKLETS', 'ANKLETS', 'JEWELRY');
SELECT insert_category('BROOCHES', 'BROOCHES', 'JEWELRY');
SELECT insert_category('CUFFLINKS', 'CUFFLINKS', 'JEWELRY');
SELECT insert_category('CHARMS', 'CHARMS', 'JEWELRY');

-- Jewelry brands (under various subcategories)
-- Watch brands
SELECT insert_category('ROLEX', 'ROLEX', 'WATCHES');
SELECT insert_category('OMEGA', 'OMEGA', 'WATCHES');
SELECT insert_category('TAG HEUER', 'TAG-HEUER', 'WATCHES');
SELECT insert_category('SEIKO', 'SEIKO', 'WATCHES');
SELECT insert_category('CITIZEN', 'CITIZEN', 'WATCHES');
SELECT insert_category('BULOVA', 'BULOVA', 'WATCHES');
SELECT insert_category('TISSOT', 'TISSOT', 'WATCHES');
SELECT insert_category('CASIO', 'CASIO', 'WATCHES');
SELECT insert_category('MOVADO', 'MOVADO', 'WATCHES');
SELECT insert_category('LONGINES', 'LONGINES', 'WATCHES');

-- Luxury jewelry brands (can appear under multiple categories)
SELECT insert_category('TIFFANY & CO', 'TIFFANY', 'RINGS');
SELECT insert_category('CARTIER', 'CARTIER', 'RINGS');
SELECT insert_category('DAVID YURMAN', 'DAVID-YURMAN', 'RINGS');
SELECT insert_category('PANDORA', 'PANDORA', 'RINGS');
SELECT insert_category('KAY JEWELERS', 'KAY', 'RINGS');
SELECT insert_category('ZALES', 'ZALES', 'RINGS');
SELECT insert_category('SWAROVSKI', 'SWAROVSKI', 'RINGS');

SELECT insert_category('TIFFANY & CO', 'TIFFANY', 'NECKLACES');
SELECT insert_category('CARTIER', 'CARTIER', 'NECKLACES');
SELECT insert_category('DAVID YURMAN', 'DAVID-YURMAN', 'NECKLACES');
SELECT insert_category('PANDORA', 'PANDORA', 'NECKLACES');

SELECT insert_category('TIFFANY & CO', 'TIFFANY', 'BRACELETS');
SELECT insert_category('CARTIER', 'CARTIER', 'BRACELETS');
SELECT insert_category('DAVID YURMAN', 'DAVID-YURMAN', 'BRACELETS');
SELECT insert_category('PANDORA', 'PANDORA', 'BRACELETS');

-- Firearms subcategories
SELECT insert_category('HANDGUNS', 'HANDGUNS', 'FIREARMS');
SELECT insert_category('RIFLES', 'RIFLES', 'FIREARMS');
SELECT insert_category('SHOTGUNS', 'SHOTGUNS', 'FIREARMS');
SELECT insert_category('REVOLVERS', 'REVOLVERS', 'FIREARMS');
SELECT insert_category('SEMI-AUTO PISTOLS', 'SEMI-AUTO', 'FIREARMS');
SELECT insert_category('ANTIQUE FIREARMS', 'ANTIQUE-FIREARMS', 'FIREARMS');

-- Firearm brands
SELECT insert_category('SMITH & WESSON', 'SMITH-WESSON', 'HANDGUNS');
SELECT insert_category('GLOCK', 'GLOCK', 'HANDGUNS');
SELECT insert_category('SIG SAUER', 'SIG-SAUER', 'HANDGUNS');
SELECT insert_category('RUGER', 'RUGER', 'HANDGUNS');
SELECT insert_category('COLT', 'COLT', 'HANDGUNS');
SELECT insert_category('BERETTA', 'BERETTA', 'HANDGUNS');
SELECT insert_category('SPRINGFIELD', 'SPRINGFIELD', 'HANDGUNS');
SELECT insert_category('KIMBER', 'KIMBER', 'HANDGUNS');
SELECT insert_category('TAURUS', 'TAURUS', 'HANDGUNS');
SELECT insert_category('WALTHER', 'WALTHER', 'HANDGUNS');

SELECT insert_category('REMINGTON', 'REMINGTON', 'RIFLES');
SELECT insert_category('WINCHESTER', 'WINCHESTER', 'RIFLES');
SELECT insert_category('SAVAGE ARMS', 'SAVAGE', 'RIFLES');
SELECT insert_category('RUGER', 'RUGER', 'RIFLES');
SELECT insert_category('BROWNING', 'BROWNING', 'RIFLES');
SELECT insert_category('MARLIN', 'MARLIN', 'RIFLES');
SELECT insert_category('MOSSBERG', 'MOSSBERG', 'RIFLES');

SELECT insert_category('REMINGTON', 'REMINGTON', 'SHOTGUNS');
SELECT insert_category('MOSSBERG', 'MOSSBERG', 'SHOTGUNS');
SELECT insert_category('WINCHESTER', 'WINCHESTER', 'SHOTGUNS');
SELECT insert_category('BENELLI', 'BENELLI', 'SHOTGUNS');
SELECT insert_category('BROWNING', 'BROWNING', 'SHOTGUNS');
SELECT insert_category('BERETTA', 'BERETTA', 'SHOTGUNS');
SELECT insert_category('SAVAGE ARMS', 'SAVAGE', 'SHOTGUNS');

-- Add common jewelry styles for chains, necklaces, and bracelets
-- Chain styles (add these before the DROP FUNCTION line)
SELECT insert_category('ROPE CHAIN', 'ROPE-CHAIN', 'CHAINS');
SELECT insert_category('ROLO CHAIN', 'ROLO-CHAIN', 'CHAINS');
SELECT insert_category('CURB LINK', 'CURB-LINK', 'CHAINS');
SELECT insert_category('CUBAN LINK', 'CUBAN-LINK', 'CHAINS');
SELECT insert_category('BOX CHAIN', 'BOX-CHAIN', 'CHAINS');
SELECT insert_category('SNAKE CHAIN', 'SNAKE-CHAIN', 'CHAINS');
SELECT insert_category('FIGARO CHAIN', 'FIGARO-CHAIN', 'CHAINS');
SELECT insert_category('MARINER CHAIN', 'MARINER-CHAIN', 'CHAINS');
SELECT insert_category('HERRINGBONE CHAIN', 'HERRINGBONE-CHAIN', 'CHAINS');
SELECT insert_category('WHEAT CHAIN', 'WHEAT-CHAIN', 'CHAINS');
SELECT insert_category('SINGAPORE CHAIN', 'SINGAPORE-CHAIN', 'CHAINS');
SELECT insert_category('SPIGA CHAIN', 'SPIGA-CHAIN', 'CHAINS');
SELECT insert_category('BALL CHAIN', 'BALL-CHAIN', 'CHAINS');
SELECT insert_category('CABLE CHAIN', 'CABLE-CHAIN', 'CHAINS');
SELECT insert_category('BYZANTINE CHAIN', 'BYZANTINE-CHAIN', 'CHAINS');
SELECT insert_category('OMEGA CHAIN', 'OMEGA-CHAIN', 'CHAINS');

-- Ring styles
SELECT insert_category('SOLITAIRE', 'SOLITAIRE', 'RINGS');
SELECT insert_category('THREE STONE', 'THREE-STONE', 'RINGS');
SELECT insert_category('HALO', 'HALO', 'RINGS');
SELECT insert_category('WEDDING BAND', 'WEDDING-BAND', 'RINGS');
SELECT insert_category('ENGAGEMENT', 'ENGAGEMENT', 'RINGS');
SELECT insert_category('SIGNET', 'SIGNET', 'RINGS');
SELECT insert_category('CLUSTER', 'CLUSTER', 'RINGS');
SELECT insert_category('COCKTAIL', 'COCKTAIL', 'RINGS');
SELECT insert_category('ETERNITY BAND', 'ETERNITY-BAND', 'RINGS');
SELECT insert_category('STACKABLE', 'STACKABLE', 'RINGS');

-- Bracelet styles
SELECT insert_category('TENNIS BRACELET', 'TENNIS', 'BRACELETS');
SELECT insert_category('BANGLE', 'BANGLE', 'BRACELETS');
SELECT insert_category('CUFF', 'CUFF', 'BRACELETS');
SELECT insert_category('CHARM BRACELET', 'CHARM-BRACELET', 'BRACELETS');
SELECT insert_category('LINK BRACELET', 'LINK-BRACELET', 'BRACELETS');
SELECT insert_category('BEADED BRACELET', 'BEADED', 'BRACELETS');
SELECT insert_category('ROPE BRACELET', 'ROPE-BRACELET', 'BRACELETS');
SELECT insert_category('CUBAN BRACELET', 'CUBAN-BRACELET', 'BRACELETS');
SELECT insert_category('CURB BRACELET', 'CURB-BRACELET', 'BRACELETS');

-- Necklace styles
SELECT insert_category('PENDANT NECKLACE', 'PENDANT-NECKLACE', 'NECKLACES');
SELECT insert_category('CHOKER', 'CHOKER', 'NECKLACES');
SELECT insert_category('LARIAT', 'LARIAT', 'NECKLACES');
SELECT insert_category('BIB NECKLACE', 'BIB', 'NECKLACES');
SELECT insert_category('COLLAR NECKLACE', 'COLLAR', 'NECKLACES');
SELECT insert_category('STATION NECKLACE', 'STATION', 'NECKLACES');
SELECT insert_category('Y NECKLACE', 'Y-NECKLACE', 'NECKLACES');
SELECT insert_category('ROPE NECKLACE', 'ROPE-NECKLACE', 'NECKLACES');
SELECT insert_category('CUBAN NECKLACE', 'CUBAN-NECKLACE', 'NECKLACES');

-- Earring styles
SELECT insert_category('STUD EARRINGS', 'STUD', 'EARRINGS');
SELECT insert_category('HOOP EARRINGS', 'HOOP', 'EARRINGS');
SELECT insert_category('DROP EARRINGS', 'DROP', 'EARRINGS');
SELECT insert_category('DANGLE EARRINGS', 'DANGLE', 'EARRINGS');
SELECT insert_category('CHANDELIER EARRINGS', 'CHANDELIER', 'EARRINGS');
SELECT insert_category('HUGGIE EARRINGS', 'HUGGIE', 'EARRINGS');
SELECT insert_category('CLUSTER EARRINGS', 'CLUSTER-EARRINGS', 'EARRINGS');
SELECT insert_category('JACKET EARRINGS', 'JACKET', 'EARRINGS');
SELECT insert_category('CLIMBER EARRINGS', 'CLIMBER', 'EARRINGS');

-- Clean up the function when done
DROP FUNCTION IF EXISTS insert_category;
