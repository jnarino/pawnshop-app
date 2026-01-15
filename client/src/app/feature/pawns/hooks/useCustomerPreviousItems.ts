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

            const allItems: InventoryItemDraft[] = itemsList.map((item, index) => {
                const attributes = (item.attributes || {}) as any;

                const brand = item.brand;
                const brandId = typeof brand === 'object' && brand !== null ? (brand as any).id : '';
                const brandName = (typeof brand === 'object' && brand !== null ? (brand as any).name : (typeof brand === 'string' ? brand : '')).replace(/'$/, '').trim();

                const colorObj = item.colorId;
                const colorIdVal = typeof colorObj === 'object' && colorObj !== null ? (colorObj as any).id : (typeof colorObj === 'string' ? colorObj : '');
                const colorNameVal = typeof colorObj === 'object' && colorObj !== null ? (colorObj as any).name : '';

                const sizeLengthVal = typeof attributes.sizeLength === 'object' && attributes.sizeLength !== null
                    ? attributes.sizeLength.id
                    : attributes.sizeLength;

                const rawUnit = attributes.weightUnit || '';
                const weightUnit = rawUnit.toUpperCase() === 'GRM' ? 'Grams' : rawUnit;

                return {
                    id: item.id || crypto.randomUUID(),
                    type: item.inventoryCategory?.id || '',
                    categoryName: item.inventoryCategory?.name || 'Unknown',
                    subcategoryName: item.inventorySubcategory?.name || 'Unknown',
                    subcategoryId: item.inventorySubcategory?.id || '',
                    description: item.itemDescription || '',
                    brandId: brandId,
                    brandName: brandName,
                    brand: brandName,
                    color: colorIdVal,
                    colorName: colorNameVal,
                    model: item.model,
                    serial: item.serialNumber,
                    quantity: String(item.quantity || 1),
                    amount: String(item.priceAmount || 0),
                    resale: String(item.resale || ''),
                    minResale: String(item.minResale || ''),
                    replace: String(item.itemReplace || ''),
                    condition: item.itemCondition || '',
                    status: item.status || 'P',
                    ownerNumber: item.inventoryNumber || '',
                    metal: attributes.metal,
                    karat: attributes.karat,
                    style: attributes.style,
                    gender: attributes.gender,
                    sizeLength: sizeLengthVal,
                    weightUnit: weightUnit,
                    weight: String(item.extra?.weight || attributes.weight || ''),
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
