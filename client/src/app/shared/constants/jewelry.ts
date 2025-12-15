// Existing constants with additions for subtypes

export const WEIGHT_UNITS = [
  'Grams', 'Ounces', 'Pennyweights', 'Carats', 'Pounds'
] as const;


export type WeightUnit = typeof WEIGHT_UNITS[number];
