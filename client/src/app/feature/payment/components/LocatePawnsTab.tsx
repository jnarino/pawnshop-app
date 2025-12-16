import { useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
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
import moneyBagIcon from '@/assets/icons/money_bag.svg';

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
    } = useCustomerPawnTickets(customerId);

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

    const formatMoney = (amount?: number | string) => {
        if (!amount) return '$0.00';
        const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
        return Number.isNaN(numAmount) ? '$0.00' : `$${numAmount.toFixed(2)}`;
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
                    <CardTitle className="text-sm font-semibold">Locate Transactions By:</CardTitle>
                </CardHeader>
                <CardContent className="py-3 pt-0">
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
                                <TableHead>Customer #</TableHead>
                                <TableHead>Ticket #</TableHead>
                                <TableHead>Date In</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-center">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredTickets.map((ticket) => (
                                <TableRow key={ticket.id}>
                                    <TableCell>{customerId?.slice(-5) || '—'}</TableCell>
                                    <TableCell className="font-medium">
                                        {ticket.controlNumber || 'N/A'}
                                    </TableCell>
                                    <TableCell>
                                        {formatDate(ticket.createdDate)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {formatMoney(ticket.amountFinanced ?? ticket.purchaseTradeValue ?? 0)}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={getStatusVariant(ticket.pawnStatus)}>
                                            {(ticket.pawnStatus || 'UNKNOWN').replace('_', ' ').toUpperCase()}
                                        </Badge>
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
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onPawnSelected(ticket);
                                                }}
                                                disabled={ticket.pawnStatus !== 'active'}
                                                className="cursor-pointer hover:opacity-70 disabled:opacity-30 disabled:cursor-not-allowed"
                                                title="Make payment"
                                            >
                                                <img src={moneyBagIcon} alt="Payment" className="w-6 h-6" style={{ filter: 'brightness(0) saturate(100%)' }} />
                                            </button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {filteredTickets.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                        No pawn tickets found
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </ScrollArea>
            </Card>

            <Card>
                <CardHeader className="py-3">
                    <CardTitle className="text-sm font-semibold">Item Description</CardTitle>
                </CardHeader>
                <CardContent className="py-3 pt-0">
                    <ScrollArea className="h-20 rounded-md border p-3">
                        {selectedTicket && selectedTicket.items && selectedTicket.items.length > 0 ? (
                            <div className="space-y-1 text-sm">
                                {selectedTicket.items.map((item) => (
                                    <div key={item.id} className="flex justify-between">
                                        <span>{item.itemDescription || 'No description'}</span>
                                        <span className="text-muted-foreground">
                                            {formatMoney(item.priceAmount)} • {(item.status || 'IN PAWN').toUpperCase()}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground italic">
                                {selectedTicket ? 'No items found for this ticket.' : 'Select a pawn ticket above to view item details.'}
                            </p>
                        )}
                    </ScrollArea>
                </CardContent>
            </Card>
        </div>
    );
}
