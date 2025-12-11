import type { InventoryItemDraft } from '../components/InventoryItemModal';

export interface PawnDraft {
    type: 'PAWN' | 'PURCHASE';
    ratePercent: string;      // UI percent, e.g. "25"
    controlNumber: string;
    items: InventoryItemDraft[];
}

export function createInitialPawnDraft(): PawnDraft {
    return {
        type: 'PAWN',
        ratePercent: '25',
        controlNumber: '',
        items: [],
    };
}