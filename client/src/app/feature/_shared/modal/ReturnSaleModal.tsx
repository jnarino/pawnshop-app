import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { InventoryItemDraft } from '@/app/feature/_shared/pawn-ticket';

// Extend the draft type to include controlNumber if it's missing in the base type
interface ExtendedInventoryItemDraft extends InventoryItemDraft {
    controlNumber?: string;
    items?: any; // For status check
    lineAmount?: number;
}

interface Props {
    readonly open: boolean;
    readonly items: InventoryItemDraft[];
    readonly onCancel: () => void;
    readonly onConfirm: (selectedItems: InventoryItemDraft[], reason: string) => void;
}

export function ReturnSaleModal({ open, items, onCancel, onConfirm }: Props) {
    const [reason, setReason] = useState('');
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

    const handleToggleItem = (itemId: string) => {
        const newSelected = new Set(selectedItems);
        if (newSelected.has(itemId)) {
            newSelected.delete(itemId);
        } else {
            newSelected.add(itemId);
        }
        setSelectedItems(newSelected);
    };

    const handleToggleAll = (checked: boolean) => {
        if (checked) {
            const allIds = items.map(i => i.id || '').filter(Boolean);
            setSelectedItems(new Set(allIds));
        } else {
            setSelectedItems(new Set());
        }
    };

    const handleSubmit = () => {
        const itemsToReturn = items.filter(i => i.id && selectedItems.has(i.id));
        onConfirm(itemsToReturn, reason);
    };

    const totalRefund = items
        .filter(i => i.id && selectedItems.has(i.id))
        .reduce((sum, i) => sum + (Number(i.amount) || Number((i as any).lineAmount) || Number(i.priceEach) || 0), 0);

    if (!open) return null;

    return (
        <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
            <DialogContent className="sm:max-w-[700px]">
                <DialogHeader>
                    <DialogTitle>Return Items / Void Sale</DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Reason for return *</Label>
                        <Textarea
                            placeholder="Enter reason..."
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className="resize-none"
                        />
                    </div>

                    <div className="rounded-md border max-h-[300px] overflow-y-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[50px]">
                                        <Checkbox
                                            checked={selectedItems.size === items.length && items.length > 0}
                                            onCheckedChange={(checked) => handleToggleAll(checked === true)}
                                        />
                                    </TableHead>
                                    <TableHead>Item / Inventory #</TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead>Qty</TableHead>
                                    <TableHead className="text-right">Price</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {items.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell>
                                            <Checkbox
                                                checked={item.id ? selectedItems.has(item.id) : false}
                                                onCheckedChange={() => item.id && handleToggleItem(item.id)}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            {item.inventoryItem?.inventoryNumber || item.inventoryNumber || (item as any).controlNumber}
                                        </TableCell>
                                        <TableCell className="max-w-[300px] truncate" title={item.description}>
                                            {item.description}
                                        </TableCell>
                                        <TableCell>
                                            {item.quantity || 1}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            ${(Number(item.amount) || Number((item as any).lineAmount) || Number(item.priceEach) || 0).toFixed(2)}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    <div className="flex justify-end bg-muted/50 p-4 rounded-lg">
                        <div className="text-right">
                            <span className="text-sm text-muted-foreground mr-2">Total Refund:</span>
                            <span className="text-lg font-bold">${totalRefund.toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onCancel}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={!reason.trim() || selectedItems.size === 0}
                        className="bg-destructive hover:bg-destructive/90"
                    >
                        Save Void / Return
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
