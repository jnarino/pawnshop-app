import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useEffect, useState } from "react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { layawayApi } from "@/app/core/api/layawayApi";
import { Button } from "@/components/ui/button";

interface PaymentHistoryItem {
    occurredAt: string;
    transactionType: string;
    amount: number;
    clerkUsername: string;
}

interface Props {
    open: boolean;
    onClose: () => void;
    controlNumber: string;
    customerId: string;
}

export function PaymentHistoryModal({ open, onClose, controlNumber, customerId }: Props) {
    const [history, setHistory] = useState<PaymentHistoryItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [totalAmount, setTotalAmount] = useState(0);

    useEffect(() => {
        if (open && controlNumber) {
            loadHistory();
        }
    }, [open, controlNumber]);

    const loadHistory = async () => {
        setLoading(true);
        try {
            const data = await layawayApi.getPaymentHistory(controlNumber, customerId);
            setHistory(data);
            const total = data.reduce((acc, item) => acc + item.amount, 0);
            setTotalAmount(total);
        } catch (error) {
            console.error("Failed to load payment history", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle>Payment History - {controlNumber}</DialogTitle>
                </DialogHeader>

                <div className="rounded-md border max-h-[400px] overflow-y-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[180px] bg-white sticky top-0 z-10">Date In</TableHead>
                                <TableHead className="bg-white sticky top-0 z-10">Action</TableHead>
                                <TableHead className="bg-white sticky top-0 z-10">Employee</TableHead>
                                <TableHead className="text-right bg-white sticky top-0 z-10">Amount</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center h-24">
                                        Loading...
                                    </TableCell>
                                </TableRow>
                            ) : history.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">
                                        No payment history found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                history.map((item, index) => (
                                    <TableRow key={index}>
                                        <TableCell>{formatDate(item.occurredAt, true)}</TableCell>
                                        <TableCell>{item.transactionType}</TableCell>
                                        <TableCell>{item.clerkUsername}</TableCell>
                                        <TableCell className="text-right font-medium">
                                            {formatCurrency(item.amount)}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                            <TableRow>
                                <TableCell colSpan={4} className="text-right font-medium">
                                    Total: {formatCurrency(totalAmount)}
                                </TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </div>

                <div className="flex justify-end">
                    <Button onClick={onClose}>Close</Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
