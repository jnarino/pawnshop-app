import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import editIcon from '@/assets/icons/edit.svg';
import { useState } from 'react';
import { TicketByControlNumber } from '@/app/core/api/pawnTicketApi';

interface PawnTableList {
    items: TicketByControlNumber[]
}

export const PawnTableList = ({ items }: PawnTableList) => {
    const [editingRowId, setEditingRowId] = useState<string | null>(null);

    return (
        <Table stickyHeader>
            <TableHeader>
                <TableRow>
                    <TableHead sticky className="bg-white z-20">Customer #</TableHead>
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
                            {item.customerId}
                        </TableCell>
                        <TableCell>{item.controlNumber}</TableCell>
                        <TableCell>{item.maturityDate}</TableCell>
                        <TableCell>${Number(item.amountFinanced).toFixed(2)}</TableCell>
                        <TableCell className="font-medium">{item.pawnStatus}</TableCell>
                        <TableCell className="text-center">
                            <div className="flex gap-2 justify-center items-center">
                                <Button className='!p-0'
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => {
                                        setEditingRowId(item.id || null);
                                    }}
                                    disabled={false || !!editingRowId}
                                >
                                    <img src={editIcon} alt="Edit" className="w-4 h-4" />
                                </Button>
                            </div>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    )
}