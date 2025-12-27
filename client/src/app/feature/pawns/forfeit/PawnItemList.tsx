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
import { Tooltip } from '@/components/ui/tooltip';
import { ArrowDownToLine } from 'lucide-react';

interface PawnTableList {
    items: any[]
}

export const PawnItemList = ({ items }: PawnTableList) => {
    const [editingRowId, setEditingRowId] = useState<string | null>(null);

    return (
        <Table stickyHeader>
            <TableHeader>
                <TableRow>
                    <TableHead sticky className="bg-white z-20">Description</TableHead>
                    <TableHead sticky className="bg-white z-20">Quantity</TableHead>
                    <TableHead sticky className="bg-white z-20">Amount each</TableHead>
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
                            {item.description}
                        </TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>${Number(item.amountEach).toFixed(2)}</TableCell>
                        <TableCell className={item.status === "Pending to pull" ? "bg-amber-50 border-l-4 border-amber-500" : item.status === "Pulled" ? "bg-green-50 border-l-4 border-green-500" : ""}>{item.status}</TableCell>
                        <TableCell className="text-center">
                            <Tooltip content="Pull item">
                                <Button className='!p-0'
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => {
                                        setEditingRowId(item.id || null);
                                    }}
                                    disabled={false || !!editingRowId}
                                >
                                    <ArrowDownToLine />
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