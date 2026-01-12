import { useState, useCallback, useEffect } from 'react';
import { InventoryItemDraft } from '@/app/feature/_shared/inventory-item';
import { pawnTicketApi } from '@/app/core/api/pawnTicketApi';

interface UseCustomerPreviousItemsResult {
    items: InventoryItemDraft[];
    loading: boolean;
    error: Error | null;
    refetch: () => Promise<void>;
}

export const useCustomerPreviousItems = (customerId: string | undefined): UseCustomerPreviousItemsResult => {
    const [items, setItems] = useState<InventoryItemDraft[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const fetchItems = useCallback(async () => {
        if (!customerId) {
            setItems([]);
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const itemsList = await pawnTicketApi.getPreviousItemsByCustomer(customerId);

            const allItems: InventoryItemDraft[] = itemsList.map(item => {
                const attributes = item.attributes || {};

                return {
                    id: item.id || crypto.randomUUID(),
                    type: 'Item',
                    categoryName: item.inventoryCategory?.name || 'Unknown',
                    description: item.itemDescription || '',
                    brandName: (typeof item.brand === 'object' ? item.brand?.name : item.brand) || '',
                    model: item.model || '',
                    serial: item.serialNumber || '',
                    quantity: String(item.quantity || 1),
                    amount: String(item.priceAmount || 0),
                    status: item.status || 'P',
                    ownerNumber: item.inventoryNumber || '',
                    metal: (attributes.metal as any)?.name,
                    karat: (attributes.karat as any)?.name,
                    weight: String(attributes.weight || ''),
                    stones: (item.extra?.stones as any[]) || [],
                };
            });

            setItems(allItems);
        } catch (err) {
            console.error("Failed to fetch previous items", err);
            setError(err instanceof Error ? err : new Error('Failed to fetch items'));
            setItems([]);
        } finally {
            setLoading(false);
        }
    }, [customerId]);

    useEffect(() => {
        fetchItems();
    }, [fetchItems]);

    return { items, loading, error, refetch: fetchItems };
};
