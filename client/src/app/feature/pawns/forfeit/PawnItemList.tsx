import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { useCallback, useEffect, useState } from 'react';
import { Tooltip } from '@/components/ui/tooltip';
import { ArrowDownToLine } from 'lucide-react';
import { InventoryItemDraft } from '../../_shared/inventory-item';
import { InventoryItemModal } from '../../_shared/inventory-item/components/InventoryItemModal';
import { ViewMode } from '../../_shared/types/viewMode';
import { getByInventoryNumber } from '@/app/core/api/inventoryItemApi';
import { mapApiToInventoryItemDraft } from '@/app/shared/components/ElectronMenuBridge';
import { useForfeitStore } from './stores/forfeitStore';

export const PawnItemList = () => {
    const { selectedItems: items, updateItem: onItemUpdate, scrapItems, fetchScrapItems } = useForfeitStore();
    const [editingRowId, setEditingRowId] = useState<string | null>(null);
    const [inventoryItemSelected, setInventoryItemSelected] = useState<InventoryItemDraft | null>();
    const [currentEditIndex, setCurrentEditIndex] = useState<number>(-1);

    useEffect(() => {
        fetchScrapItems();
    }, [fetchScrapItems]);

    const handleCloseInventoryItem = () => {
        setEditingRowId(null);
        setInventoryItemSelected(null);
        setCurrentEditIndex(-1);
    };

    const handleSaveInventoryItem = (item: InventoryItemDraft) => {
        const updatedItem = { ...item, status: 'Pulled' };
        onItemUpdate(updatedItem);

        const nextIndex = currentEditIndex + 1;
        if (nextIndex < items.length) {
            const nextItem = items[nextIndex];
            setCurrentEditIndex(nextIndex);
            setEditingRowId(nextItem.id || null);
            setInventoryItemSelected(nextItem);
        } else {
            handleCloseInventoryItem();
        }
    };

    const handleFindInventory = useCallback(async (inventoryNumber: string | undefined, index: number) => {
        if (!inventoryNumber) return;
        try {
            const item = await getByInventoryNumber(inventoryNumber);
            const mappedItem = mapApiToInventoryItemDraft(item);
            const itemExisted = items.find(item => item.id === mappedItem.id && item.status === "Pulled");
            if (itemExisted) {
                setInventoryItemSelected(itemExisted);
            } else {
                setInventoryItemSelected(mappedItem);
            }
            setCurrentEditIndex(index);
            setEditingRowId(item.id || null);
        } catch (err) {
            console.error('Error finding inventory item:', err);
        }
    }, [items, inventoryItemSelected]);

    return (
        <>
            <Table stickyHeader>
                <TableHeader>
                    <TableRow>
                        <TableHead sticky className="bg-white z-20">Description</TableHead>
                        <TableHead sticky className="bg-white z-20">Quantity</TableHead>
                        <TableHead sticky className="bg-white z-20">Amount each</TableHead>
                        <TableHead sticky className="bg-white z-20">Pull status</TableHead>
                        <TableHead sticky className="text-center bg-white z-20">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {items.map((item, index) => (
                        <TableRow
                            key={item.id}
                            className={item.id === editingRowId ? "bg-amber-50 border-l-4 border-amber-500" : ""}
                        >
                            <TableCell>
                                {item.description}
                            </TableCell>
                            <TableCell>{item.quantity}</TableCell>
                            <TableCell>${Number(item.amount).toFixed(2)}</TableCell>
                            <TableCell className={item.status === "Pending to pull" ? "bg-amber-50 border-l-4 border-amber-500" : item.status === "Pulled" ? "bg-green-50 border-l-4 border-green-500" : ""}>{item.status}</TableCell>
                            <TableCell className="text-center">
                                <Tooltip content="Pull item">
                                    <Button className='!p-0'
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => {
                                            handleFindInventory(item.inventoryNumber, index);
                                        }}
                                        disabled={false || !!editingRowId}
                                    >
                                        <ArrowDownToLine />
                                    </Button>
                                </Tooltip>
                            </TableCell>
                        </TableRow>
                    ))}
                    {items.length === 0 &&
                        <TableRow id="empty-state-row">
                            <TableCell colSpan={6} className="text-center p-4">
                                <p><strong>No data found</strong></p>
                                <p>Please search by ticket # or select a date range</p>
                            </TableCell>
                        </TableRow>
                    }
                </TableBody>
            </Table>
            {inventoryItemSelected && (
                <InventoryItemModal
                    mode={ViewMode.PULL}
                    open={!!inventoryItemSelected}
                    initial={inventoryItemSelected}
                    onCancel={handleCloseInventoryItem}
                    onSave={handleSaveInventoryItem}
                    hasNextItem={currentEditIndex < items.length - 1}
                    scrapItems={scrapItems}
                />
            )}
        </>
    )
}