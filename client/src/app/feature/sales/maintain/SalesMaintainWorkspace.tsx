import { useState } from 'react';

import type { PawnTicketData } from '@/app/feature/_shared/types/pawnTicket';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MaintainSearch, ScopeFilter } from '@/app/shared/components/MaintainSearch';
import { CustomerRecord } from '../../_shared/customer';
import { salesApi } from '@/app/core/api/salesApi';
import { Button } from '@/components/ui/button';
import { Loader2, Eye } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { Tooltip } from '@/components/ui/tooltip';

function SalesMaintainWorkspaceContent() {
  const [selectedTicket, setSelectedTicket] = useState<PawnTicketData | null>(null);
  const [loading, setLoading] = useState(false);
  const [scope, setScope] = useState<ScopeFilter>('active');
  const [sales, setSales] = useState<any[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);

  const [selectedCustomer, setSelectedCustomer] = useState<CustomerRecord | null>(null);
  const modalTitle = selectedTicket ? `Pawn #${selectedTicket.controlNumber}` : 'Maintain sales';
  const [showTicketTable, setShowTicketTable] = useState(false);

  const handleSalesResponse = (sales: any[]) => {
    setSales(sales);
    setShowTicketTable(true);
  }

  const getSalesByCustomer = async (customerId: string) => {
    const sales = await salesApi.getByCustomer(customerId);
    handleSalesResponse(sales);
  }

  const getSalesByControlNumber = async (controlNumber: string) => {
    const sales = await salesApi.findByControlNumber(controlNumber);
    handleSalesResponse(sales);
  }

  const getSalesByDateRange = async (startDate: string, endDate: string) => {
    const sales = await salesApi.getByDateRange(startDate, endDate);
    handleSalesResponse(sales);
  }

  const handleSelectedCustomer = (customer: CustomerRecord) => {
    if (customer.id) {

      getSalesByCustomer(customer.id);
    }
    setSelectedCustomer(customer);
  }

  const handleSearchControlNumber = (ticketNumber: string) => {
    getSalesByControlNumber(ticketNumber);
  }

  const handleSearchByDateRange = (startDate: string, endDate: string) => {
    getSalesByDateRange(startDate, endDate);
  }
  return (
    <>
      <h1 className="text-2xl font-extrabold mb-2.5">{modalTitle}</h1>
      {!selectedTicket && (
        <div className="space-y-4">
          <MaintainSearch
            handleSearchControlNumber={handleSearchControlNumber}
            handleSelectedCustomer={handleSelectedCustomer}
            handleSearchByDateRange={handleSearchByDateRange}
            setShowTicketTable={setShowTicketTable}
          />
        </div>
      )}

      {showTicketTable && !selectedTicket && (
        <div className="border rounded-lg mt-8">
          <div className="p-3 flex items-center justify-between text-sm text-muted-foreground">
            <span>Sales for {selectedCustomer?.firstName || ''} {selectedCustomer?.lastName || ''}</span>
            <span className="text-xs">Scope: {scope}</span>
          </div>
          <Table stickyHeader>
            <TableHeader>
              <TableRow>
                <TableHead className="w-28">Ticket #</TableHead>
                <TableHead className="w-20">Customer #</TableHead>
                <TableHead className="w-28">Date IN</TableHead>
                <TableHead className="w-28">Date Due</TableHead>
                <TableHead className="w-28">Status</TableHead>
                <TableHead className="w-24">Amount</TableHead>
                <TableHead className="w-32">Amount Due</TableHead>
                <TableHead className="w-16 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sales.map((row) => {
                function handleOpenTicket(row: any): void {
                  throw new Error('Function not implemented.');
                }

                return (
                  <TableRow key={`${row.controlNumber}-${row.id}`}>
                    <TableCell className="font-semibold">{row.controlNumber}</TableCell>
                    <TableCell className="uppercase">{row.customerId}</TableCell>
                    <TableCell className="capitalize">{formatDate(row.createdAt) || '—'}</TableCell>
                    <TableCell className="capitalize">{formatDate(row.updatedAt) || '—'}</TableCell>
                    <TableCell className="capitalize">{(row
                    ).status || '—'}</TableCell>
                    <TableCell>${row.amount}</TableCell>
                    <TableCell>${row.amountDue}</TableCell>
                    <TableCell className="text-right">
                      <Tooltip content="View sale">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenTicket(row)}
                          disabled={detailLoading}
                          aria-label="Edit pawn"
                        >
                          {detailLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })}
              {sales.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-6">
                    No tickets yet. Search and select a customer.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </>
  );
}

export default function SalesMaintainWorkspace() {
  return (
    <SalesMaintainWorkspaceContent />
  );
}
