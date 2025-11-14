import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PawnWorkflowProvider, usePawnWorkflow, type TabKey } from './contexts/PawnWorkflowContext';
import CustomerInfoTab from './tabs/CustomerInfoTab';
import NewPawnTab from './tabs/NewPawnTab';
import CustomerPerformanceTab from './tabs/CustomerPerformanceTab';
import type { Customer } from '@/app/feature/customer';
import './pawns.css';

function PawnsWorkspaceContent() {
  const { activeTab, setActiveTab, openCancelModal } = usePawnWorkflow();
  const [customer, setCustomer] = useState<Customer | null>(null);

  const customerId = customer?.id || null;

  const canNavigateToTab = (tab: TabKey) => {
    // Customer tab is always accessible
    if (tab === 'customer') return true;
    // Other tabs require a customer to be selected
    return !!customerId;
  };

  const handleTabChange = (tab: string) => {
    const tabKey = tab as TabKey;
    if (canNavigateToTab(tabKey)) {
      setActiveTab(tabKey);
    }
  };

  return (
    <div className="pawn-flow">
      <Tabs value={activeTab} onValueChange={handleTabChange} className="h-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="customer">
            Customer Info
          </TabsTrigger>
          <TabsTrigger value="customerPerformance" disabled={!canNavigateToTab('customerPerformance')}>
            Customer Performance
          </TabsTrigger>
          <TabsTrigger value="newPawn" disabled={!canNavigateToTab('newPawn')}>
            New Pawn
          </TabsTrigger>
          <TabsTrigger value="previousItems" disabled={!canNavigateToTab('previousItems')}>
            Previous Items
          </TabsTrigger>
          <TabsTrigger value="history" disabled={!canNavigateToTab('history')}>
            History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="customer" className="h-[calc(100%-4rem)]">
          <CustomerInfoTab 
            customer={customer}
            onCustomerChange={setCustomer}
            onCustomerSelected={(id: string) => setActiveTab('newPawn')}
            onCancelTransaction={openCancelModal}
          />
        </TabsContent>

        <TabsContent value="newPawn" className="h-[calc(100%-4rem)]">
          <NewPawnTab 
            customerId={customerId}
            customer={customer}
          />
        </TabsContent>

        <TabsContent value="previousItems" className="h-[calc(100%-4rem)]">
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Previous Items - Coming Soon
          </div>
        </TabsContent>

        <TabsContent value="customerPerformance" className="h-[calc(100%-4rem)]">
          <CustomerPerformanceTab customer={customer} />
        </TabsContent>

        <TabsContent value="history" className="h-[calc(100%-4rem)]">
          <div className="flex items-center justify-center h-full text-muted-foreground">
            History - Coming Soon
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function PawnsWorkspace() {
  return (
    <PawnWorkflowProvider>
      <PawnsWorkspaceContent />
    </PawnWorkflowProvider>
  );
}
