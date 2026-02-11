import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CustomerInfoTab from '@/app/shared/components/CustomerInfoTab';
import NewLayawayTab from '@/app/feature/sales/layaway/tabs/NewLayawayTab';
import './layaway.css';
import { CancelButton } from '@/app/shared/components/CancelButton';
import { LayawayWorkflowProvider, useLayawayWorkflow, type TabKey } from './contexts/LayawayWorkflowContext';
import CustomerPerformanceTab from '@/app/shared/components/CustomerPerformanceTab';

function LayawayWorkspaceContent() {
  const {
    activeTab,
    setActiveTab,
    customer,
    mode,
    isLayaway,
    initialTicket,
    setCustomer,
    navigateToTab,
    isPull
  } = useLayawayWorkflow();

  const handleTabChange = (tab: string) => {
    navigateToTab(tab as TabKey);
  };

  return (
    <>
      {mode !== 'VIEW' && (
        <h1 className="text-2xl font-extrabold mb-2.5">Layaway</h1>
      )}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="h-full flex flex-col">
        <div className="flex items-center gap-4 flex-shrink-0">
          <TabsList className="grid flex-1 grid-cols-3">
            <TabsTrigger value="customer">
              Customer info
            </TabsTrigger>
            <TabsTrigger value="customerPerformance" disabled={!customer?.id}>
              Customer performance
            </TabsTrigger>
            <TabsTrigger value="newLayaway">
              Layaway
            </TabsTrigger>
          </TabsList>
          <CancelButton />
        </div>

        <TabsContent value="customer" keepMounted className="flex-1 min-h-0 pt-4">
          <CustomerInfoTab
            customer={customer}
            onCustomerChange={setCustomer}
            onCustomerSelected={() => setActiveTab('newLayaway')}
          />
        </TabsContent>
        <TabsContent value="customerPerformance" keepMounted className="flex-1 min-h-0 pt-4">
          <CustomerPerformanceTab customer={customer} />
        </TabsContent>
        <TabsContent value="newLayaway" keepMounted className="flex-1 min-h-0 pt-4">
          <NewLayawayTab
            mode={mode}
            isLayaway={isLayaway}
            initialTicket={initialTicket}
            customer={customer}
            isPull={isPull}
          />
        </TabsContent>
      </Tabs>
    </>
  );
}

export default function LayawayWorkspace({ initialTicket, mode, isLayaway, isPull }: { initialTicket?: any, mode?: 'VIEW' | 'CREATE', isLayaway?: boolean, isPull?: boolean }) {
  return (
    <LayawayWorkflowProvider initialTicket={initialTicket} mode={mode} isLayaway={isLayaway} isPull={isPull}>
      <LayawayWorkspaceContent />
    </LayawayWorkflowProvider>
  );
}
