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
        selectedTicketId,
        filterText,
        selectTicket,
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

    const handleSelect = useCallback(() => {
        if (selectedTicket) {
            onPawnSelected(selectedTicket);
        }
    }, [selectedTicket, onPawnSelected]);

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
        return isNaN(numAmount) ? '$0.00' : `$${numAmount.toFixed(2)}`;
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
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredTickets.map((ticket) => (
                                <TableRow
                                    key={ticket.id}
                                    onClick={() => selectTicket(ticket.id)}
                                    className={`cursor-pointer ${
                                        selectedTicketId === ticket.id
                                            ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                                            : 'hover:bg-muted/50'
                                    }`}
                                >
                                    <TableCell>{customerId?.slice(-5) || '—'}</TableCell>
                                    <TableCell className="font-medium">
                                        {ticket.controlNumber || 'N/A'}
                                    </TableCell>
                                    <TableCell>
                                        {formatDate(ticket.transactionDate)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {formatMoney(ticket.amountFinanced || ticket.purchaseTradeValue)}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={getStatusVariant(ticket.pawnStatus)}>
                                            {ticket.pawnStatus.replace('_', ' ').toUpperCase()}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {filteredTickets.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
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
                                {selectedTicket.items.map((item, idx) => (
                                    <div key={idx} className="flex justify-between">
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

            <div className="flex justify-end">
                <Button
                    onClick={handleSelect}
                    disabled={!selectedTicket || selectedTicket.pawnStatus !== 'active'}
                >
                    Select
                </Button>
            </div>
        </div>
    );
}
