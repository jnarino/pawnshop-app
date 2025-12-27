import { useCallback, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { pawnTicketApi, type CustomerActivePawnTicket, type TicketByControlNumber } from '@/app/core/api/pawnTicketApi';
import { http } from '@/app/core/api/http';
import { apiToRecordLoose, type CustomerRecord } from '@/app/feature/_shared/customer/mappers';
import type { PawnTicketData } from '@/app/feature/_shared/types/pawnTicket';
import CustomerInfoTab from '@/app/shared/components/CustomerInfoTab';
import { Customer } from '../types';
import { Field, FieldLabel, FieldSet, FieldLegend } from '@/components/ui/field';
import { DatePicker } from '@/components/ui/date-picker';
import { useWorkspaceTabs } from '@/app/shared/hooks/useWorkspaceTabs';
import { CancelButton } from '@/app/shared/components/CancelButton';

type TicketResult = (CustomerActivePawnTicket | TicketByControlNumber) & { items?: CustomerActivePawnTicket['items'] };
type ScopeFilter = 'all' | 'active';

export type ForfeitTabKey = 'customer' | 'pull-transaction';

function ForfeitWorkspaceContent() {
  const [scope, setScope] = useState<ScopeFilter>('active');

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [customerResults, setCustomerResults] = useState<CustomerRecord[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerRecord | null>(null);

  const [ticketNumber, setTicketNumber] = useState('');
  const [ticketResults, setTicketResults] = useState<TicketResult[]>([]);

  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<PawnTicketData | null>(null);

  const { activeTab, setActiveTab } = useWorkspaceTabs<ForfeitTabKey>({
    initialTab: 'customer',
  });

  const handleClose = useCallback(() => {
    if (loading || detailLoading) return;
    setCustomerResults([]);
    setSelectedCustomer(null);
    setTicketResults([]);
    setSelectedTicket(null);
    setFirstName('');
    setLastName('');
    setDateOfBirth('');
    setTicketNumber('');
    setError(null);
    setActiveTab('customer');
  }, [loading, detailLoading, setActiveTab]);

  const searchCustomers = useCallback(async () => {
    if (!firstName && !lastName && !dateOfBirth) {
      setError('Enter first name, last name, or DOB');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (firstName) params.append('firstName', firstName);
      if (lastName) params.append('lastName', lastName);
      if (dateOfBirth) params.append('dateOfBirth', dateOfBirth);
      params.append('limit', import.meta.env.VITE_CUSTOMER_SEARCH_LIMIT || '100');
      const payload = await http(`/api/customer?${params.toString()}`);
      const results = (Array.isArray(payload) ? payload : []).map(apiToRecordLoose);
      setCustomerResults(results);
      if (results.length === 0) {
        setError('No customers found with those fields');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Search failed';
      setError(message);
      setCustomerResults([]);
    } finally {
      setLoading(false);
    }
  }, [firstName, lastName, dateOfBirth]);

  const fetchTicketsForCustomer = useCallback(async (customer: CustomerRecord, currentScope: ScopeFilter) => {
    setLoading(true);
    setError(null);
    try {
      const tickets = currentScope === 'active'
        ? await pawnTicketApi.getActiveByCustomer(customer.id || '')
        : await pawnTicketApi.getByCustomer(customer.id || '');
      setTicketResults(tickets);
      setSelectedCustomer(customer);
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

  const loadTicketsForCustomer = useCallback(async (customer: CustomerRecord) => {
    await fetchTicketsForCustomer(customer, scope);
  }, [fetchTicketsForCustomer, scope]);

  const searchByTicket = useCallback(async () => {
    if (!ticketNumber.trim()) {
      setError('Enter a ticket number');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await pawnTicketApi.findByControlNumber(ticketNumber.trim());
      setSelectedCustomer(null);
      setTicketResults(data);
      if (data.length === 0) {
        setError('No ticket found with that number');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Search failed';
      setError(message);
      setTicketResults([]);
    } finally {
      setLoading(false);
    }
  }, [ticketNumber]);

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

  const handleOpenTicket = useCallback(async (result: TicketResult) => {
    setDetailLoading(true);
    setError(null);
    try {
      const detail = await ensureDetail(result);
      setSelectedTicket(detail);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to open ticket';
      setError(message);
    } finally {
      setDetailLoading(false);
    }
  }, [ensureDetail]);

  const [customer, setCustomer] = useState<Customer | null>(null);

  return (
    <>
      <h1 className="text-2xl font-extrabold mb-2.5">Forfeit (Pull)</h1>

      <div className="space-y-4">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ForfeitTabKey)}>
          <div className="flex items-center gap-4 flex-shrink-0">
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="customer">Customer Info</TabsTrigger>
              <TabsTrigger value="pull-transaction">Pull Transaction</TabsTrigger>
            </TabsList>
            <CancelButton />
          </div>
          <TabsContent value="customer" keepMounted className="flex-1 min-h-0 pt-4">
            <CustomerInfoTab
              customer={customer}
              onCustomerChange={setCustomer}
              onCustomerSelected={() => setActiveTab('pull-transaction')}
            />
          </TabsContent>
          <TabsContent value="pull-transaction" className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <FieldSet className="card section">
                <FieldLegend className="mb-2 text-sm">Personal Information</FieldLegend>
                <div className="grid grid-cols-2 gap-2">
                  <Field>
                    <FieldLabel>From Date</FieldLabel>
                    <DatePicker
                      value={dateOfBirth || undefined}
                      onChange={(value) => { }}
                    />
                  </Field>
                  <Field>
                    <FieldLabel>To Date</FieldLabel>
                    <DatePicker
                      value={dateOfBirth || undefined}
                      onChange={(value) => { }}
                    />
                  </Field>

                  <Field>
                    <FieldLabel>Ticket #</FieldLabel>
                    <Input value="" onChange={e => { }} disabled={false} placeholder="" />
                  </Field>

                </div>
              </FieldSet>
              <div>

              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

    </>
  );
}

export default function ForfeitWorkspace() {
  return (
    <ForfeitWorkspaceContent />
  );
}
