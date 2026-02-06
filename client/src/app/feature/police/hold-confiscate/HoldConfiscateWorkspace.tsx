import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CancelButton } from '@/app/shared/components/CancelButton';
import { HoldConfiscateWorkflowProvider, TabKey, useHoldConfiscateWorkflow } from './contexts/HoldConfiscateWorkflowContext';
import './holdConfiscate.css';

import { HoldConfiscateTab } from './components/HoldConfiscateTab';
import { HoldConfiscateListTab } from './components/HoldConfiscateListTab';

function HoldConfiscateWorkspaceContent() {
    const {
        activeTab,
        setActiveTab,
        navigateToTab,
        initialTicket,
        mode,
    } = useHoldConfiscateWorkflow();

    const handleTabChange = (tab: string) => {
        navigateToTab(tab as TabKey);
    };

    return (
        <>
            {mode !== 'VIEW' && <h1 className="text-2xl font-extrabold mb-2.5">Hold / Confiscate</h1>}
            <Tabs value={activeTab} onValueChange={handleTabChange} className="h-full flex flex-col">
                <div className="flex items-center gap-4 flex-shrink-0">
                    <TabsList className="grid flex-1 grid-cols-2">
                        <TabsTrigger value="list">
                            List of hold / confiscate
                        </TabsTrigger>
                        <TabsTrigger value="newHoldConfiscate">
                            {mode === 'VIEW' ? 'View hold / confiscate' : 'New hold / confiscate'}
                        </TabsTrigger>
                    </TabsList>
                    <CancelButton />
                </div>

                <TabsContent value="list" keepMounted className="flex-1 min-h-0 pt-4">
                    <HoldConfiscateListTab />
                </TabsContent>
                <TabsContent value="newHoldConfiscate" keepMounted className="flex-1 min-h-0 pt-4">
                    <HoldConfiscateTab />
                </TabsContent>
            </Tabs>
        </>
    );
}

export default function HoldConfiscateWorkspace({ initialTicket, mode }: { initialTicket?: any, mode?: 'VIEW' | 'CREATE' }) {
    return (
        <HoldConfiscateWorkflowProvider initialTicket={initialTicket} mode={mode} >
            <HoldConfiscateWorkspaceContent />
        </HoldConfiscateWorkflowProvider>
    );
}
