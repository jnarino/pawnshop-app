import { useState, useMemo } from 'react';
import { usePawnWorkflow } from '../../contexts/PawnWorkflowContext';
import { useCustomerHistory } from '../../hooks/useCustomerHistory';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2 } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { PawnItemsTable } from '../../components/PawnItemsTable';
import { InventoryItemDraft } from '@/app/feature/_shared/inventory-item';

export default function HistoryTab() {
  const { customer } = usePawnWorkflow();
  const { history, loading, error } = useCustomerHistory(customer?.id);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

  const selectedTicket = useMemo(() =>
    history.find(ticket => ticket.id === selectedTicketId),
    [history, selectedTicketId]);

  const selectedTicketItems: InventoryItemDraft[] = useMemo(() => {
    if (!selectedTicket || !selectedTicket.items) return [];

    return selectedTicket.items.map(item => {
      const attributes = item.attributes || {};
      return {
        id: item.id || crypto.randomUUID(),
        type: 'Item',
        categoryName: item.inventoryCategory?.name || 'Unknown',
        description: item.itemDescription || '',
        brandName: item.brand?.name || (typeof item.brand === 'string' ? item.brand : '') || '',
        model: item.model || '',
        serial: item.serialNumber || '',
        quantity: String(item.quantity || 1),
        amount: String(item.priceAmount || 0),
        status: item.status || 'P',
        ownerNumber: item.inventoryNumber || '',
        metal: (attributes.metal as any)?.name,
        karat: (attributes.karat as any)?.name,
        weight: String(attributes.weight || ''),
        stones: (item.extra?.stones as any[]) || [],
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
    <div className="space-y-6">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ticket #</TableHead>
              <TableHead>Date IN</TableHead>
              <TableHead>Date OUT</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-right">Amount Paid</TableHead>
              <TableHead>Store</TableHead>
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
                <TableCell>{formatDate(ticket.transactionDate)}</TableCell>
                <TableCell>{formatDate(ticket.defaultDate)}</TableCell>
                <TableCell>
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium 
                    ${ticket.pawnStatus === 'Active' ? 'bg-green-100 text-green-800' :
                      ticket.pawnStatus === 'Redeemed' ? 'bg-blue-100 text-blue-800' :
                        ticket.pawnStatus === 'Forfeited' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'}`}>
                    {ticket.pawnStatus}
                  </span>
                </TableCell>
                <TableCell className="text-right">${Number(ticket.amountFinanced).toFixed(2)}</TableCell>
                <TableCell className="text-right">
                  {ticket.redemptionAmount ? `$${Number(ticket.redemptionAmount).toFixed(2)}` : '-'}
                </TableCell>
                <TableCell>Main Store</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {selectedTicket && (
        <div className="space-y-3 animate-in fade-in slide-in-from-top-4 duration-300">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            Items for Ticket #{selectedTicket.controlNumber}
          </h3>
          <PawnItemsTable
            items={selectedTicketItems}
            isViewMode={true}
            selectable={false}
          />
        </div>
      )}
    </div>
  );
}
