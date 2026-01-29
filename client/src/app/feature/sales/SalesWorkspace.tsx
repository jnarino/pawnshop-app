import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SalesWorkflowProvider, useSalesWorkflow, type TabKey } from '@/app/feature/sales/contexts/SalesWorkflowContext';
import CustomerInfoTab from '@/app/shared/components/CustomerInfoTab';
import NewSaleTab from '@/app/feature/sales/tabs/NewSaleTab';
import './sales.css';
import { CancelButton } from '@/app/shared/components/CancelButton';
import CustomerPerformanceTab from '@/app/shared/components/CustomerPerformanceTab';

function SalesWorkspaceContent() {
  const {
    activeTab,
    setActiveTab,
    customer,
    setCustomer,
    navigateToTab,
    initialTicket,
    mode,
  } = useSalesWorkflow();

  const handleTabChange = (tab: string) => {
    navigateToTab(tab as TabKey);
  };

  return (
    <>
      {mode !== 'VIEW' && <h1 className="text-2xl font-extrabold mb-2.5">Sales</h1>}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="h-full flex flex-col">
        <div className="flex items-center gap-4 flex-shrink-0">
          <TabsList className="grid flex-1 grid-cols-3">
            <TabsTrigger value="customer">
              Customer info
            </TabsTrigger>
            <TabsTrigger value="customerPerformance" disabled={!customer?.id}>
              Customer performance
            </TabsTrigger>
            <TabsTrigger value="newSale">
              {mode === 'VIEW' ? 'View sale' : 'New Sale'}
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
        <TabsContent value="customerPerformance" keepMounted className="flex-1 min-h-0 pt-4">
          <CustomerPerformanceTab customer={customer} />
        </TabsContent>
        <TabsContent value="newSale" keepMounted className="flex-1 min-h-0 pt-4">
          <NewSaleTab
            customer={customer}
            initialTicket={initialTicket}
            mode={mode}
          />
        </TabsContent>
      </Tabs>
    </>
  );
}

export default function SalesWorkspace({ initialTicket, mode }: { initialTicket?: any, mode?: 'VIEW' | 'CREATE' }) {
  return (
    <SalesWorkflowProvider initialTicket={initialTicket} mode={mode} >
      <SalesWorkspaceContent />
    </SalesWorkflowProvider>
  );
}
