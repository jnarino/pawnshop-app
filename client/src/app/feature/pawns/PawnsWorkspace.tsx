import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PawnWorkflowProvider, usePawnWorkflow, type TabKey } from './contexts/PawnWorkflowContext';
import CustomerInfoTab from '@/app/shared/components/CustomerInfoTab';
import NewPawnTab from './tabs/NewPawnTab';
import './pawns.css';
import { CancelButton } from '@/app/shared/components/CancelButton';
import { PreviousItemsTab } from './tabs/PreviousItemsTab/PreviousItemsTab';
import HistoryTab from './tabs/HistoryTab/HistoryTab';
import CustomerPerformanceTab from '@/app/shared/components/CustomerPerformanceTab';
import { FormMode } from './types';

function PawnsWorkspaceContent() {
  const {
    activeTab,
    setActiveTab,
    customer,
    initialTicket,
    mode,
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
      {mode === 'CREATE' && <h1 className="text-2xl font-extrabold mb-2.5">Pawn / Buy</h1>}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="h-full flex flex-col">
        <div className="flex items-center gap-4 flex-shrink-0">
          <TabsList className={`grid flex-1 grid-cols-${mode === 'MODIFY' ? '3' : '5'}`}>
            <TabsTrigger value="customer">
              Customer Info
            </TabsTrigger>
            <TabsTrigger value="customerPerformance" disabled={!canNavigateToTab('customerPerformance')}>
              Customer Performance
            </TabsTrigger>
            <TabsTrigger value="newPawn" disabled={!canNavigateToTab('newPawn')}>
              {mode === 'MODIFY' ? 'View pawn' : 'New Pawn'}
            </TabsTrigger>
            {mode !== 'MODIFY' && (
              <>
                <TabsTrigger value="previousItems" disabled={!canNavigateToTab('previousItems')}>
                  Previous Items
                </TabsTrigger>
                <TabsTrigger value="history" disabled={!canNavigateToTab('history')}>
                  History
                </TabsTrigger>
              </>
            )}

          </TabsList>
          <CancelButton />
        </div>

        <TabsContent value="customer" keepMounted className="flex-1 min-h-0 pt-4">
          <CustomerInfoTab
            customer={customer}
            onCustomerChange={setCustomer}
            onCustomerSelected={() => setActiveTab('newPawn')}
          />
        </TabsContent>

        <TabsContent value="customerPerformance" keepMounted className="flex-1 min-h-0 pt-4">
          <CustomerPerformanceTab customer={customer} />
        </TabsContent>

        <TabsContent value="newPawn" keepMounted className="flex-1 min-h-0 pt-4">
          <NewPawnTab
            customer={customer}
            initialTicket={initialTicket}
            mode={mode}
          />
        </TabsContent>

        {mode !== 'MODIFY' && (
          <>
            <TabsContent value="previousItems" keepMounted className="flex-1 min-h-0 pt-4">
              <PreviousItemsTab customer={customer} />
            </TabsContent>

            <TabsContent value="history" keepMounted className="flex-1 min-h-0 pt-4">
              <HistoryTab />
            </TabsContent>
          </>
        )}
      </Tabs>
    </>
  );
}

export default function PawnsWorkspace({ mode = 'CREATE', initialTicket }: { mode?: FormMode, initialTicket?: any }) {
  return (
    <PawnWorkflowProvider initialTicket={initialTicket} mode={mode}>
      <PawnsWorkspaceContent />
    </PawnWorkflowProvider>
  );
}
