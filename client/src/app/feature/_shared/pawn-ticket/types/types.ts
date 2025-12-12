import type { InventoryItemDraft } from '../components/InventoryItemModal';

export type FormMode = 'CREATE' | 'VIEW';

export interface PawnDraft {
    type: 'PAWN' | 'PURCHASE';
    ratePercent: string;
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