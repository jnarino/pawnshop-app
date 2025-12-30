import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';
import { useState } from 'react';
import { Tooltip } from '@/components/ui/tooltip';
import { useForfeitStore } from './stores/forfeitStore';

export const PawnList = () => {
    const { searchResults: items, selectPawn } = useForfeitStore();
    const [editingRowId, setEditingRowId] = useState<string | null>(null);

    return (
        <Table stickyHeader>
            <TableHeader>
                <TableRow>
                    <TableHead sticky className="bg-white z-20">Customer</TableHead>
                    <TableHead sticky className="bg-white z-20">Ticket #</TableHead>
                    <TableHead sticky className="bg-white z-20">Date out</TableHead>
                    <TableHead sticky className="bg-white z-20">Amount</TableHead>
                    <TableHead sticky className="bg-white z-20">Status</TableHead>
                    <TableHead sticky className="text-center bg-white z-20">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {items.map((item) => (
                    <TableRow
                        key={item.id}
                        className={item.id === editingRowId ? "bg-amber-50 border-l-4 border-amber-500" : ""}
                    >
                        <TableCell>
                            {item.customer ? `${item.customer.firstName} ${item.customer.lastName}` : item.customerId}
                        </TableCell>
                        <TableCell>{item.controlNumber}</TableCell>
                        <TableCell>{item.maturityDate}</TableCell>
                        <TableCell>${Number(item.amountFinanced).toFixed(2)}</TableCell>
                        <TableCell className="font-medium">{item.pawnStatus}</TableCell>
                        <TableCell className="text-center">
                            <Tooltip content="View pawn">
                                <Button className='!p-0'
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => {
                                        setEditingRowId(item.id || null);
                                        selectPawn(item);
                                    }}
                                    disabled={item.id === editingRowId}
                                >
                                    <Eye className='w-4 h-4' />
                                </Button>
                            </Tooltip>
                        </TableCell>
                    </TableRow>
                ))}
                {items.length === 0 &&
                    <TableRow id="empty-state-row">
                        <TableCell colSpan={6} className="text-center p-4">
                            <p><strong>No data found</strong></p>
                            <p>Please search by ticket # or select a date range</p>
                        </TableCell>
                    </TableRow>
                }
            </TableBody>
        </Table>
    )
}