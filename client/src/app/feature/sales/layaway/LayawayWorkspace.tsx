import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CustomerInfoTab from '@/app/shared/components/CustomerInfoTab';
import NewLayawayTab from '@/app/feature/sales/layaway/tabs/NewLayawayTab';
import './layaway.css';
import { CancelButton } from '@/app/shared/components/CancelButton';
import { LayawayWorkflowProvider, useLayawayWorkflow, type TabKey } from './contexts/LayawayWorkflowContext';

function LayawayWorkspaceContent() {
  const {
    activeTab,
    setActiveTab,
    customer,
    setCustomer,
    navigateToTab
  } = useLayawayWorkflow();

  const handleTabChange = (tab: string) => {
    navigateToTab(tab as TabKey);
  };

  return (
    <>
      <h1 className="text-2xl font-extrabold mb-2.5">Layaway</h1>
      <Tabs value={activeTab} onValueChange={handleTabChange} className="h-full flex flex-col">
        <div className="flex items-center gap-4 flex-shrink-0">
          <TabsList className="grid flex-1 grid-cols-2">
            <TabsTrigger value="customer">
              Customer Info
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
        <TabsContent value="newLayaway" keepMounted className="flex-1 min-h-0 pt-4">
          <NewLayawayTab
            customer={customer}
          />
        </TabsContent>
      </Tabs>
    </>
  );
}

export default function LayawayWorkspace() {
  return (
    <LayawayWorkflowProvider>
      <LayawayWorkspaceContent />
    </LayawayWorkflowProvider>
  );
}
