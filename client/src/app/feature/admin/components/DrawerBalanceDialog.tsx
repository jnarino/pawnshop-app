import { useState, useEffect, useMemo } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DollarInput } from '@/components/ui/dollar-input';
import { salesApi } from '@/app/core/api/salesApi';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface DrawerBalanceDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

type BalanceMode = 'deposit' | 'balance';

interface TenderBalance {
    name: string;
    available: number;
    count: string;
}

export default function DrawerBalanceDialog({ open, onOpenChange }: DrawerBalanceDialogProps) {
    const [mode, setMode] = useState<BalanceMode>('balance');
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [tenders, setTenders] = useState<TenderBalance[]>([]);
    const [leaveInDrawer, setLeaveInDrawer] = useState('0.00');
    const [note, setNote] = useState('');

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
                count: '0.00',
            }));
            setTenders(initialTenders);
            // Default leave in drawer to CASH amount if in balance mode
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

    const handleFill = () => {
        setTenders(prev => prev.map(t => ({ ...t, count: t.available.toFixed(2) })));
    };

    const updateCount = (index: number, value: string) => {
        const newTenders = [...tenders];
        newTenders[index].count = value;
        setTenders(newTenders);
    };

    const totals = useMemo(() => {
        const availableTotal = tenders.reduce((sum, t) => sum + t.available, 0);
        const countTotal = tenders.reduce((sum, t) => sum + (parseFloat(t.count) || 0), 0);
        const overShortTotal = countTotal - availableTotal;
        return { availableTotal, countTotal, overShortTotal };
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
                const key = nameMapping[t.name] || t.name.toLowerCase().replace(/\s+/g, '');
                tenderAmounts[key] = parseFloat(t.count) || 0;
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
                note: note || (mode === 'deposit' ? 'Bank Deposit' : 'Drawer Balance')
            });

            toast.success(mode === 'balance' ? 'Drawer balanced successfully' : 'Deposit recorded successfully');
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
            <DialogContent className="sm:max-w-[700px] bg-[#D4D0C8] border-2 border-white shadow-[2px_2px_0_0_#404040,-1px_-1px_0_0_#dfdfdf] p-1 gap-0 font-sans">
                <DialogHeader className="bg-[#000080] p-1 flex-row items-center justify-between space-y-0">
                    <DialogTitle className="text-white text-xs font-bold flex items-center gap-2">
                        Deposit Money from Main Drawer to Bank Account or Balance
                    </DialogTitle>
                </DialogHeader>

                <div className="p-4 space-y-6 text-[#000000]">
                    {/* Mode Selection */}
                    <div className="border border-[#808080] p-2 relative pt-4 mt-2">
                        <span className="absolute -top-2.5 left-2 bg-[#D4D0C8] px-1 text-xs">Mode</span>
                        <RadioGroup
                            value={mode}
                            onValueChange={(v) => setMode(v as BalanceMode)}
                            className="flex flex-col gap-2"
                        >
                            <div className="flex items-center space-x-2">
                                <div className="w-4 h-4 border border-[#808080] bg-white rounded-full flex items-center justify-center p-[2px]">
                                    <RadioGroupItem value="deposit" id="deposit" className="w-full h-full border-0 focus:ring-0" />
                                </div>
                                <Label htmlFor="deposit" className="text-xs cursor-pointer">Deposit</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <div className="w-4 h-4 border border-[#808080] bg-white rounded-full flex items-center justify-center p-[2px]">
                                    <RadioGroupItem value="balance" id="balance" className="w-full h-full border-0 focus:ring-0" />
                                </div>
                                <Label htmlFor="balance" className="text-xs cursor-pointer">Balance</Label>
                            </div>
                        </RadioGroup>
                    </div>

                    {/* Balance Table */}
                    <div className="space-y-1">
                        <div className="flex justify-end pr-32">
                            <button
                                onClick={handleFill}
                                className="text-xs underline text-blue-800 hover:text-blue-600 uppercase font-bold"
                            >
                                FILL
                            </button>
                        </div>

                        <div className="border-2 border-[#808080] overflow-hidden bg-white">
                            <table className="w-full text-xs text-left border-collapse">
                                <thead className="bg-[#D4D0C8] border-b border-[#808080]">
                                    <tr>
                                        <th className="px-2 py-1 border-r border-[#808080] w-[40%] text-center">Type</th>
                                        <th className="px-2 py-1 border-r border-[#808080] w-[20%] text-center">Available</th>
                                        <th className="px-2 py-1 border-r border-[#808080] w-[20%] text-center text-red-700">Count</th>
                                        <th className="px-2 py-1 w-[20%] text-center">Over/Short</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr>
                                            <td colSpan={4} className="py-8 text-center">
                                                <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#808080]" />
                                            </td>
                                        </tr>
                                    ) : tenders.map((t, i) => {
                                        const overShort = (parseFloat(t.count) || 0) - t.available;
                                        return (
                                            <tr key={t.name} className="border-b border-[#D4D0C8] last:border-0 h-8">
                                                <td className="px-2 font-medium border-r border-[#D4D0C8] uppercase">{t.name}</td>
                                                <td className="px-2 text-right border-r border-[#D4D0C8] font-mono">{t.available.toFixed(2)}</td>
                                                <td className="px-1 border-r border-[#D4D0C8]">
                                                    <DollarInput
                                                        value={t.count}
                                                        onChange={(v) => updateCount(i, v)}
                                                        className="h-6 text-xs text-right border-0 focus-visible:ring-1 focus-visible:ring-blue-400 font-mono"
                                                    />
                                                </td>
                                                <td className={`px-2 text-right font-mono ${overShort < 0 ? 'text-red-600' : overShort > 0 ? 'text-green-600' : ''}`}>
                                                    {overShort.toFixed(2)}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                                <tfoot className="bg-[#D4D0C8] border-t-2 border-[#808080] font-bold">
                                    <tr className="h-8">
                                        <td className="px-2 border-r border-[#808080]"></td>
                                        <td className="px-2 text-right border-r border-[#808080] font-mono">{totals.availableTotal.toFixed(2)}</td>
                                        <td className="px-2 text-right border-r border-[#808080] font-mono">{totals.countTotal.toFixed(2)}</td>
                                        <td className={`px-2 text-right font-mono ${totals.overShortTotal < 0 ? 'text-red-700' : totals.overShortTotal > 0 ? 'text-green-700' : ''}`}>
                                            {totals.overShortTotal.toFixed(2)}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>

                    {/* Footer Controls */}
                    <div className="flex items-center justify-end gap-16 pr-2">
                        <div className="flex items-center gap-2">
                            <Label className="text-xs">Leave in drawer :</Label>
                            <div className="w-32">
                                <DollarInput
                                    value={leaveInDrawer}
                                    onChange={setLeaveInDrawer}
                                    className="h-7 text-xs text-right bg-white border-2 border-[#808080] font-mono"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-center gap-4 pt-2">
                        <Button
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            className="bg-[#D4D0C8] border-2 border-white shadow-[1px_1px_0_0_#404040,-1px_-1px_0_0_#dfdfdf] h-8 px-8 text-xs min-w-[100px] hover:bg-[#C0C0C0]"
                        >
                            Cancel
                        </Button>
                        <Button
                            disabled={loading || submitting}
                            onClick={handleSubmit}
                            className="bg-[#D4D0C8] border-2 border-white shadow-[1px_1px_0_0_#404040,-1px_-1px_0_0_#dfdfdf] h-8 px-8 text-xs min-w-[100px] hover:bg-[#C0C0C0] text-black"
                        >
                            {submitting ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                mode === 'balance' ? 'Balance' : 'Deposit'
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
