import { create } from 'zustand';
import { TicketByControlNumber, pawnTicketApi, InventoryItem } from '@/app/core/api/pawnTicketApi';
import { InventoryItemDraft } from '@/app/feature/_shared/inventory-item';
import { transformStones } from '@/app/shared/components/ElectronMenuBridge';

interface SearchCriteria {
    from: string;
    to: string;
    ticketNumber: string;
}

interface ForfeitStore {
    // State
    loading: boolean;
    searchResults: TicketByControlNumber[];
    selectedPawn: TicketByControlNumber | null;
    selectedItems: InventoryItemDraft[];
    searchCriteria: SearchCriteria;

    // Actions
    setSearchCriteria: (criteria: Partial<SearchCriteria>) => void;
    searchPawns: () => Promise<void>;
    selectPawn: (pawn: TicketByControlNumber) => void;
    updateItem: (item: InventoryItemDraft) => void;
    submitForfeit: () => Promise<void>;
    reset: () => void;
}

const inventoryItemToDraft = (item: InventoryItem): InventoryItemDraft => {
    const attributes = item.attributes || {};
    const extra = item.extra || {};

    return {
        id: item.id,
        type: item.inventoryCategory?.id || '',
        categoryName: item.inventoryCategory?.name || '',
        subcategoryId: item.inventorySubcategory?.id || '',
        subcategoryName: item.inventorySubcategory?.name || '',
        brandId: item.brand?.id || '',
        brandName: item.brand?.name || '',
        model: item.model || '',
        serial: item.serialNumber || '',
        color: item.colorId?.id || '',
        condition: item.itemCondition || '',
        quantity: String(item.quantity || 1),
        amount: String(item.priceAmount || 0),
        resale: String(item.resale || 0),
        replace: String(item.itemReplace || 0),
        ownerNumber: item.ownerMark || '',
        description: item.itemDescription || '',
        // Jewelry attributes (UUIDs from lookup)
        metal: attributes.metal?.id || '',
        karat: attributes.karat?.id || '',
        style: attributes.style?.id || '',
        // Extra fields
        gender: attributes.gender?.id || '',
        sizeLength: attributes.sizeLength?.id || '',
        weight: String(extra.weight || ''),
        weightUnit: String(extra.weightUnit || 'Grams'),
        // Stones
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        stones: transformStones(extra.stones as any),
        // Store original data
        status: "Pending to pull",
        inventoryNumber: item.inventoryNumber || undefined,
    };
};

const today = new Date();
const localToday = new Date(today.getTime() - (today.getTimezoneOffset() * 60000)).toISOString().split('T')[0];

export const useForfeitStore = create<ForfeitStore>((set, get) => ({
    loading: false,
    searchResults: [],
    selectedPawn: null,
    selectedItems: [],
    searchCriteria: {
        from: '1990-01-01',
        to: localToday,
        ticketNumber: ''
    },

    setSearchCriteria: (criteria) => {
        set((state) => ({
            searchCriteria: { ...state.searchCriteria, ...criteria }
        }));
    },

    searchPawns: async () => {
        const { searchCriteria } = get();
        set({ loading: true, searchResults: [], selectedPawn: null, selectedItems: [] });

        try {
            let results: TicketByControlNumber[] = [];

            if (searchCriteria.ticketNumber.trim()) {
                results = await pawnTicketApi.findByControlNumber(searchCriteria.ticketNumber.trim());
            } else if (searchCriteria.from && searchCriteria.to) {
                results = await pawnTicketApi.findByDateRange(searchCriteria.from, searchCriteria.to);
            }

            set({ searchResults: results });
        } catch (error) {
            console.error('Error searching pawns:', error);
            set({ searchResults: [] });
        } finally {
            set({ loading: false });
        }
    },

    selectPawn: (pawn) => {
        const items = pawn.items.map(inventoryItemToDraft);
        set({ selectedPawn: pawn, selectedItems: items });
    },

    updateItem: (updatedItem) => {
        set((state) => ({
            selectedItems: state.selectedItems.map(item =>
                item.id === updatedItem.id ? updatedItem : item
            )
        }));
    },

    submitForfeit: async () => {
        const { selectedPawn, selectedItems } = get();

        if (!selectedPawn) {
            console.error("No pawn ticket selected");
            return;
        }

        const payload = {
            pawnTicketId: selectedPawn.id,
            controlNumber: selectedPawn.controlNumber,
            typeTicket: selectedPawn.transactionType, // PAWN | PURCHASE
            transactionDate: selectedPawn.transactionDate, // Or current date? User said "get from useForfeitForm", usually refers to ticket data
            items: selectedItems.map(item => ({
                id: item.id,
                quantity: Number(item.quantity) || 1,
                // scrappedIntoInvItem: [], // User example had this, defaulting to empty or needed?
                // Assuming empty for now as it wasn't clarified where this comes from.
                resale: Number(item.resale) || 0,
                minResale: Number(item.minResale) || 0,
                status: item.itemStatus // 'I' or 'J'
            }))
        };

        console.log("Submitting Forfeit/Pull Payload:", payload);
        // TODO: Implement actual API call here
        // await someApi.saveForfeit(payload);
    },

    reset: () => {
        set({
            loading: false,
            searchResults: [],
            selectedPawn: null,
            selectedItems: [],
            searchCriteria: {
                from: '1990-01-01',
                to: localToday,
                ticketNumber: ''
            }
        });
    }
}));
