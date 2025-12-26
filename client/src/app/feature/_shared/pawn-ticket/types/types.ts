import type { InventoryItemDraft } from '@/app/feature/_shared/inventory-item';

export type FormMode = 'CREATE' | 'VIEW' | 'MODIFY';

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