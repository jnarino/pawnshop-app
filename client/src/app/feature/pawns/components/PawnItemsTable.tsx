import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from '@/components/ui/badge';
import editIcon from '@/assets/icons/edit.svg';
import deleteIcon from '@/assets/icons/delete.svg';
import visibilityIcon from '@/assets/icons/visibility.svg';
import type { InventoryItemDraft } from '@/app/feature/_shared/inventory-item';

export interface PawnItemsTableProps {
    items: InventoryItemDraft[];
    isViewMode: boolean;
    disabled?: boolean;
    onView?: (item: InventoryItemDraft) => void;
    onEdit?: (item: InventoryItemDraft) => void;
    onRemove?: (itemId: string) => void;
    selectable?: boolean;
    selectedItems?: Set<string>;
    disabledItemIds?: Set<string>;
    onSelectionChange?: (selectedIds: Set<string>) => void;
}

export function PawnItemsTable({
    items,
    isViewMode,
    disabled = false,
    onView,
    onEdit,
    onRemove,
    selectable = false,
    selectedItems = new Set(),
    disabledItemIds = new Set(),
    onSelectionChange,
}: PawnItemsTableProps) {
    const handleSelectAll = (checked: boolean) => {
        if (!onSelectionChange) return;
        if (checked) {
            const allIds = new Set(items.map(item => item.id!).filter(Boolean));
            onSelectionChange(allIds);
        } else {
            onSelectionChange(new Set());
        }
    };

    const handleSelectItem = (id: string, checked: boolean) => {
        if (!onSelectionChange) return;
        const newSelected = new Set(selectedItems);
        if (checked) {
            newSelected.add(id);
        } else {
            newSelected.delete(id);
        }
        onSelectionChange(newSelected);
    };

    const allSelected = items.length > 0 && items.every(item => item.id && selectedItems.has(item.id));
    if (items.length === 0) {
        return (
            <div className="py-10 text-center text-gray-500">
                No items.
            </div>
        );
    }

    return (
        <Table stickyHeader>
            <TableHeader>
                <TableRow>
                    {selectable && (
                        <TableHead sticky className="w-[50px] bg-white z-20">
                            <Checkbox
                                checked={allSelected}
                                onCheckedChange={(checked) => handleSelectAll(!!checked)}
                            />
                        </TableHead>
                    )}
                    <TableHead sticky className="w-[300px] bg-white z-20">Item</TableHead>
                    {isViewMode && <TableHead sticky className="bg-white z-20">Status</TableHead>}
                    <TableHead sticky className="bg-white z-20">Quantity</TableHead>
                    <TableHead sticky className="bg-white z-20">Value</TableHead>
                    <TableHead sticky className="bg-white z-20">Total</TableHead>
                    {(onView || onEdit || onRemove) && (
                        <TableHead sticky className="text-center bg-white z-20">Actions</TableHead>
                    )}
                </TableRow>
            </TableHeader>
            <TableBody>
                {items.map((item) => (
                    <TableRow key={item.id}>
                        {selectable && (
                            <TableCell>
                                <Checkbox
                                    checked={item.id ? selectedItems.has(item.id) : false}
                                    onCheckedChange={(checked) => item.id && handleSelectItem(item.id, !!checked)}
                                    disabled={!item.id || (item.id ? disabledItemIds.has(item.id) : false)}
                                />
                            </TableCell>
                        )}
                        <TableCell>
                            <div>
                                <div className="font-semibold">{item.categoryName || item.type}</div>
                                {item.description && <div className="text-sm text-gray-600">{item.description}</div>}
                                {item.brandName && <div className="text-sm text-gray-600">Brand: {item.brandName}</div>}
                                {item.model && <div className="text-sm text-gray-600">Model: {item.model}</div>}
                            </div>
                        </TableCell>
                        {isViewMode && (
                            <TableCell>
                                <Badge variant="outline">
                                    {item.status === "B" ? "PURCHASED" : item.status === "P" ? "PAWN" : "-"}
                                </Badge>
                            </TableCell>
                        )}
                        <TableCell>{item.quantity || 1}</TableCell>
                        <TableCell>${Number(item.amount || 0).toFixed(2)}</TableCell>
                        <TableCell className="font-medium">${(Number(item.amount || 0) * Number(item.quantity || 1)).toFixed(2)}</TableCell>

                        {(onView || onEdit || onRemove) && (
                            <TableCell className="text-center">
                                <div className="flex gap-2 justify-center items-center">
                                    {isViewMode && onView && (
                                        <button
                                            type="button"
                                            onClick={() => onView(item)}
                                            className="cursor-pointer hover:opacity-70"
                                        >
                                            <img
                                                src={visibilityIcon}
                                                alt="View"
                                                className="w-5 h-5"
                                                style={{ filter: 'brightness(0) saturate(100%)' }}
                                            />
                                        </button>
                                    )}

                                    {!isViewMode && (
                                        <>
                                            {onEdit && (
                                                <button
                                                    type="button"
                                                    onClick={() => onEdit(item)}
                                                    disabled={disabled}
                                                    className="cursor-pointer hover:opacity-70 disabled:opacity-30 !p-0"
                                                >
                                                    <img src={editIcon} alt="Edit" className="w-6 h-6" />
                                                </button>
                                            )}

                                            {onRemove && item.id && (
                                                <button
                                                    type="button"
                                                    onClick={() => onRemove(item.id!)}
                                                    disabled={disabled}
                                                    className="cursor-pointer hover:opacity-70 disabled:opacity-30 !p-0"
                                                >
                                                    <img src={deleteIcon} alt="Delete" className="w-6 h-6" />
                                                </button>
                                            )}
                                        </>
                                    )}
                                </div>
                            </TableCell>
                        )}
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}
