export const JEWELRY_COLORS = [
  'Yellow', 'White', 'Rose', 'Two-Tone', 'Tri-Color',
  'Black', 'Blue', 'Green', 'Red', 'Purple', 'Pink',
  'Champagne', 'Chocolate', 'Gunmetal', 'Silver', 'Gold',
  'Bronze', 'Copper'
];

export const JEWELRY_METALS = [
  'Yellow Gold',
  'White Gold',
  'Rose Gold',
  'Green Gold',
  'Sterling Silver',
  'Fine Silver',
  'Platinum',
  'Palladium',
  'Rhodium',
  'Titanium',
  'Tungsten',
  'Stainless Steel',
  'Brass',
  'Bronze',
  'Nickel Silver',
  'Copper'
];

// Karat / fineness options per metal (strings for UI)
export const KARAT_OPTIONS_BY_METAL: Record<string, string[]> = {
  // All gold colors share karat steps
  'Yellow Gold': ['8K', '9K', '10K', '12K', '14K', '18K', '21K', '22K', '24K'],
  'White Gold':  ['8K', '9K', '10K', '12K', '14K', '18K', '21K', '22K', '24K'],
  'Rose Gold':   ['8K', '9K', '10K', '12K', '14K', '18K', '21K', '22K', '24K'],
  'Green Gold':  ['8K', '9K', '10K', '12K', '14K', '18K', '21K', '22K', '24K'],

  // Silver fineness (decimals-as-text)
  'Sterling Silver': ['.800', '.830', '.835', '.850', '.900', '.925', '.958', '.999'],
  'Fine Silver':     ['.900', '.925', '.958', '.999'],

  // Typical platinum/palladium marks
  'Platinum':  ['850', '900', '950', '999'],
  'Palladium': ['500', '850', '900', '950'],

  // Others — use common grades/labels
  'Rhodium':        ['Plated', 'Overlay', '999'],
  'Titanium':       ['Grade 2', 'Grade 5'],
  'Tungsten':       ['Carbide'],
  'Stainless Steel':['304', '316L'],
  'Brass':          ['Yellow', 'Red'],
  'Bronze':         ['Phosphor', 'Aluminum'],
  'Nickel Silver':  ['NS65', 'NS70', 'German Silver'],
  'Copper':         ['Pure', 'Alloy']
};

// Ring sizes (US standard)
export const RING_SIZES = [
  '1', '1 1/4', '1 1/2', '1 3/4',
  '2', '2 1/4', '2 1/2', '2 3/4',
  '3', '3 1/4', '3 1/2', '3 3/4',
  '4', '4 1/4', '4 1/2', '4 3/4',
  '5', '5 1/4', '5 1/2', '5 3/4',
  '6', '6 1/4', '6 1/2', '6 3/4',
  '7', '7 1/4', '7 1/2', '7 3/4',
  '8', '8 1/4', '8 1/2', '8 3/4',
  '9', '9 1/4', '9 1/2', '9 3/4',
  '10', '10 1/4', '10 1/2', '10 3/4',
  '11', '11 1/4', '11 1/2', '11 3/4',
  '12', '12 1/4', '12 1/2', '12 3/4',
  '13', '13 1/4', '13 1/2', '13 3/4',
  '14', '14 1/4', '14 1/2', '14 3/4',
  '15'
] as const;

// Weight units for jewelry
export const WEIGHT_UNITS = ['Grams', 'Ounces'] as const;

// Gender options for jewelry
export const GENDER_OPTIONS = ['', 'MAN\'S', 'WOMAN\'S', 'N/A'] as const;

// Type exports for better TypeScript support
export type RingSize = typeof RING_SIZES[number];
export type WeightUnit = typeof WEIGHT_UNITS[number];
export type GenderOption = typeof GENDER_OPTIONS[number];