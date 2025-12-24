import { useCallback, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Loader2, AlertCircle, Search, X } from 'lucide-react';
import { useCustomerPawnTickets } from '../hooks/useCustomerPawnTickets';
import OtherPaymentModal from './OtherPaymentModal';
import type { CustomerActivePawnTicket } from '@/app/core/api/pawnTicketApi';
import visibilityIcon from '@/assets/icons/visibility.svg';
import PaymentMethodModal, { TenderMethod } from '../../_shared/modal/PaymentMethodModal';

const DEFAULT_PAWN_PERIOD_DAYS = 60;

type PaymentSelectionType = 'current' | 'redemption' | 'other' | null;

interface Props {
    customerId: string;
    onBack: () => void;
    onPawnSelected: (pawn: CustomerActivePawnTicket) => void;
    onViewPawn: (pawn: CustomerActivePawnTicket) => void;
}

export default function LocatePawnsTab({ customerId, onBack, onPawnSelected, onViewPawn }: Props) {
    const {
        filteredTickets,
        loading,
        error,
        selectedTicket,
        filterText,
        setFilterText,
        applyFilter,
        clearFilter,
        selectTicket,
    } = useCustomerPawnTickets(customerId);

    const [paymentSelections, setPaymentSelections] = useState<Record<string, { type: PaymentSelectionType, amount: number } | null>>({});
    const [otherAmounts, setOtherAmounts] = useState<Record<string, number>>({});
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedTicketForModal, setSelectedTicketForModal] = useState<CustomerActivePawnTicket | null>(null);
    const [showPaymentModal, setShowPaymentModal] = useState(false);

    const handlePaymentTypeChange = useCallback((ticketId: string, type: 'current' | 'redemption' | 'other') => {
        const ticket = filteredTickets.find(t => t.id === ticketId);
        if (!ticket) return;

        if (type === 'other') {
            if (paymentSelections[ticketId]?.type === 'other') {
                setPaymentSelections(prev => ({
                    ...prev,
                    [ticketId]: null
                }));
                setOtherAmounts(prev => ({
                    ...prev,
                    [ticketId]: 0
                }));
            } else {
                setSelectedTicketForModal(ticket);
                setModalOpen(true);
            }
            return;
        }

        setPaymentSelections(prev => ({
            ...prev,
            [ticketId]: prev[ticketId]?.type === type ? null : { type, amount: type === 'current' ? calculateCurrentCharges(ticket) : calculateRedemption(ticket) }
        }));
    }, [filteredTickets, paymentSelections]);

    const handleOtherPaymentDone = (amount: number) => {
        if (selectedTicketForModal) {
            setOtherAmounts(prev => ({
                ...prev,
                [selectedTicketForModal.id]: amount
            }));
            setPaymentSelections(prev => ({
                ...prev,
                [selectedTicketForModal.id]: amount > 0 ? { type: 'other', amount } : null
            }));
        }
        setModalOpen(false);
        setSelectedTicketForModal(null);
    };

    const calculateCurrentCharges = (ticket: CustomerActivePawnTicket) => {
        if (typeof ticket.currentCharges === 'number') return ticket.currentCharges;
        const amountFinanced = ticket.amountFinanced || 0;
        const periodicRate = ticket.periodicRate || 0;
        return amountFinanced * periodicRate;
    };

    const calculateRedemption = (ticket: CustomerActivePawnTicket) => {
        if (typeof ticket.redemptionAmount === 'number') return ticket.redemptionAmount;
        const amountFinanced = ticket.amountFinanced || 0;
        const currentCharges = calculateCurrentCharges(ticket);
        return amountFinanced + currentCharges;
    };

    const totalPayment = useMemo(() => {
        return Object.values(paymentSelections)
            .filter(selection => selection?.type)
            .reduce((sum, selection) => sum + (selection?.amount || 0), 0);
    }, [paymentSelections]);

    const handleSave = useCallback(() => {
        console.log('Save clicked', paymentSelections);
        setShowPaymentModal(true);
    }, [paymentSelections]);

    const handlePayAllCurrentCharges = useCallback(() => {
        const newSelections: Record<string, { type: PaymentSelectionType, amount: number } | null> = {};
        filteredTickets.forEach(ticket => {
            newSelections[ticket.id] = { type: 'current', amount: calculateCurrentCharges(ticket) };
        });
        setPaymentSelections(newSelections);
    }, [filteredTickets]);

    const handleRedeemAll = useCallback(() => {
        const newSelections: Record<string, { type: PaymentSelectionType, amount: number } | null> = {};
        filteredTickets.forEach(ticket => {
            newSelections[ticket.id] = { type: 'redemption', amount: calculateRedemption(ticket) };
        });
        setPaymentSelections(newSelections);
    }, [filteredTickets]);

    const handleClearSelections = useCallback(() => {
        setPaymentSelections({});
        setOtherAmounts({});
    }, []);

    const handleSearch = useCallback(() => {
        applyFilter();
    }, [applyFilter]);

    const handleClear = useCallback(() => {
        clearFilter();
    }, [clearFilter]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            applyFilter();
        }
    }, [applyFilter]);

    const formatDate = (dateStr: string) => {
        try {
            return new Date(dateStr).toLocaleDateString('en-US', {
                month: '2-digit',
                day: '2-digit',
                year: 'numeric'
            });
        } catch {
            return 'Invalid Date';
        }
    };

    const formatMoney = (amount?: number | string | null) => {
        if (!amount) return '$0.00';
        const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
        return Number.isNaN(numAmount) ? '$0.00' : `$${numAmount.toFixed(2)}`;
    };

    const calculateDateOut = (dateIn: string) => {
        try {
            const date = new Date(dateIn);
            date.setDate(date.getDate() + DEFAULT_PAWN_PERIOD_DAYS);
            return date.toLocaleDateString('en-US', {
                month: '2-digit',
                day: '2-digit',
                year: 'numeric'
            });
        } catch {
            return 'N/A';
        }
    };

    const getStatusVariant = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
        const normalizedStatus = (status || '').toLowerCase().replace('_', ' ');
        switch (normalizedStatus) {
            case 'p':
            case 'active':
                return 'default';
            case 'redeemed':
            case 'paid':
                return 'secondary';
            case 'forfeited':
            case 'defaulted':
                return 'destructive';
            default:
                return 'outline';
        }
    };

    const handlePaymentMethodDone = (tenders: TenderMethod[]) => {
        const payload = Object.entries(paymentSelections)
            .filter(([_, selection]) => selection && selection.amount > 0)
            .map(([ticketId, selection]) => {
                const ticket = filteredTickets.find(t => t.id === ticketId);
                return {
                    pawnTicketId: ticketId,
                    controlNumber: ticket?.controlNumber || '',
                    amountRemaining: selection!.amount,
                    tenders
                };
            });
        console.log("Payload:", payload);
        setShowPaymentModal(false);
    };

    if (loading) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Loading pawn tickets...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col gap-4">
            <Card>
                <CardHeader className="py-3">
                    <CardTitle className="text-sm font-semibold">Find Pawn By:</CardTitle>
                </CardHeader>
                <CardContent className="py-3 pt-0">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <Label htmlFor="ticket-search" className="whitespace-nowrap">Ticket #:</Label>
                                <Input
                                    id="ticket-search"
                                    type="text"
                                    value={filterText}
                                    onChange={(e) => setFilterText(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Enter ticket number..."
                                    className="w-48"
                                />
                            </div>
                            <Button variant="secondary" size="sm" onClick={handleSearch}>
                                <Search className="h-4 w-4 mr-1" />
                                Search
                            </Button>
                            <Button variant="outline" size="sm" onClick={handleClear}>
                                <X className="h-4 w-4 mr-1" />
                                Clear
                            </Button>
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2 bg-muted rounded-md">
                            <Label className="font-semibold">Total Payment:</Label>
                            <span className="text-lg font-bold">{formatMoney(totalPayment)}</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {error && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            <Card className="flex-1 flex flex-col min-h-0">
                <ScrollArea className="flex-1">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Ticket #</TableHead>
                                <TableHead>Date In</TableHead>
                                <TableHead>Date Out</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-center">Current Charges</TableHead>
                                <TableHead className="text-center">Redemption</TableHead>
                                <TableHead className="text-center">Other Payments</TableHead>
                                <TableHead className="text-center">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredTickets.map((ticket) => (
                                <TableRow
                                    key={ticket.id}
                                    onClick={() => selectTicket(ticket.id)}
                                    className={`cursor-pointer hover:bg-muted/50 ${selectedTicket?.id === ticket.id ? 'bg-muted' : ''}`}
                                >
                                    <TableCell className="font-medium">
                                        {ticket.controlNumber}
                                    </TableCell>
                                    <TableCell>
                                        {formatDate(ticket.createdDate)}
                                    </TableCell>
                                    <TableCell>
                                        {calculateDateOut(ticket.createdDate)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {formatMoney(ticket.amountFinanced ?? ticket.purchaseTradeValue ?? 0)}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={getStatusVariant(ticket.pawnStatus || (ticket as any).status)}>
                                            {((ticket.pawnStatus || (ticket as any).status || 'UNKNOWN') === 'P' ? 'PAWN' : (ticket.pawnStatus || (ticket as any).status || 'UNKNOWN')).replace('_', ' ').toUpperCase()}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center justify-center gap-2">
                                            <Checkbox
                                                checked={paymentSelections[ticket.id]?.type === 'current'}
                                                onCheckedChange={() => handlePaymentTypeChange(ticket.id, 'current')}
                                            />
                                            <span className="text-sm">{formatMoney(calculateCurrentCharges(ticket))}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center justify-center gap-2">
                                            <Checkbox
                                                checked={paymentSelections[ticket.id]?.type === 'redemption'}
                                                onCheckedChange={() => handlePaymentTypeChange(ticket.id, 'redemption')}
                                            />
                                            <span className="text-sm">{formatMoney(calculateRedemption(ticket))}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center justify-center gap-2">
                                            <Checkbox
                                                checked={paymentSelections[ticket.id]?.type === 'other'}
                                                onCheckedChange={() => handlePaymentTypeChange(ticket.id, 'other')}
                                            />
                                            <span
                                                className={`text-sm ${otherAmounts[ticket.id] ? 'text-blue-600 font-bold cursor-pointer' : ''}`}
                                                onClick={() => otherAmounts[ticket.id] ? handlePaymentTypeChange(ticket.id, 'other') : null}
                                            >
                                                {formatMoney(otherAmounts[ticket.id] || 0)}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center justify-center gap-3">
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onViewPawn(ticket);
                                                }}
                                                className="cursor-pointer hover:opacity-70"
                                                title="View pawn ticket"
                                            >
                                                <img src={visibilityIcon} alt="View" className="w-6 h-6" style={{ filter: 'brightness(0) saturate(100%)' }} />
                                            </button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {filteredTickets.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                                        No pawn tickets found
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </ScrollArea>

                <CardContent className="py-4 border-t">
                    <div className="flex items-center justify-between">
                        <Button variant="outline" onClick={onBack}>
                            Back
                        </Button>
                        <div className="flex items-center gap-3">
                            <Button variant="outline" onClick={handleClearSelections}>
                                Clear All
                            </Button>
                            <Button variant="secondary" onClick={handlePayAllCurrentCharges}>
                                Pay All Current Charges
                            </Button>
                            <Button variant="secondary" onClick={handleRedeemAll}>
                                Redeem All
                            </Button>
                            <Separator orientation="vertical" className="h-8" />
                            <Button variant="default" onClick={handleSave} disabled={totalPayment === 0}>
                                Save
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="py-3">
                    <CardTitle className="text-sm font-semibold">Item Description</CardTitle>
                </CardHeader>
                <CardContent className="py-3 pt-0">
                    {selectedTicket && selectedTicket.items && selectedTicket.items.length > 0 ? (
                        <div className="space-y-1 text-sm">
                            {selectedTicket.items.map((item) => (
                                <div key={item.id}>
                                    <span>{item.itemDescription || 'No description'} - {formatMoney(item.priceAmount)}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground italic">
                            {selectedTicket ? 'No items found for this ticket.' : 'Select a pawn ticket above to view item details.'}
                        </p>
                    )}
                </CardContent>
            </Card>

            <OtherPaymentModal
                open={modalOpen}
                ticket={selectedTicketForModal ? {
                    id: selectedTicketForModal.id,
                    controlNumber: selectedTicketForModal.controlNumber,
                    pawnAmount: selectedTicketForModal.amountFinanced || 0,
                    periodicRate: selectedTicketForModal.periodicRate || 0,
                    periodsBehind: selectedTicketForModal.periodsBehind || 0
                } : null}
                onCancel={() => {
                    setModalOpen(false);
                    setSelectedTicketForModal(null);
                }}
                onDone={handleOtherPaymentDone}
            />
            {showPaymentModal && (
                <PaymentMethodModal
                    open={true}
                    totalAmount={totalPayment}
                    allowedTenderTypes={[1, 3]} // CASH and DEBIT
                    onCancel={() => setShowPaymentModal(false)}
                    onDone={handlePaymentMethodDone}
                />
            )}
        </div>
    );
}
