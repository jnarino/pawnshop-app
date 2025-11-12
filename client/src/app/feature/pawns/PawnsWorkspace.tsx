import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PawnWorkflowProvider, usePawnWorkflow, type TabKey } from './contexts/PawnWorkflowContext';
import CustomerInfoTab from './tabs/CustomerInfoTab';
import NewPawnTab from './tabs/NewPawnTab';
import './pawns.css';

function PawnsWorkspaceContent() {
  const { activeTab, setActiveTab, canNavigateToTab } = usePawnWorkflow();

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
          <TabsTrigger value="additional" disabled={!canNavigateToTab('additional')}>
            Additional Info
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
          <CustomerInfoTab />
        </TabsContent>

        <TabsContent value="additional" className="h-[calc(100%-4rem)]">
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Additional Info - Coming Soon
          </div>
        </TabsContent>

        <TabsContent value="newPawn" className="h-[calc(100%-4rem)]">
          <NewPawnTab />
        </TabsContent>

        <TabsContent value="previousItems" className="h-[calc(100%-4rem)]">
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Previous Items - Coming Soon
          </div>
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
