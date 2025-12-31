import { useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { InventoryItemDraft, ScrappedItem } from './types';

interface ScrapDetailsProps {
    draft: InventoryItemDraft;
    updateField: (field: keyof InventoryItemDraft, value: any) => void;
    disabled?: boolean;
    availableScrapItems?: { itemDescription: string; inventoryNumber: string }[];
}

export function ScrapDetails({ draft, updateField, disabled, availableScrapItems = [] }: ScrapDetailsProps) {
    const isJewelry = !!draft.stones; // Or use another check if 'stones' exists
    const stones = draft.stones || [];
    const hasStones = stones.length > 0;

    console.log('scrapitems', availableScrapItems)

    useEffect(() => {
        if (!draft.scrappedIntoInvItem || draft.scrappedIntoInvItem.length === 0) {
            const initialScrapItems: ScrappedItem[] = [{
                inventoryNumber: '',
                quantity: draft.weight || '1',
                description: draft.description || '',
            }];
            if (hasStones) {
                const initialScrapStoneItems: ScrappedItem[] = [...initialScrapItems, ...stones.map(stone => ({
                    inventoryNumber: '',
                    quantity: String(stone.quantity || ''),
                    description: `Stone: ${stone.type}, ${stone.shape || ''}, ${stone.color || ''}, ${stone.clarity || ''}`,
                    stoneId: stone.id,
                }))];
                updateField('scrappedIntoInvItem', initialScrapStoneItems);
            } else {
                updateField('scrappedIntoInvItem', initialScrapItems);
            }
        }
    }, [hasStones, draft.scrappedIntoInvItem, stones, draft.quantity, draft.description, updateField]);

    const handleUpdateScrapItem = (index: number, field: keyof ScrappedItem, value: string) => {
        const currentItems = [...(draft.scrappedIntoInvItem || [])];
        if (currentItems[index]) {
            currentItems[index] = { ...currentItems[index], [field]: value };
            updateField('scrappedIntoInvItem', currentItems);
        }
    };

    const currentScrapRows = draft.scrappedIntoInvItem || [];

    if (currentScrapRows.length === 0) return null;

    return (
        <div className="p-4 bg-red-50 rounded-lg space-y-4 border border-red-200 mt-4">
            <h4 className="text-sm font-bold text-red-700">Scrap Details</h4>

            <div className="space-y-3">
                {currentScrapRows.map((item, index) => (
                    <div key={index} className="grid grid-cols-12 gap-3 items-end">
                        <div className="col-span-4 space-y-1">
                            <Label className="text-xs font-semibold">Inventory Item</Label>
                            <Select
                                value={item.inventoryNumber}
                                onValueChange={(value) => handleUpdateScrapItem(index, 'inventoryNumber', value)}
                                disabled={disabled}
                            >
                                <SelectTrigger className="h-8 text-xs bg-white">
                                    <SelectValue placeholder="Select Item" />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableScrapItems.map((option) => (
                                        <SelectItem key={option.inventoryNumber} value={option.inventoryNumber} className="text-xs">
                                            ({option.inventoryNumber}) {option.itemDescription}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="col-span-2 space-y-1">
                            <Label className="text-xs font-semibold">Quantity</Label>
                            <Input
                                type="number"
                                step="0.01"
                                value={item.quantity}
                                onChange={(e) => handleUpdateScrapItem(index, 'quantity', e.target.value)}
                                disabled={disabled}
                                className="h-8 text-xs bg-white"
                                placeholder="0.00"
                            />
                        </div>
                        <div className="col-span-6 space-y-1">
                            <Label className="text-xs font-semibold">Description</Label>
                            <Input
                                value={item.description}
                                onChange={(e) => handleUpdateScrapItem(index, 'description', e.target.value)}
                                disabled={disabled}
                                className="h-8 text-xs bg-white"
                                placeholder="Description"
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
