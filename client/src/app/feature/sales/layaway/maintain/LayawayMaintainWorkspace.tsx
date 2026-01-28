import { useState } from 'react';

import type { CustomerData } from '@/app/feature/_shared/types/pawnTicket';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MaintainSearch, ScopeFilter } from '@/app/shared/components/MaintainSearch';
import { apiToRecordLoose, CustomerRecord } from '@/app/feature/_shared/customer';
import { layawayApi } from '@/app/core/api/layawayApi';
import { Button } from '@/components/ui/button';
import { Loader2, Eye } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Tooltip } from '@/components/ui/tooltip';
import { SaleForm } from '@/app/feature/_shared/sale/components/SaleForm';
import { http } from '@/app/core/api/http';

const statusOptionsMap = {
  'defaulted': 'Defaulted',
  'active': 'Layaway',
  'sold': 'Sold',
  'voided': 'Voided',
}

const today = new Date();
const localToday = new Date(today.getTime() - (today.getTimezoneOffset() * 60000)).toISOString().split('T')[0];

const dates = {
  from: '1990-01-01',
  to: localToday
}

function LayawayMaintainWorkspaceContent() {
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [scope, setScope] = useState<ScopeFilter>('active');
  const [layaways, setLayaways] = useState<any[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [currentCustomer, setCurrentCustomer] = useState<CustomerData | null>(null);

  const [selectedCustomer, setSelectedCustomer] = useState<CustomerRecord | null>(null);
  const modalTitle = selectedTicket ? `Layaway` : 'Maintain layaways';
  const [showTicketTable, setShowTicketTable] = useState(false);

  const handleLayawaysResponse = (layaways: any[]) => {
    setLayaways(layaways);
    setShowTicketTable(true);
  }

  const getLayawayByCustomer = async (customerId: string) => {
    const layaways = await layawayApi.getByCustomer(customerId);
    handleLayawaysResponse(layaways);
  }

  const getLayawayByControlNumber = async (controlNumber: string) => {
    const layaway = await layawayApi.findByControlNumber(controlNumber);
    handleLayawaysResponse(layaway ? [layaway] : []);
  }

  const getLayawayByDateRange = async (startDate: string, endDate: string, status?: string) => {
    const layaways = await layawayApi.getByDateRange(startDate, endDate, status);
    handleLayawaysResponse(layaways);
  }

  const handleSelectedCustomer = (customer: CustomerRecord) => {
    if (customer.id) {

      getLayawayByCustomer(customer.id);
    }
    setSelectedCustomer(customer);
  }

  const handleSearchControlNumber = (ticketNumber: string) => {
    setSelectedCustomer(null);
    getLayawayByControlNumber(ticketNumber);
  }

  const handleSearchByDateRange = (startDate: string, endDate: string, status?: string) => {
    setSelectedCustomer(null);
    getLayawayByDateRange(startDate, endDate, status);
  }

  const getCustomerInformationById = async (customerId: string) => {
    if (!customerId) return;
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
    setSelectedTicket({ ...row, typeName: statusOptionsMap[row.status] });
    getCustomerInformationById(row?.customerId || row?.customer?.id);
  };

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
            initialDates={dates}
            isLayawayMaintain
          />
        </div>
      )}

      {showTicketTable && !selectedTicket && (
        <div className="border rounded-lg mt-8">
          <div className="p-3 flex items-center justify-between text-sm text-muted-foreground">
            <span>Layaways for {selectedCustomer?.firstName || ''} {selectedCustomer?.lastName || ''}</span>
            <span className="text-xs">Status: {statusOptionsMap[status]}</span>
          </div>
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
              {layaways.length === 0 && !loading && (
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
            isLayaway={true}
            initialData={selectedTicket}
            externalDraft={selectedTicket}
            customer={currentCustomer || selectedTicket?.customer}
            disabled={true}
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setSelectedTicket(null)}>Back to results</Button>
          </div>
        </div>
      )}
    </>
  );
}

export default function LayawayMaintainWorkspace() {
  return (
    <LayawayMaintainWorkspaceContent />
  );
}
