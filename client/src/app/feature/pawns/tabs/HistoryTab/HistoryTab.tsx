import { useState, useMemo } from 'react';
import { usePawnWorkflow } from '../../contexts/PawnWorkflowContext';
import { useCustomerHistory } from '../../hooks/useCustomerHistory';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2 } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { HistoryItem } from '@/app/core/api/pawnTicketApi';
import { HistoryTable } from '../../components/HistoryTable';

export default function HistoryTab() {
  const { customer } = usePawnWorkflow();
  const { history, loading, error } = useCustomerHistory(customer?.id);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

  const selectedTicket = useMemo(() =>
    history.find(ticket => ticket.id === selectedTicketId),
    [history, selectedTicketId]);

  const selectedTicketItems: HistoryItem[] = useMemo(() => {
    if (!selectedTicket || !selectedTicket.items) return [];

    return selectedTicket.items.map(item => {
      return {
        id: item.id || crypto.randomUUID(),
        description: item.description || '',
        amountEach: item.amountEach || 0,
        quantity: item.quantity || 1,
      };
    });
  }, [selectedTicket]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-10">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-10 text-center text-red-500">
        Failed to load history. Please try again.
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="p-10 text-center text-gray-500">
        No transaction history found for this customer.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Previous Items for {customer?.firstName} {customer?.lastName}</h2>

      </div>
      <Table stickyHeader>
        <TableHeader>
          <TableRow>
            <TableHead sticky className="bg-white z-20">Ticket #</TableHead>
            <TableHead sticky className="bg-white z-20">Date IN</TableHead>
            <TableHead sticky className="bg-white z-20">Date OUT</TableHead>
            <TableHead sticky className="bg-white z-20">Status</TableHead>
            <TableHead sticky className="text-right bg-white z-20">Amount</TableHead>
            <TableHead sticky className="text-right bg-white z-20">Amount Paid</TableHead>
            <TableHead sticky className="bg-white z-20">Store</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {history.map((ticket) => (
            <TableRow
              key={ticket.id}
              className={`cursor-pointer transition-colors hover:bg-muted/50 ${selectedTicketId === ticket.id ? 'bg-muted' : ''}`}
              onClick={() => setSelectedTicketId(ticket.id === selectedTicketId ? null : ticket.id)}
            >
              <TableCell className="font-medium">{ticket.controlNumber}</TableCell>
              <TableCell>{formatDate(ticket.dateIn)}</TableCell>
              <TableCell>{formatDate(ticket.dateOut)}</TableCell>
              <TableCell>
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium 
                    ${ticket.status === 'Active' ? 'bg-green-100 text-green-800' :
                    ticket.status === 'Redeemed' ? 'bg-blue-100 text-blue-800' :
                      ticket.status === 'Forfeited' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'}`}>
                  {ticket.status}
                </span>
              </TableCell>
              <TableCell className="text-right">${Number(ticket.amount).toFixed(2)}</TableCell>
              <TableCell className="text-right">
                {ticket.amountPaid ? `$${Number(ticket.amountPaid).toFixed(2)}` : '-'}
              </TableCell>
              <TableCell>Main Store</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {selectedTicket && (
        <div className="space-y-3 animate-in fade-in slide-in-from-top-4 duration-300">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            Items for Ticket #{selectedTicket.controlNumber}
          </h3>
          <HistoryTable
            items={selectedTicketItems}
          />
        </div>
      )}
    </div>
  );
}
