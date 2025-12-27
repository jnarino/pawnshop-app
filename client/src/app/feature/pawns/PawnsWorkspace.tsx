import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { PawnWorkflowProvider, usePawnWorkflow, type TabKey } from './contexts/PawnWorkflowContext';
import CustomerInfoTab from './tabs/CustomerInfoTab';
import NewPawnTab from './tabs/NewPawnTab';
import CustomerPerformanceTab from './tabs/CustomerPerformanceTab';
import './pawns.css';

function PawnsWorkspaceContent() {
  const {
    activeTab,
    setActiveTab,
    openCancelModal,
    customer,
    setCustomer,
    canNavigateToTab,
    navigateToTab
  } = usePawnWorkflow();

  const handleTabChange = (tab: string) => {
    const tabKey = tab as TabKey;
    navigateToTab(tabKey);
  };

  return (
    <>
      <h1 className="text-2xl font-extrabold mb-2.5">Pawn / Buy</h1>
      <Tabs value={activeTab} onValueChange={handleTabChange} className="h-full flex flex-col">
        <div className="flex items-center gap-4 flex-shrink-0">
          <TabsList className="grid flex-1 grid-cols-5">
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
          <Button variant="destructive" onClick={openCancelModal}>
            Cancel Transaction
          </Button>
        </div>

        <TabsContent value="customer" keepMounted className="flex-1 min-h-0 pt-4">
          <CustomerInfoTab
            customer={customer}
            onCustomerChange={setCustomer}
            onCustomerSelected={() => setActiveTab('newPawn')}
          />
        </TabsContent>

        <TabsContent value="newPawn" keepMounted className="flex-1 min-h-0 pt-4">
          <NewPawnTab
            customer={customer}
          />
        </TabsContent>

        <TabsContent value="previousItems" keepMounted className="flex-1 min-h-0 pt-4">
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Previous Items - Coming Soon
          </div>
        </TabsContent>

        <TabsContent value="customerPerformance" keepMounted className="flex-1 min-h-0 pt-4">
          <CustomerPerformanceTab customer={customer} />
        </TabsContent>

        <TabsContent value="history" keepMounted className="flex-1 min-h-0 pt-4">
          <div className="flex items-center justify-center h-full text-muted-foreground">
            History - Coming Soon
          </div>
        </TabsContent>
      </Tabs>
    </>
  );
}

export default function PawnsWorkspace() {
  return (
    <PawnWorkflowProvider>
      <PawnsWorkspaceContent />
    </PawnWorkflowProvider>
  );
}
