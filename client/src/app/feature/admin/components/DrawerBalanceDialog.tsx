import { useState, useEffect, useMemo } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { DollarInput } from '@/components/ui/dollar-input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { salesApi } from '@/app/core/api/salesApi';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface DrawerBalanceDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

interface TenderBalance {
    name: string;
    available: number;
    count: string;
}

export default function DrawerBalanceDialog({ open, onOpenChange }: DrawerBalanceDialogProps) {
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [tenders, setTenders] = useState<TenderBalance[]>([]);
    const [leaveInDrawer, setLeaveInDrawer] = useState('0.00');
    // const [note, setNote] = useState(''); // Removed unused if not exposed in UI or just default it

    useEffect(() => {
        if (open) {
            loadBalances();
        }
    }, [open]);

    const loadBalances = async () => {
        setLoading(true);
        try {
            const data = await salesApi.getDrawerBalance();
            const initialTenders = Object.entries(data.mainDrawerBalance).map(([name, amount]) => ({
                name,
                available: amount,
                count: amount.toFixed(2),
            }));
            setTenders(initialTenders);
            // Default leave in drawer to CASH amount
            const cash = initialTenders.find(t => t.name === 'CASH');
            if (cash) {
                setLeaveInDrawer(cash.available.toFixed(2));
            }
        } catch (error) {
            console.error('Failed to load drawer balances:', error);
            toast.error('Failed to load drawer balances');
        } finally {
            setLoading(false);
        }
    };

    const updateCount = (index: number, value: string) => {
        const newTenders = [...tenders];
        newTenders[index].count = value;
        setTenders(newTenders);

        if (newTenders[index].name === 'CASH') {
            setLeaveInDrawer(value);
        }
    };

    const totals = useMemo(() => {
        const availableTotal = tenders.reduce((sum, t) => sum + t.available, 0);
        const countTotal = tenders.reduce((sum, t) => sum + (parseFloat(t.count) || 0), 0);
        return { availableTotal, countTotal };
    }, [tenders]);

    const handleSubmit = async () => {
        setSubmitting(true);
        try {
            // Map tender names to camelCase for the API
            const nameMapping: Record<string, string> = {
                'CASH': 'cash',
                'AMERICAN EXPRESS': 'americanExpress',
                'DEBIT': 'debit',
                'DISCOVER': 'discover',
                'MASTER CARD': 'masterCard',
                'VISA': 'visa',
                'CHECK': 'check',
                'CASH PASS': 'cashPass'
            };

            const tenderAmounts: Record<string, number> = {};
            tenders.forEach(t => {
                const amount = parseFloat(t.count) || 0;
                if (amount > 0) {
                    const key = nameMapping[t.name] || t.name.toLowerCase().replace(/\s+/g, '');
                    tenderAmounts[key] = amount;
                }
            });

            // Simple Miami/New_York ISO conversion
            const now = new Date();
            const miamiFormatter = new Intl.DateTimeFormat('en-CA', {
                timeZone: 'America/New_York',
                year: 'numeric', month: '2-digit', day: '2-digit',
                hour: '2-digit', minute: '2-digit', second: '2-digit',
                hourCycle: 'h23'
            });
            const parts = miamiFormatter.formatToParts(now);
            const f = (p: string) => parts.find(part => part.type === p)?.value;
            const miamiIso = `${f('year')}-${f('month')}-${f('day')}T${f('hour')}:${f('minute')}:${f('second')}.000Z`;

            await salesApi.closeDrawerBalance({
                cashBalance: parseFloat(leaveInDrawer) || 0,
                tenderAmounts,
                occurredAt: miamiIso,
                note: 'Drawer Balance'
            });

            toast.success('Drawer balanced successfully');
            onOpenChange(false);
        } catch (error) {
            console.error('Failed to submit drawer balance:', error);
            toast.error('Failed to submit drawer balance');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Drawer Balance</DialogTitle>
                    <DialogDescription>
                        Reconcile drawer amounts and close the session.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Balance Table */}
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[40%]">Type</TableHead>
                                    <TableHead className="w-[30%] text-right">Available</TableHead>
                                    <TableHead className="w-[30%] text-right">Count</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={3} className="h-24 text-center">
                                            <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                                        </TableCell>
                                    </TableRow>
                                ) : tenders.map((t, i) => (
                                    <TableRow key={t.name}>
                                        <TableCell className="font-medium uppercase">{t.name}</TableCell>
                                        <TableCell className="text-right font-mono">{t.available.toFixed(2)}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end">
                                                <DollarInput
                                                    value={t.count}
                                                    onChange={(v) => updateCount(i, v)}
                                                    className="h-8 w-24 text-right"
                                                />
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                            <TableBody className="border-t-2 font-bold bg-muted/50">
                                <TableRow>
                                    <TableCell>Total</TableCell>
                                    <TableCell className="text-right font-mono">{totals.availableTotal.toFixed(2)}</TableCell>
                                    <TableCell className="text-right font-mono pr-4">{totals.countTotal.toFixed(2)}</TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </div>

                    {/* Footer Controls */}
                    <div className="flex items-center justify-end gap-4">
                        <Label className="text-sm font-medium">Leave in drawer:</Label>
                        <div className="w-32">
                            <DollarInput
                                value={leaveInDrawer}
                                onChange={setLeaveInDrawer}
                                className="text-right"
                            />
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-4">
                        <Button
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            disabled={loading || submitting}
                            onClick={handleSubmit}
                        >
                            {submitting ? (
                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            ) : null}
                            Balance
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
