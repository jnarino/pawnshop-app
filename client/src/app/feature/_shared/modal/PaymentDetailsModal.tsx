import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { tenderTypeApi } from '@/app/core/api/tenderTypeApi';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export interface PaymentDetailsData {
    totalAmount: number;
    tenderChange: number;
    tenders: {
        id: string;
        tenderTypeId: number;
        amount: number;
        createdAt?: string;
    }[];
}

interface Props {
    open: boolean;
    data: PaymentDetailsData;
    onClose: () => void;
}

export function PaymentDetailsModal({ open, data, onClose }: Props) {
    const [tenderTypes, setTenderTypes] = useState<Record<number, string>>({});

    useEffect(() => {
        if (open) {
            loadTenderTypes();
        }
    }, [open]);

    const loadTenderTypes = async () => {
        try {
            const types = await tenderTypeApi.list();
            const typeMap: Record<number, string> = {};
            types.forEach(t => {
                typeMap[t.id] = t.name;
            });
            setTenderTypes(typeMap);
        } catch (error) {
            console.error('Failed to load tender types', error);
        }
    };

    const totalTendered = data.tenders.reduce((sum, t) => sum + Number(t.amount), 0);

    if (!open) return null;

    return (
        <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Payment Information</DialogTitle>
                </DialogHeader>

                <div className="py-4 space-y-4">

                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Method</TableHead>
                                    <TableHead className="text-right">Amount</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.tenders.map((tender) => (
                                    <TableRow key={tender.id}>
                                        <TableCell className="font-medium">
                                            {tenderTypes[tender.tenderTypeId] || `Type ${tender.tenderTypeId}`}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            ${Number(tender.amount).toFixed(2)}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    <div className="space-y-2 bg-muted/50 p-4 rounded-lg">
                        <div className="flex justify-between text-sm">
                            <span>Total Sale:</span>
                            <span className="font-semibold">${Number(data.totalAmount).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span>Total Tendered:</span>
                            <span className="font-semibold text-green-700">${totalTendered.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm pt-2 border-t">
                            <span>Change:</span>
                            <span className="font-bold">${Number(data.tenderChange).toFixed(2)}</span>
                        </div>
                    </div>

                </div>

                <DialogFooter>
                    <Button onClick={onClose}>Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
