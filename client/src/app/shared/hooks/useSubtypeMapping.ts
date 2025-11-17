import { useMemo } from 'react';
import { JEWELRY_SUBTYPES } from '../constants/jewelry';
import { FIREARM_TYPES } from '../constants/firearms';

// ✅ Hook to get subtypes based on category
export function useSubtypeMapping(categoryType: string): string[] {
  return useMemo(() => {
    const lowerType = categoryType.toLowerCase();
    
    if (lowerType.includes('jewelry')) {
      return [...JEWELRY_SUBTYPES.jewelry];
    }
    
    if (lowerType.includes('firearm') || lowerType.includes('gun') || lowerType.includes('weapon')) {
      return [...FIREARM_TYPES];
    }
    
    // Generic subtypes for other categories
    return [
      'New',
      'Used', 
      'Refurbished',
      'Antique',
      'Collectible',
      'Other'
    ];
  }, [categoryType]);
}
