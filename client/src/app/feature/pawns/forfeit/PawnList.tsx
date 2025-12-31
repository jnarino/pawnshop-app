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
import ConfirmModal from '@/app/shared/components/ConfirmModal';
import { TicketByControlNumber } from '@/app/core/api/pawnTicketApi';

export const PawnList = () => {
    const { searchResults: items, selectPawn, isPullInProgress } = useForfeitStore();
    const [temporalEditingRowId, setTemporalEditingRowId] = useState<string | null>(null);

    const [editingRowId, setEditingRowId] = useState<string | null>(null);
    const [cancelModalOpen, setCancelModalOpen] = useState(false)

    const confirmChangeOfPawnTicket = () => {
        setCancelModalOpen(false);
        const selectedPawn = items.find(item => item.id === temporalEditingRowId);
        if (selectedPawn) {
            setEditingRowId(temporalEditingRowId);
            selectPawn(selectedPawn);
        }
    }

    const selectPawnAndShowConfirmChangeOfPawnTicket = (item: TicketByControlNumber) => {
        setTemporalEditingRowId(item.id || null);
        if (isPullInProgress) {
            setCancelModalOpen(true);
        } else {
            setEditingRowId(item.id || null);
            selectPawn(item);
        }
    }

    return (
        <><Table stickyHeader>
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
                        <TableCell>{item.defaultDate}</TableCell>
                        <TableCell>${Number(item.amountFinanced).toFixed(2)}</TableCell>
                        <TableCell className="font-medium">{item.pawnStatus === "B" ? "PURCHASED" : item.pawnStatus === "P" ? "PAWN" : "-"}</TableCell>
                        <TableCell className="text-center">
                            <Tooltip content="View pawn">
                                <Button className='!p-0'
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => {
                                        selectPawnAndShowConfirmChangeOfPawnTicket(item);
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
            <ConfirmModal
                open={cancelModalOpen}
                title="Cancel Pull"
                message="Are you sure you want to select another Pawn Ticket? All unsaved changes will be lost."
                confirmText="Yes, select"
                cancelText="No, keep working"
                onConfirm={confirmChangeOfPawnTicket}
                onCancel={() => setCancelModalOpen(false)}
            />
        </>

    )
}