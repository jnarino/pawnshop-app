import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SalesWorkflowProvider, useSalesWorkflow, type TabKey } from '@/app/feature/sales/contexts/SalesWorkflowContext';
import CustomerInfoTab from '@/app/shared/components/CustomerInfoTab';
import NewSaleTab from '@/app/feature/sales/tabs/NewSaleTab';
import './sales.css';
import { CancelButton } from '@/app/shared/components/CancelButton';

function SalesWorkspaceContent() {
  const {
    activeTab,
    setActiveTab,
    customer,
    setCustomer,
    navigateToTab
  } = useSalesWorkflow();

  const handleTabChange = (tab: string) => {
    navigateToTab(tab as TabKey);
  };

  return (
    <>
      <h1 className="text-2xl font-extrabold mb-2.5">Sales</h1>
      <Tabs value={activeTab} onValueChange={handleTabChange} className="h-full flex flex-col">
        <div className="flex items-center gap-4 flex-shrink-0">
          <TabsList className="grid flex-1 grid-cols-2">
            <TabsTrigger value="customer">
              Customer Info
            </TabsTrigger>
            <TabsTrigger value="newSale">
              Sale
            </TabsTrigger>
          </TabsList>
          <CancelButton />
        </div>

        <TabsContent value="customer" keepMounted className="flex-1 min-h-0 pt-4">
          <CustomerInfoTab
            customer={customer}
            onCustomerChange={setCustomer}
            onCustomerSelected={() => setActiveTab('newSale')}
          />
        </TabsContent>
        <TabsContent value="newSale" keepMounted className="flex-1 min-h-0 pt-4">
          <NewSaleTab
            customer={customer}
          />
        </TabsContent>
      </Tabs>
    </>
  );
}

export default function SalesWorkspace() {
  return (
    <SalesWorkflowProvider>
      <SalesWorkspaceContent />
    </SalesWorkflowProvider>
  );
}
