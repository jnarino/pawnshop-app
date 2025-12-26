import { useCallback, useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Pencil } from 'lucide-react';
import { pawnTicketApi, type CustomerActivePawnTicket, type TicketByControlNumber } from '@/app/core/api/pawnTicketApi';
import { http } from '@/app/core/api/http';
import { apiToRecordLoose, type CustomerRecord } from '@/app/feature/_shared/customer/mappers';
import type { PawnTicketData } from '@/app/feature/_shared/types/pawnTicket';
import { PawnTicketForm } from './PawnTicketForm';
import ConfirmModal from '@/app/shared/components/ConfirmModal';
import { useNavigate } from 'react-router-dom';

type TicketResult = (CustomerActivePawnTicket | TicketByControlNumber) & { items?: CustomerActivePawnTicket['items'] };
type ScopeFilter = 'all' | 'active';
type TabKey = 'customer' | 'ticket';

function transformPawnTicketToFormData(pawnTicket: PawnTicketData) {
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).toISOString().split('T')[0];
  };

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
    brandId: typeof item.brand === 'object' ? item.brand?.id : '',
    brandName: getBrandName(item.brand),
    model: item.model || '',
    serial: item.serialNumber || '',
    color: item.colorId || '',
    condition: item.itemCondition || '',
    quantity: String(item.quantity || 1),
    amount: String(item.priceAmount || 0),
    resale: String(item.resale || 0),
    replace: String(item.itemReplace || 0),
    ownerNumber: item.inventoryNumber || '',
    description: item.itemDescription || '',
    metal: (typeof item.attributes?.metal === 'string' ? item.attributes.metal : '') || '',
    karat: (typeof item.attributes?.karat === 'string' ? item.attributes.karat : '') || '',
    weight: (typeof item.extra?.weight === 'string' || typeof item.extra?.weight === 'number' ? String(item.extra.weight) : '') || '',
    weightUnit: 'Grams',
    gender: (typeof item.extra?.gender === 'string' ? item.extra.gender : '') || '',
    style: (typeof item.attributes?.style === 'string' ? item.attributes.style : '') || '',
    sizeLength: (typeof item.extra?.size === 'string' ? item.extra.size : '') || ''
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
  const [activeTab, setActiveTab] = useState<TabKey>('customer');
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
  }, [loading, detailLoading]);

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

  const searchByTicket = useCallback(async () => {
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
      const detail = await ensureDetail(ticket);
      setSelectedTicket(detail);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Search failed';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [ticketNumber, ensureDetail]);

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

  const navigate = useNavigate();


  const [cancelModalOpen, setCancelModalOpen] = useState(false);

  const confirmCancelTransaction = useCallback(() => {
    setCancelModalOpen(false);
    navigate('/', { replace: true });
  }, [navigate]);

  const modalTitle = selectedTicket ? `Pawn #${selectedTicket.controlNumber}` : 'Maintain Pawn Tickets';

  return (
    <>
      <h1 className="text-2xl font-extrabold mb-2.5">{modalTitle}</h1>
      {!selectedTicket && (
        <div className="space-y-4">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabKey)}>
            <div className="flex items-center gap-4 flex-shrink-0">
              <TabsList className="grid grid-cols-2 w-full">
                <TabsTrigger value="customer">By Customer</TabsTrigger>
                <TabsTrigger value="ticket">By Ticket ID</TabsTrigger>
              </TabsList>
              <Button variant="destructive" onClick={() => setCancelModalOpen(true)}>
                Cancel Transaction
              </Button>
            </div>
            <TabsContent value="customer" className="space-y-4">
              <div className="grid grid-cols-12 gap-3">
                <div className="col-span-4 space-y-2">
                  <Label htmlFor="first-name">First Name</Label>
                  <Input
                    id="first-name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="First name"
                    disabled={loading}
                    className="text-sm"
                  />
                </div>
                <div className="col-span-4 space-y-2">
                  <Label htmlFor="last-name">Last Name</Label>
                  <Input
                    id="last-name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Last name"
                    disabled={loading}
                    className="text-sm"
                  />
                </div>
                <div className="col-span-4 space-y-2">
                  <Label htmlFor="dob">Date of Birth</Label>
                  <Input
                    id="dob"
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    disabled={loading}
                    className="text-sm"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <Label>Status</Label>
                  <RadioGroup
                    value={scope}
                    onValueChange={(value) => {
                      const nextScope = value as ScopeFilter;
                      setScope(nextScope);
                      if (selectedCustomer) {
                        fetchTicketsForCustomer(selectedCustomer, nextScope);
                      }
                    }}
                    className="flex gap-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="all" id="scope-all" />
                      <Label htmlFor="scope-all" className="cursor-pointer">All</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="active" id="scope-active" />
                      <Label htmlFor="scope-active" className="cursor-pointer">Active</Label>
                    </div>
                  </RadioGroup>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleClose} disabled={loading}>Close</Button>
                  <Button onClick={searchCustomers} disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Searching...
                      </>
                    ) : 'Search Customers'}
                  </Button>
                </div>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="border rounded-lg">
                <Table stickyHeader>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-40">Customer</TableHead>
                      <TableHead className="w-32">DOB</TableHead>
                      <TableHead className="w-32">ID Number</TableHead>
                      <TableHead className="w-16 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customerResults.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell className="font-semibold">{c.firstName} {c.lastName}</TableCell>
                        <TableCell>{c.dateOfBirth || '—'}</TableCell>
                        <TableCell>{c.idNumber || '—'}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => loadTicketsForCustomer(c)}
                            disabled={loading}
                          >
                            Select
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {customerResults.length === 0 && !loading && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground py-6">
                          No customers yet. Search by name or DOB.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {selectedCustomer && (
                <div className="border rounded-lg">
                  <div className="p-3 flex items-center justify-between text-sm text-muted-foreground">
                    <span>Tickets for {selectedCustomer.firstName} {selectedCustomer.lastName}</span>
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
                            <TableCell>{row.transactionDate ? new Date(row.transactionDate).toLocaleDateString() : '—'}</TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleOpenTicket(row)}
                                disabled={detailLoading}
                                aria-label="Edit pawn"
                              >
                                {detailLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Pencil className="h-4 w-4" />}
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
            </TabsContent>

            <TabsContent value="ticket" className="space-y-4">
              <div className="grid grid-cols-12 gap-3 items-end">
                <div className="col-span-6 space-y-2">
                  <Label htmlFor="ticket-number">Ticket #</Label>
                  <Input
                    id="ticket-number"
                    value={ticketNumber}
                    onChange={(e) => setTicketNumber(e.target.value)}
                    placeholder="Enter ticket number"
                    disabled={loading}
                    className="text-sm"
                  />
                </div>
                <div className="col-span-6 flex justify-end gap-2">
                  <Button variant="outline" onClick={handleClose} disabled={loading}>Close</Button>
                  <Button onClick={searchByTicket} disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Searching...
                      </>
                    ) : 'Find Ticket'}
                  </Button>
                </div>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </TabsContent>
          </Tabs>
        </div>
      )}

      {selectedTicket && (
        <div className="space-y-4">
          <PawnTicketForm
            mode="VIEW"
            initialData={transformPawnTicketToFormData(selectedTicket)}
            controlNumber={selectedTicket.controlNumber}
            pawnTicket={selectedTicket}
          />
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setSelectedTicket(null)}>Back to results</Button>
          </div>
        </div>
      )}

      <ConfirmModal
        open={cancelModalOpen}
        title="Cancel Transaction"
        message="Are you sure you want to cancel the transaction? All unsaved changes will be lost."
        confirmText="Yes, cancel"
        cancelText="No, keep working"
        onConfirm={confirmCancelTransaction}
        onCancel={() => setCancelModalOpen(false)}
      />
    </>
  );
}

export default function PawnsMaintainWorkspace() {
  return (
    <PawnsMaintainWorkspaceContent />
  );
}
