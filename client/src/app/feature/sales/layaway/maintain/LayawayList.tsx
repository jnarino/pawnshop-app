import { Loader2, Eye } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Tooltip } from '@/components/ui/tooltip';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { statusOptionsMap } from './LayawayMaintainWorkspace';

export const LayawayList = ({ layaways, loading, handleOpenTicket }: { layaways: any[]; loading: boolean; handleOpenTicket: (row: any) => void }) => {
    return (
        <Table stickyHeader>
            <TableHeader>
                <TableRow>
                    <TableHead className="w-28">Ticket #</TableHead>
                    <TableHead className="w-56">Customer</TableHead>
                    <TableHead className="w-28">Date IN</TableHead>
                    <TableHead className="w-28">Date Due</TableHead>
                    <TableHead className="w-28">Status</TableHead>
                    <TableHead className="w-24">Amount</TableHead>
                    <TableHead className="w-24">Amount Due</TableHead>
                    <TableHead className="w-16 text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {layaways.map((row) => {
                    const customerName = row.customer?.id
                        ? `${row.customer.lastName || ''}, ${row.customer.firstName || ''}`
                        : row.customerId ? row.customerId : '';
                    return (
                        <TableRow key={`${row.controlNumber}-${row.id}`}>
                            <TableCell className="font-semibold">{row.controlNumber}</TableCell>
                            <TableCell className="uppercase">{customerName}</TableCell>
                            <TableCell className="capitalize">{formatDate(row.createdAt) || '—'}</TableCell>
                            <TableCell className="capitalize">{formatDate(row.updatedAt) || '—'}</TableCell>
                            <TableCell className="capitalize">{row.typeName || statusOptionsMap[row.status] || '—'}</TableCell>
                            <TableCell>{formatCurrency(row.taxSales + row.stateTax)}</TableCell>
                            <TableCell>{formatCurrency((row.taxSales + row.stateTax) - row.totalOfPayments)}</TableCell>
                            <TableCell className="text-right">
                                <Tooltip content="View sale">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleOpenTicket(row)}
                                        aria-label="Edit pawn"
                                    >
                                        <Eye className="h-4 w-4" />
                                    </Button>
                                </Tooltip>
                            </TableCell>
                        </TableRow>
                    );
                })}
                {layaways.length === 0 && !loading && (
                    <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-6">
                            No tickets yet. Search and select a customer.
                        </TableCell>
                    </TableRow>
                )}
            </TableBody>
        </Table>
    );
}