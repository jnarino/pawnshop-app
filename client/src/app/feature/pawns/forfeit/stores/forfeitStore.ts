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
    temporalEditingRowId: string | null;
    editingRowId: string | null;
    searchCriteria: SearchCriteria;
    isPullInProgress: boolean;
    scrapItems: { itemDescription: string; inventoryNumber: string }[];
    loadingProcessPull: boolean;
    createdItems: { id: string; inventoryNumber: string; description: string; amount: string; quantity: number }[];
    submitError: string | null;

    // Actions
    setSearchCriteria: (criteria: Partial<SearchCriteria>) => void;
    searchPawns: () => Promise<void>;
    selectPawn: (pawn: TicketByControlNumber) => void;
    resetSelectedPawn: () => void;
    setTemporalEditingRowId: (id: string | null) => void;
    setEditingRowId: (id: string | null) => void;
    updateItem: (item: InventoryItemDraft) => void;
    submitForfeit: () => Promise<void>;
    fetchScrapItems: () => Promise<void>;
    closePrintModal: () => void;
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
        brand: item.brand,
        brandName: item.brand?.name || '',
        model: item.model || '',
        serial: item.serialNumber || '',
        color: item.colorId,
        condition: item.itemCondition || '',
        quantity: String(item.quantity || 1),
        amount: String(item.priceAmount || 0),
        resale: String(item.resale || 0),
        replace: String(item.itemReplace || 0),
        ownerNumber: item.ownerMark || '',
        description: item.itemDescription || '',
        // Jewelry attributes (UUIDs from lookup)
        metal: attributes.metal,
        karat: attributes.karat,
        style: attributes.style,
        // Extra fields
        gender: attributes.gender,
        sizeLength: attributes.sizeLength,
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
    temporalEditingRowId: '',
    editingRowId: '',
    isPullInProgress: false,
    scrapItems: [],
    loadingProcessPull: false,
    createdItems: [],
    searchCriteria: {
        from: '1990-01-01',
        to: localToday,
        ticketNumber: ''
    },
    submitError: null,

    setSearchCriteria: (criteria) => {
        set((state) => ({
            searchCriteria: { ...state.searchCriteria, ...criteria }
        }));
    },

    searchPawns: async () => {
        const { searchCriteria } = get();
        set({ loading: true, searchResults: [], selectedPawn: null, selectedItems: [], isPullInProgress: false, createdItems: [] });

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
        set({ selectedPawn: pawn, selectedItems: items, isPullInProgress: false, createdItems: [] });
    },

    setTemporalEditingRowId(id) {
        set({ temporalEditingRowId: id });
    },

    setEditingRowId(id) {
        set({ editingRowId: id });
    },

    updateItem: (updatedItem) => {
        set((state) => {
            const newItems = state.selectedItems.map(item =>
                item.id === updatedItem.id ? updatedItem : item
            );
            return {
                selectedItems: newItems,
                isPullInProgress: newItems.some(item => item.status === 'Pulled')
            };
        });
    },

    resetSelectedPawn: () => {
        set({ selectedPawn: null, selectedItems: [], temporalEditingRowId: '', editingRowId: '', isPullInProgress: false, createdItems: [] });
    },

    submitForfeit: async () => {
        const { selectedPawn, selectedItems, reset } = get();

        if (!selectedPawn) {
            console.error("No pawn ticket selected");
            return;
        }

        set({ loadingProcessPull: true, submitError: null });

        const payload = {
            pawnTicketId: selectedPawn.id,
            controlNumber: selectedPawn.controlNumber,
            typeTicket: selectedPawn.transactionType,
            transactionDate: new Date().toISOString(),
            items: selectedItems.map(item => ({
                id: item.id,
                resale: Number(item.resale) || 0,
                minResale: Number(item.minResale) || 0,
                itemStatus: item.itemStatus,
                scrappedIntoInvItem: item.scrappedIntoInvItem?.map(scrap => ({
                    inventoryNumber: scrap.inventoryNumber,
                    quantity: Number(scrap.quantity) || 0,
                })) || []
            }))
        };

        try {
            console.log("Submitting Forfeit/Pull Payload:", payload);
            const responseItems = await pawnTicketApi.pullToInventory(payload);

            if (responseItems && responseItems.length > 0) {
                const pulledItems = selectedItems.filter(i => i.itemStatus === 'I');

                const mappedCreatedItems = responseItems.map((respItem, index) => {
                    const sourceItem = pulledItems[index];
                    return {
                        id: respItem.id,
                        inventoryNumber: respItem.inventoryNumber,
                        description: sourceItem?.description || 'Pulled Item',
                        amount: sourceItem?.resale || '0',
                        quantity: Number(sourceItem?.quantity) || 1
                    };
                });

                set({ createdItems: mappedCreatedItems, loadingProcessPull: false });
            } else {
                set({ loadingProcessPull: false });
                reset();
            }
        } catch (error) {
            console.error("Submit forfeit failed:", error);
            set({ submitError: "Error while processing pull, please try again", loadingProcessPull: false });
        }
    },

    closePrintModal: () => {
        get().reset();
    },

    fetchScrapItems: async () => {
        try {
            const { getScrapInventoryNumbers } = await import('@/app/core/api/inventoryItemApi');
            const items = await getScrapInventoryNumbers();
            set({ scrapItems: items });
        } catch (error) {
            console.error("Failed to fetch scrap items:", error);
        }
    },

    reset: () => {
        set({
            loading: false,
            loadingProcessPull: false,
            searchResults: [],
            selectedPawn: null,
            selectedItems: [],
            isPullInProgress: false,
            createdItems: [],
            submitError: null,
            searchCriteria: {
                from: '1990-01-01',
                to: localToday,
                ticketNumber: ''
            }
        });
    }
}));
