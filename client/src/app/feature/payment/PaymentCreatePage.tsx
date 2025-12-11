import { useState, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import type { Customer as CustomerDto } from '@/app/feature/_shared/customer/types';
import { CustomerManager } from '@/app/feature/_shared/customer';
import { FindByTicketModal } from '@/app/feature/_shared/customer/components/FindByTicketModal';
import ConfirmModal from '@/app/shared/components/ConfirmModal';
import { useNavigate } from 'react-router-dom';
import LocatePawnsTab from './components/LocatePawnsTab';
import ViewPawnTab from './components/ViewPawnTab';
import MakePaymentTab from './components/MakePaymentTab';
import { useFindByTicket } from './hooks/useFindByTicket';
import type { CustomerActivePawnTicket } from '@/app/core/api/pawnTicketApi';

type TabKey = 'customer' | 'viewPawn' | 'locatePawns' | 'makePayment';

export default function PaymentCreatePage() {
  const [activeTab, setActiveTab] = useState<TabKey>('customer');
  const [customer, setCustomer] = useState<CustomerDto | null>(null);
  const [selectedPawn, setSelectedPawn] = useState<CustomerActivePawnTicket | null>(null);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [findByTicketOpen, setFindByTicketOpen] = useState(false);

  const navigate = useNavigate();
  const { loading: findingTicket, error: findTicketError, findByTicket } = useFindByTicket();

  const canNavigateToTab = (tab: TabKey) => {
    if (tab === 'customer') return true;
    if (tab === 'locatePawns' || tab === 'viewPawn') return !!customer?.id;
    if (tab === 'makePayment') return !!selectedPawn;
    return false;
  };

  const handleTabChange = (tab: string) => {
    const tabKey = tab as TabKey;
    if (canNavigateToTab(tabKey)) {
      setActiveTab(tabKey);
    }
  };

  const confirmCancel = () => {
    setCancelOpen(false);
    setCustomer(null);
    setSelectedPawn(null);
    setActiveTab('customer');
    navigate('/', { replace: true });
  };

  const handlePawnSelected = useCallback((pawn: CustomerActivePawnTicket) => {
    setSelectedPawn(pawn);
    setActiveTab('makePayment');
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
    <div className="h-full flex flex-col p-6">
      <Tabs value={activeTab} onValueChange={handleTabChange} className="h-full flex flex-col">
        <div className="flex items-center gap-4 flex-shrink-0">
          <TabsList className="grid flex-1 grid-cols-4">
            <TabsTrigger value="customer">
              Locate Customer
            </TabsTrigger>
            <TabsTrigger value="locatePawns" disabled={!canNavigateToTab('locatePawns')}>
              Locate Pawns
            </TabsTrigger>
            <TabsTrigger value="viewPawn" disabled={!canNavigateToTab('viewPawn')}>
              View Pawn
            </TabsTrigger>
            <TabsTrigger value="makePayment" disabled={!canNavigateToTab('makePayment')}>
              Make Payment
            </TabsTrigger>
          </TabsList>
          <Button variant="destructive" onClick={() => setCancelOpen(true)}>
            Cancel
          </Button>
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
              customerId={customer.id}
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
          {selectedPawn && (
            <ViewPawnTab
              pawnTicket={selectedPawn}
              onBack={() => setActiveTab('locatePawns')}
              onMakePayment={() => setActiveTab('makePayment')}
            />
          )}
        </TabsContent>

        <TabsContent value="makePayment" className="flex-1 min-h-0 pt-4">
          {selectedPawn && customer?.id && (
            <MakePaymentTab
              pawnTicket={selectedPawn}
              customerId={customer.id}
              onBack={() => setActiveTab('locatePawns')}
              onPaymentComplete={() => {
                setSelectedPawn(null);
                setActiveTab('locatePawns');
              }}
            />
          )}
        </TabsContent>
      </Tabs>

      <ConfirmModal
        open={cancelOpen}
        title="Cancel Payment"
        message="Are you sure you want to cancel the payment process?"
        confirmText="Yes, cancel"
        cancelText="No, keep working"
        onConfirm={confirmCancel}
        onCancel={() => setCancelOpen(false)}
      />

      <FindByTicketModal
        open={findByTicketOpen}
        loading={findingTicket}
        error={findTicketError}
        onClose={() => setFindByTicketOpen(false)}
        onFind={handleFindByTicket}
      />
    </div>
  );
}
