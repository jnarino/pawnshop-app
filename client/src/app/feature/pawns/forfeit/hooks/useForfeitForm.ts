import { useState } from 'react';
import { useForm } from 'react-hook-form';

export interface ForfeitFormData {
    dateRange: {
        from: string;
        to: string;
    };
    ticketNumber: string;
    pawnSelected: TicketByControlNumber;
    items: TicketByControlNumber[];
}

import { InventoryItem, pawnTicketApi, TicketByControlNumber } from '@/app/core/api/pawnTicketApi';
import { InventoryItemDraft } from '@/app/feature/_shared/inventory-item';
import { transformStones } from '@/app/shared/components/ElectronMenuBridge';

export const useForfeitForm = () => {
    const [items, setItems] = useState<TicketByControlNumber[]>([]);
    const [loading, setLoading] = useState(false);

    const today = new Date();
    const localToday = new Date(today.getTime() - (today.getTimezoneOffset() * 60000)).toISOString().split('T')[0];

    const form = useForm<ForfeitFormData>({
        defaultValues: {
            dateRange: {
                from: localToday,
                to: localToday
            },
            ticketNumber: ''
        }
    });

    const submitForfeit = async (data: ForfeitFormData) => {
        setLoading(true);
        try {
            if (data.ticketNumber) {
                const results = await pawnTicketApi.findByControlNumber(data.ticketNumber.trim());
                setItems(results);
            } else {
                const { from, to } = data.dateRange;
                if (from && to) {
                    const results = await pawnTicketApi.findByDateRange(from, to);
                    setItems(results);
                } else {
                    setItems([]);
                }
            }
        } catch (error) {
            console.error(error);
            setItems([]);
        } finally {
            setLoading(false);
        }
    };

    const searchByDate = () => {
        form.setValue('ticketNumber', '');
        form.handleSubmit(submitForfeit)();
    };

    const onPawnSelected = (pawn: TicketByControlNumber) => {
        console.log(pawn);

        const selectedPawn = {
            ...pawn,
            items: pawn.items.map((item) => inventoryItemToDraft(item))
        }

        form.setValue('pawnSelected', selectedPawn);
    };

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

    const updatePawnItem = (updatedItem: InventoryItemDraft) => {
        const currentPawn = form.getValues('pawnSelected');
        if (!currentPawn) return;

        const updatedItems = currentPawn.items.map(item =>
            item.id === updatedItem.id ? updatedItem : item
        );

        form.setValue('pawnSelected', {
            ...currentPawn,
            items: updatedItems
        });
    };

    return {
        form,
        items,
        loading,
        submitForfeit,
        searchByDate,
        onPawnSelected,
        updatePawnItem
    };
};
