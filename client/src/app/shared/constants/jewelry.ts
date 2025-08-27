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