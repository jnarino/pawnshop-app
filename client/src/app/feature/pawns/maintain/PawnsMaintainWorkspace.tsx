import { useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Eye } from 'lucide-react';
import { pawnTicketApi, type CustomerActivePawnTicket, type TicketByControlNumber } from '@/app/core/api/pawnTicketApi';
import { http } from '@/app/core/api/http';
import { apiToRecordLoose, type CustomerRecord } from '@/app/feature/_shared/customer/mappers';
import type { PawnTicketData, CustomerData } from '@/app/feature/_shared/types/pawnTicket';
import { PawnTicketForm } from './PawnTicketForm';
import { formatDate } from '@/lib/utils';
import { extractId, transformStones } from '@/app/shared/components/ElectronMenuBridge';
import { MaintainSearch, ScopeFilter } from '@/app/shared/components/MaintainSearch';

type TicketResult = (CustomerActivePawnTicket | TicketByControlNumber) & { items?: CustomerActivePawnTicket['items'] };

function transformPawnTicketToFormData(pawnTicket: PawnTicketData) {

  const getBrandName = (brand: string | { id: string; name: string } | undefined): string => {
    if (!brand) return '';
    if (typeof brand === 'object' && brand.name) return brand.name;
    if (typeof brand === 'string') return brand;
    return '';
  };

  const transformedItems = (pawnTicket.items || []).map((item) => ({
    id: item.id,
    type: item.inventoryCategory?.id || item.legacyCategoryDescription || 'Item',
    categoryName: item.inventoryCategory?.name || item.legacyCategoryDescription || '',
    subcategoryId: item.inventorySubcategory?.id || '',
    subcategoryName: item.inventorySubcategory?.name || '',
    brand: item.brand,
    brandName: getBrandName(item.brand),
    model: item.model || '',
    serial: item.serialNumber || '',
    color: item.colorId,
    condition: item.itemCondition || '',
    quantity: String(item.quantity || 1),
    amount: String(item.priceAmount || 0),
    resale: String(item.resale || 0),
    replace: String(item.itemReplace || 0),
    ownerNumber: item.ownerMark || '',
    description: item.itemDescription || '',
    status: item.status || '',
    metal: item.attributes?.metal,
    karat: item.attributes?.karat,
    weight: extractId(item.extra?.weight),
    weightUnit: extractId(item.extra?.weightUnit) || 'Grams',
    gender: item.attributes?.gender,
    style: item.attributes?.style,
    sizeLength: item.attributes?.sizeLength,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    stones: transformStones(item.extra?.stones as any),
  }));

  const transactionType = pawnTicket.transactionType?.toUpperCase();

  return {
    customerId: pawnTicket.customerId,
    type: transactionType === 'PURCHASE' ? 'PURCHASE' as const : 'PAWN' as const,
    periodicRate: String(Math.round((pawnTicket.periodicRate || 0) * 100)),
    transactionDate: formatDate(pawnTicket.transactionDate),
    maturityDate: formatDate(pawnTicket.maturityDate),
    expirationDate: formatDate(pawnTicket.defaultDate),
    items: transformedItems
  };
}

