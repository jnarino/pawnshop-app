import { useState } from 'react';
import { CustomerData } from '@/app/feature/_shared/types/pawnTicket';
import { PawnItemsTable } from '../../components/PawnItemsTable';
import { Loader2 } from 'lucide-react';
import { useCustomerPreviousItems } from '../../hooks/useCustomerPreviousItems';
import { Button } from '@/components/ui/button';
import { usePawnWorkflow } from '../../contexts/PawnWorkflowContext';

interface PreviousItemsTabProps {
    customer: CustomerData | null;
}

export const PreviousItemsTab = ({ customer }: PreviousItemsTabProps) => {
    const { items, loading } = useCustomerPreviousItems(customer?.id);
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
    const { updatePawnDraft, pawnDraft, setActiveTab } = usePawnWorkflow();

    const draftedItemIds = new Set(
        pawnDraft.items
            .map(item => item.sourceItemId)
            .filter((id): id is string => !!id)
    );

    const handleSelectionChange = (newSelected: Set<string>) => {
        setSelectedItems(newSelected);
    };

    const handleAddToNewPawn = () => {
        const itemsToAdd = items.filter(item =>
            item.id &&
            selectedItems.has(item.id) &&
            !draftedItemIds.has(item.id)
        );

        if (itemsToAdd.length === 0) return;

        const newInventoryItems = itemsToAdd.map(item => ({
            ...item,
            id: crypto.randomUUID(),
            sourceItemId: item.id,
            status: 'P'
        }));

        updatePawnDraft({
            items: [...pawnDraft.items, ...newInventoryItems]
        });

        const newSelected = new Set(selectedItems);
        itemsToAdd.forEach(item => {
            if (item.id) newSelected.delete(item.id);
        });
        setSelectedItems(newSelected);

        setActiveTab('newPawn');
    };

    const effectiveSelectedItems = new Set([...selectedItems, ...draftedItemIds]);

    if (loading) {
        return (
            <div className="flex items-center justify-center p-10">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
        );
    }

    if (!customer) {
        return (
            <div className="flex items-center justify-center h-full text-muted-foreground p-10">
                Please select a customer to view previous items.
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold">Previous Items for {customer.firstName} {customer.lastName}</h2>

            </div>
            <PawnItemsTable
                items={items}
                isViewMode={true}
                selectable={true}
                selectedItems={effectiveSelectedItems}
                disabledItemIds={draftedItemIds}
                onSelectionChange={handleSelectionChange}
            />
            {Array.from(selectedItems).some(id => !draftedItemIds.has(id)) && (
                <div className="flex justify-end">
                    <Button onClick={handleAddToNewPawn}>
                        Add to New Pawn
                    </Button>
                </div>
            )}
        </div>
    );
};