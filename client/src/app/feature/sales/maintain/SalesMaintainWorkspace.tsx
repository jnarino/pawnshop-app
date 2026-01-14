import { useState } from 'react';

import type { CustomerData, PawnTicketData } from '@/app/feature/_shared/types/pawnTicket';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MaintainSearch, ScopeFilter } from '@/app/shared/components/MaintainSearch';
import { apiToRecordLoose, CustomerRecord } from '../../_shared/customer';
import { salesApi } from '@/app/core/api/salesApi';
import { Button } from '@/components/ui/button';
import { Loader2, Eye } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { Tooltip } from '@/components/ui/tooltip';
import { SaleForm } from '../../_shared/sale/components/SaleForm';
import { http } from '@/app/core/api/http';

function SalesMaintainWorkspaceContent() {
  const [selectedTicket, setSelectedTicket] = useState<null>(null);
  const [loading, setLoading] = useState(false);
  const [scope, setScope] = useState<ScopeFilter>('active');
  const [sales, setSales] = useState<any[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [currentCustomer, setCurrentCustomer] = useState<CustomerData | null>(null);

  const [selectedCustomer, setSelectedCustomer] = useState<CustomerRecord | null>(null);
  const modalTitle = selectedTicket ? `Sale` : 'Maintain sales';
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
    setSelectedCustomer(null);
    getSalesByControlNumber(ticketNumber);
  }

  const handleSearchByDateRange = (startDate: string, endDate: string) => {
    setSelectedCustomer(null);
    getSalesByDateRange(startDate, endDate);
  }

  const getCustomerInformationById = async (customerId: string) => {
    try {
      const customerDto = await http(`/api/customer/${customerId}`);
      if (customerDto) {
        const customerRecord = apiToRecordLoose(customerDto);
        setCurrentCustomer({
          id: customerRecord.id || '',
          firstName: customerRecord.firstName,
          middleName: customerRecord.middleName,
          lastName: customerRecord.lastName,
          secondLastName: (customerRecord as any).secondLastName,
          idType: customerRecord.idType,
          idNumber: customerRecord.idNumber,
          phoneNumber: customerRecord.phoneNumber,
          streetAddress: customerRecord.streetAddress,
          city: customerRecord.city,
          zipCode: customerRecord.zipCode,
          stateUs: customerRecord.stateUs,
          idState: (customerRecord as any).idState || customerRecord.idState,
          dateOfBirth: customerRecord.dateOfBirth,
          sex: customerRecord.sex,
          race: customerRecord.race,
          height: customerRecord.height,
          weight: customerRecord.weight,
          eyeColor: customerRecord.eyeColor,
          hairColor: customerRecord.hairColor,
          employerName: customerRecord.employerName
        });
      }
    } catch (err) {
      console.warn('Failed to fetch customer for ticket reprint:', err);
    }
  }

  const handleOpenTicket = (row: any): void => {
    setSelectedTicket(row);
    getCustomerInformationById(row.customerId);
  };

  console.log({ sales, selectedTicket });
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
                {!selectedCustomer && <TableHead className="w-20">Customer #</TableHead>}
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
                return (
                  <TableRow key={`${row.controlNumber}-${row.id}`}>
                    <TableCell className="font-semibold">{row.controlNumber}</TableCell>
                    {!selectedCustomer && <TableCell className="uppercase">{row.customerId}</TableCell>}
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


      {selectedTicket && (
        <div className="space-y-4">
          <SaleForm
            mode="VIEW"
            initialData={selectedTicket}
            externalDraft={selectedTicket}
            controlNumber={selectedTicket.controlNumber}
            pawnTicket={selectedTicket}
            customer={currentCustomer || undefined}
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setSelectedTicket(null)}>Back to results</Button>
            <Button onClick={() => { /* TODO: Implement update pawn endpoint */ }}>Void or return sale</Button>
          </div>
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