function PawnsMaintainWorkspaceContent() {
  const [scope, setScope] = useState<ScopeFilter>('active');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerRecord | null>(null);

  const [ticketResults, setTicketResults] = useState<TicketResult[]>([]);
  const [currentCustomer, setCurrentCustomer] = useState<CustomerData | null>(null);

  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTicketTable, setShowTicketTable] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<PawnTicketData | null>(null);

  const fetchTicketsForCustomer = useCallback(async (customer: CustomerRecord, currentScope: ScopeFilter) => {
    setLoading(true);
    setError(null);
    try {
      const tickets = currentScope === 'active'
        ? await pawnTicketApi.getActiveByCustomer(customer.id || '')
        : await pawnTicketApi.getByCustomer(customer.id || '');
      setTicketResults(tickets);

      setCurrentCustomer({
        id: customer.id || '',
        firstName: customer.firstName,
        middleName: customer.middleName,
        lastName: customer.lastName,
        secondLastName: (customer as any).secondLastName,
        idType: customer.idType,
        idNumber: customer.idNumber,
        phoneNumber: customer.phoneNumber,
        streetAddress: customer.streetAddress,
        city: customer.city,
        zipCode: customer.zipCode,
        stateUs: customer.stateUs,
        idState: (customer as any).idState,
        dateOfBirth: customer.dateOfBirth,
        sex: customer.sex,
        race: customer.race,
        height: customer.height,
        weight: customer.weight,
        eyeColor: customer.eyeColor,
        hairColor: customer.hairColor,
        employerName: customer.employerName
      });

      if (tickets.length === 0) {
        setError('No tickets found for this customer');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to fetch tickets';
      setError(message);
      setTicketResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadTicketsForCustomer = useCallback(async (customer: CustomerRecord, scope: ScopeFilter) => {
    await fetchTicketsForCustomer(customer, scope);
  }, [fetchTicketsForCustomer]);

  const ensureDetail = useCallback(async (result: TicketResult): Promise<PawnTicketData> => {
    if ((result as CustomerActivePawnTicket).items?.length) {
      return result as PawnTicketData;
    }
    if (result.customerId) {
      const detailed = await pawnTicketApi.searchByControlNumber(result.customerId, result.controlNumber);
      if (detailed.length) return detailed[0] as PawnTicketData;
    }
    throw new Error('Ticket details not available. Try searching with customer ID to load items.');
  }, []);

  const searchByTicket = useCallback(async (ticketNumber: string) => {
    if (!ticketNumber.trim()) {
      setError('Enter a ticket number');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await pawnTicketApi.findByControlNumber(ticketNumber.trim());
      if (data.length === 0) {
        setError('No ticket found with that number');
        return;
      }
      // Ticket found - go directly to edit mode
      const ticket = data[0];
      const detail = await ensureDetail(ticket as any);

      // Fetch full customer data for printing
      if (detail.customerId) {
        try {
          const customerDto = await http(`/api/customer/${detail.customerId}`);
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

      setSelectedTicket(detail);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Search failed';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [ensureDetail]);

  const handleOpenTicket = useCallback(async (result: TicketResult) => {
    setDetailLoading(true);
    setError(null);
    try {
      const detail = await ensureDetail(result);

      // Fetch full customer data if not already set or if id changed
      if (detail.customerId && (!currentCustomer || currentCustomer.id !== detail.customerId)) {
        try {
          const customerDto = await http(`/api/customer/${detail.customerId}`);
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

      setSelectedTicket(detail);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to open ticket';
      setError(message);
    } finally {
      setDetailLoading(false);
    }
  }, [ensureDetail]);

  const modalTitle = selectedTicket ? `Pawn #${selectedTicket.controlNumber}` : 'Maintain Pawn Tickets';

  const handleSelectedCustomer = (customer: CustomerRecord, scope: ScopeFilter) => {
    setTicketResults([]);
    loadTicketsForCustomer(customer, scope);
    setSelectedCustomer(customer);
    setScope(scope);
    setShowTicketTable(true);
  }

  const handleSearchControlNumber = (ticketNumber: string) => {
    setTicketResults([]);
    searchByTicket(ticketNumber);
  }

  return (
    <>
      <h1 className="text-2xl font-extrabold mb-2.5">{modalTitle}</h1>
      {!selectedTicket && (
        <div className="space-y-4">
          <MaintainSearch
            handleSearchControlNumber={handleSearchControlNumber}
            handleSelectedCustomer={handleSelectedCustomer}
            setShowTicketTable={setShowTicketTable}
            showDateRangeTab={false}
          />
        </div>
      )}

      {showTicketTable && !selectedTicket && (
        <div className="border rounded-lg mt-8">
          <div className="p-3 flex items-center justify-between text-sm text-muted-foreground">
            <span>Tickets for {selectedCustomer?.firstName || ''} {selectedCustomer?.lastName || ''}</span>
            <span className="text-xs">Scope: {scope}</span>
          </div>
          <Table stickyHeader>
            <TableHeader>
              <TableRow>
                <TableHead className="w-28">Ticket #</TableHead>
                <TableHead className="w-20">Type</TableHead>
                <TableHead className="w-28">Status</TableHead>
                <TableHead className="w-24">Amount</TableHead>
                <TableHead className="w-32">Transaction</TableHead>
                <TableHead className="w-16 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ticketResults.map((row) => {
                const amount = row.transactionType === 'PURCHASE'
                  ? row.purchaseTradeValue ?? 0
                  : row.amountFinanced ?? 0;
                return (
                  <TableRow key={`${row.controlNumber}-${row.id}`}>
                    <TableCell className="font-semibold">{row.controlNumber}</TableCell>
                    <TableCell className="uppercase">{row.transactionType}</TableCell>
                    <TableCell className="capitalize">{(row as CustomerActivePawnTicket).pawnStatus || '—'}</TableCell>
                    <TableCell>${amount}</TableCell>
                    <TableCell>{row.transactionDate ? formatDate(row.transactionDate) : '—'}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenTicket(row)}
                        disabled={detailLoading}
                        aria-label="Edit pawn"
                      >
                        {detailLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
              {ticketResults.length === 0 && !loading && (
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
          <PawnTicketForm
            mode="MODIFY"
            initialData={transformPawnTicketToFormData(selectedTicket)}
            controlNumber={selectedTicket.controlNumber}
            pawnTicket={selectedTicket}
            customer={currentCustomer || undefined}
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setSelectedTicket(null)}>Back to results</Button>
            <Button onClick={() => { /* TODO: Implement update pawn endpoint */ }}>Update Pawn</Button>
          </div>
        </div>
      )}
    </>
  );
}

export default function PawnsMaintainWorkspace() {
  return (
    <PawnsMaintainWorkspaceContent />
  );
}
