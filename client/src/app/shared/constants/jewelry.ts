// Existing constants with additions for subtypes

export const JEWELRY_COLORS = [
  'Yellow', 'White', 'Rose', 'Red', 'Pink', 'Blue', 'Green', 'Purple', 
  'Black', 'Brown', 'Clear', 'Multi-color', 'Other'
] as const;

export const JEWELRY_METALS = [
  'gold', 'silver', 'platinum', 'palladium', 'titanium', 'stainless steel',
  'copper', 'brass', 'bronze', 'pewter', 'other'
] as const;

// ✅ Enhanced karat options with more comprehensive mappings
export const KARAT_OPTIONS_BY_METAL = {
  'gold': ['8K', '9K', '10K', '14K', '18K', '22K', '24K'],
  'silver': ['.999', '.925', '.900', '.800', '.750'],
  'platinum': ['.950', '.900', '.850'],
  'palladium': ['.950', '.900', '.500'],
  'stainless steel': ['316L', '304', '440C'],
  'titanium': ['Grade 1', 'Grade 2', 'Grade 5'],
  'other': []
} as const;

export const RING_SIZES = [
  '3', '3.25', '3.5', '3.75', '4', '4.25', '4.5', '4.75', '5', '5.25', '5.5', '5.75',
  '6', '6.25', '6.5', '6.75', '7', '7.25', '7.5', '7.75', '8', '8.25', '8.5', '8.75',
  '9', '9.25', '9.5', '9.75', '10', '10.25', '10.5', '10.75', '11', '11.25', '11.5',
  '11.75', '12', '12.25', '12.5', '12.75', '13', '13.25', '13.5', '13.75', '14'
] as const;

export const WEIGHT_UNITS = [
  'Grams', 'Ounces', 'Pennyweights', 'Carats', 'Pounds'
] as const;

export const GENDER_OPTIONS = [
  'Unisex', 'Men', 'Women', 'Children'
] as const;

// ✅ New: Jewelry subtypes based on categories
export const JEWELRY_SUBTYPES = {
  'jewelry': [
    'Ring',
    'Necklace', 
    'Bracelet',
    'Earrings',
    'Watch',
    'Chain',
    'Pendant',
    'Brooch',
    'Anklet',
    'Cufflinks',
    'Pin',
    'Charm',
    'Locket',
    'Tiara',
    'Other'
  ]
} as const;

export type JewelryMetal = typeof JEWELRY_METALS[number];
export type JewelrySubtype = typeof JEWELRY_SUBTYPES['jewelry'][number];
export type WeightUnit = typeof WEIGHT_UNITS[number];
export type GenderOption = typeof GENDER_OPTIONS[number];