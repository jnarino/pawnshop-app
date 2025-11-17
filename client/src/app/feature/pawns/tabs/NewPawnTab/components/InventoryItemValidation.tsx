import type { InventoryItemDraft } from './InventoryItemModal';

interface ValidationResult {
  isValid: boolean;
  error: string | null;
}

// ✅ Single Responsibility: Validation logic
export class InventoryItemValidation {
  static validate(draft: InventoryItemDraft): ValidationResult {
    if (!draft.type.trim()) {
      return { isValid: false, error: 'Type is required' };
    }

    if (!draft.amount) {
      return { isValid: false, error: 'Value is required' };
    }

    const isJewelry = draft.type.toLowerCase().includes('jewelry');
    if (isJewelry && (!draft.metal || !draft.karat || !draft.weight)) {
      return { isValid: false, error: 'Metal, Karat and Weight required for jewelry' };
    }

    return { isValid: true, error: null };
  }

  // ✅ Single Responsibility: Data transformation for saving
  static transformForSave(draft: InventoryItemDraft): InventoryItemDraft {
    return {
      ...draft,
      id: draft.id || crypto.randomUUID(),
      quantity: draft.quantity || '1',
      // Convert string numbers to proper format
      amount: draft.amount ? Number(draft.amount).toString() : '',
      weight: draft.weight ? Number(draft.weight).toString() : draft.weight,
      resale: draft.resale ? Number(draft.resale).toString() : draft.resale,
      replace: draft.replace ? Number(draft.replace).toString() : draft.replace,
    };
  }

  // ✅ Single Responsibility: Category type detection
  static getItemType(typeString: string): 'jewelry' | 'firearm' | 'general' {
    const lower = typeString.toLowerCase();
    if (lower.includes('jewelry')) return 'jewelry';
    if (lower.includes('firearm')) return 'firearm';
    return 'general';
  }
}
