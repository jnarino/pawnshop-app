import { HistoryItem } from '@/app/core/api/pawnTicketApi';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';


export interface HistoryTableProps {
    items: HistoryItem[];
}

export function HistoryTable({
    items,
}: HistoryTableProps) {


    return (
        <Table stickyHeader>
            <TableHeader>
                <TableRow>
                    <TableHead sticky className="w-[300px] bg-white z-20">Item</TableHead>
                    <TableHead sticky className="bg-white z-20">Quantity</TableHead>
                    <TableHead sticky className="bg-white z-20">Amount</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {items.map((item) => (
                    <TableRow key={item.id}>
                        <TableCell>
                            <div>
                                <div className="font-semibold">{item.description}</div>
                            </div>
                        </TableCell>
                        <TableCell>{item.quantity || 1}</TableCell>
                        <TableCell>${Number(item.amountEach || 0).toFixed(2)}</TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}
