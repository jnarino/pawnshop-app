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
import type { CustomerActivePawnTicket } from '@/app/core/api/pawnTicketApi';
import visibilityIcon from '@/assets/icons/visibility.svg';

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

    const [paymentSelections, setPaymentSelections] = useState<Record<string, PaymentSelectionType>>({});

    const handlePaymentTypeChange = useCallback((ticketId: string, type: 'current' | 'redemption' | 'other') => {
        setPaymentSelections(prev => ({
            ...prev,
            [ticketId]: prev[ticketId] === type ? null : type
        }));
    }, []);

    const calculateCurrentCharges = (ticket: CustomerActivePawnTicket) => {
        const amountFinanced = ticket.amountFinanced || 0;
        const periodicRate = ticket.periodicRate || 0;
        return amountFinanced * periodicRate;
    };

    const calculateRedemption = (ticket: CustomerActivePawnTicket) => {
        const amountFinanced = ticket.amountFinanced || 0;
        const currentCharges = calculateCurrentCharges(ticket);
        return amountFinanced + currentCharges;
    };

    const totalPayment = useMemo(() => {
        return filteredTickets.reduce((sum, ticket) => {
            const selectionType = paymentSelections[ticket.id];
            if (selectionType === 'current') {
                return sum + calculateCurrentCharges(ticket);
            } else if (selectionType === 'redemption') {
                return sum + calculateRedemption(ticket);
            }
            return sum;
        }, 0);
    }, [paymentSelections, filteredTickets]);

    const handleSave = useCallback(() => {
        console.log('Save clicked', paymentSelections);
    }, [paymentSelections]);

    const handlePayAllCurrentCharges = useCallback(() => {
        const newSelections: Record<string, PaymentSelectionType> = {};
        filteredTickets.forEach(ticket => {
            newSelections[ticket.id] = 'current';
        });
        setPaymentSelections(newSelections);
    }, [filteredTickets]);

    const handleRedeemAll = useCallback(() => {
        const newSelections: Record<string, PaymentSelectionType> = {};
        filteredTickets.forEach(ticket => {
            newSelections[ticket.id] = 'redemption';
        });
        setPaymentSelections(newSelections);
    }, [filteredTickets]);

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
        const normalizedStatus = status?.toLowerCase().replace('_', ' ');
        switch (normalizedStatus) {
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
                                    <TableCell>
                                        {formatDate(ticket.createdDate)}
                                    </TableCell>
                                    <TableCell>
                                        {calculateDateOut(ticket.createdDate)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {formatMoney(ticket.amountFinanced || ticket.purchaseTradeValue)}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={getStatusVariant(ticket.pawnStatus)}>
                                            {ticket.pawnStatus.replace('_', ' ').toUpperCase()}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center justify-center gap-2">
                                            <Checkbox
                                                checked={paymentSelections[ticket.id] === 'current'}
                                                onCheckedChange={() => handlePaymentTypeChange(ticket.id, 'current')}
                                                disabled={!!paymentSelections[ticket.id] && paymentSelections[ticket.id] !== 'current'}
                                            />
                                            <span className="text-sm">{formatMoney(calculateCurrentCharges(ticket))}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center justify-center gap-2">
                                            <Checkbox
                                                checked={paymentSelections[ticket.id] === 'redemption'}
                                                onCheckedChange={() => handlePaymentTypeChange(ticket.id, 'redemption')}
                                                disabled={!!paymentSelections[ticket.id] && paymentSelections[ticket.id] !== 'redemption'}
                                            />
                                            <span className="text-sm">{formatMoney(calculateRedemption(ticket))}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center justify-center gap-2">
                                            <Checkbox
                                                checked={paymentSelections[ticket.id] === 'other'}
                                                onCheckedChange={() => handlePaymentTypeChange(ticket.id, 'other')}
                                                disabled={!!paymentSelections[ticket.id] && paymentSelections[ticket.id] !== 'other'}
                                            />
                                            <span className="text-sm">$0.00</span>
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
                                    <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                                        No pawn tickets found
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </ScrollArea>

                <CardContent className="py-4 border-t">
                    <div className="flex items-center justify-end gap-3">
                        <Button variant="secondary" onClick={handlePayAllCurrentCharges}>
                            Pay All Current Charges
                        </Button>
                        <Button variant="secondary" onClick={handleRedeemAll}>
                            Redeem All
                        </Button>
                        <Separator orientation="vertical" className="h-8" />
                        <Button variant="default" onClick={handleSave}>
                            Save
                        </Button>
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
        </div>
    );
}
