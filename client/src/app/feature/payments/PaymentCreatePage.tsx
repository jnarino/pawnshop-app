import { useState, useCallback, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Customer as CustomerDto } from '@/app/feature/_shared/customer/types';
import { CustomerManager } from '@/app/feature/_shared/customer';
import { FindByInputModal } from '@/app/feature/_shared/inventory-item';
import { useNavigate } from 'react-router-dom';
import LocatePawnsTab from './components/LocatePawnsTab';
import { useFindByTicket } from './hooks/useFindByTicket';
import { useCustomerPawnTickets } from './hooks/useCustomerPawnTickets';
import type { CustomerActivePawnTicket } from '@/app/core/api/pawnTicketApi';
import { ViewPawnTab } from './components/ViewPawnTab';
import { CancelButton } from '@/app/shared/components/CancelButton';

type TabKey = 'customer' | 'viewPawn' | 'locatePawns';

export default function PaymentCreatePage() {
  const [activeTab, setActiveTab] = useState<TabKey>('customer');
  const [customer, setCustomer] = useState<CustomerDto | null>(null);
  const [selectedPawn, setSelectedPawn] = useState<CustomerActivePawnTicket | null>(null);
  const [findByTicketOpen, setFindByTicketOpen] = useState(false);

  const navigate = useNavigate();
  const { loading: findingTicket, error: findTicketError, findByTicket } = useFindByTicket();

  // Lift pawn tickets hook to parent level to prevent re-fetching on tab changes
  const pawnTicketsData = useCustomerPawnTickets(customer?.id || '');

  // Reset pawn tickets data and selected pawn when customer changes
  useEffect(() => {
    if (customer?.id) {
      pawnTicketsData.reload();
    }
    // Clear selected pawn when customer changes
    setSelectedPawn(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customer?.id]);

  const canNavigateToTab = (tab: TabKey) => {
    if (tab === 'customer') return true;
    if (tab === 'locatePawns') return !!customer?.id;
    if (tab === 'viewPawn') return !!selectedPawn;
    return false;
  };

  const handleTabChange = (tab: string) => {
    const tabKey = tab as TabKey;
    if (canNavigateToTab(tabKey)) {
      setActiveTab(tabKey);
    }
  };


  const handlePawnSelected = useCallback((pawn: CustomerActivePawnTicket) => {
    setSelectedPawn(pawn);
  }, []);

  const handleFindByTicket = useCallback(async (ticketNumber: string) => {
    const foundCustomer = await findByTicket(ticketNumber);
    if (foundCustomer) {
      setCustomer(foundCustomer);
      setFindByTicketOpen(false);
      setActiveTab('locatePawns');
    }
  }, [findByTicket]);

  return (
    <>
      <h1 className="text-2xl font-extrabold mb-2.5">Payments</h1>
      <Tabs value={activeTab} onValueChange={handleTabChange} className="h-full flex flex-col">
        <div className="flex items-center gap-4 flex-shrink-0">
          <TabsList className="grid flex-1 grid-cols-3">
            <TabsTrigger value="customer">
              Locate Customer
            </TabsTrigger>
            <TabsTrigger value="locatePawns" disabled={!canNavigateToTab('locatePawns')}>
              Make Payment
            </TabsTrigger>
            <TabsTrigger value="viewPawn" disabled={!canNavigateToTab('viewPawn')}>
              View Pawn
            </TabsTrigger>
          </TabsList>
          <CancelButton />
        </div>

        <TabsContent value="customer" className="flex-1 min-h-0 pt-4">
          <CustomerManager
            customer={customer}
            onCustomerChange={setCustomer}
            onCustomerSelected={() => setActiveTab('locatePawns')}
            onFindByTicket={() => setFindByTicketOpen(true)}
            workflowMode="payment"
            showAlertWhenEmpty={true}
            className="h-full"
          />
        </TabsContent>

        <TabsContent value="locatePawns" className="flex-1 min-h-0 pt-4">
          {customer?.id && (
            <LocatePawnsTab
              pawnTicketsData={pawnTicketsData}
              onBack={() => setActiveTab('customer')}
              onPawnSelected={handlePawnSelected}
              onViewPawn={(pawn) => {
                setSelectedPawn(pawn);
                setActiveTab('viewPawn');
              }}
            />
          )}
        </TabsContent>

        <TabsContent value="viewPawn" className="flex-1 min-h-0 pt-4">
          {selectedPawn && customer && (
            <ViewPawnTab
              pawnTicket={selectedPawn}
              customer={customer}
              onMakePayment={() => { }}
              onBack={() => setActiveTab('locatePawns')}
            />
          )}
        </TabsContent>
      </Tabs>

      <FindByInputModal
        open={findByTicketOpen}
        loading={findingTicket}
        error={findTicketError}
        onClose={() => setFindByTicketOpen(false)}
        onFind={handleFindByTicket}
        title="Find Customer by Ticket"
        description="To find a customer by ticket ID, enter the ticket number or scan the ticket."
        inputLabel="Ticket Number"
        inputPlaceholder="Enter ticket number..."
        infoMessage="You can type the ticket number manually or use a barcode scanner to scan the ticket."
      />
    </>
  );
}
