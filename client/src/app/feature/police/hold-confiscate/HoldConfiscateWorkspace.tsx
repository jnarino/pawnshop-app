import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CancelButton } from '@/app/shared/components/CancelButton';
import { HoldConfiscateWorkflowProvider, TabKey, useHoldConfiscateWorkflow } from './contexts/HoldConfiscateWorkflowContext';
import './holdConfiscate.css';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Eye, Loader2 } from 'lucide-react';
import { policeApi, PoliceHold } from '@/app/core/api/policeApi';
import { Tooltip } from '@/components/ui/tooltip';
import { formatDate } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const HoldConfiscateListTab = () => {
    const { setSelectedHold, navigateToTab } = useHoldConfiscateWorkflow();
    const [loading, setLoading] = useState(false);
    const [holds, setHolds] = useState<PoliceHold[]>([]);

    // Filters
    const [controlNumber, setControlNumber] = useState('');
    const [inventoryNumber, setInventoryNumber] = useState('');
    const [caseNumber, setCaseNumber] = useState('');
    const [jurisdiction, setJurisdiction] = useState('');
    const [agency, setAgency] = useState('');

    const activeFilter = controlNumber ? 'controlNumber' :
        inventoryNumber ? 'inventoryNumber' :
            caseNumber ? 'caseNumber' :
                jurisdiction ? 'jurisdiction' :
                    agency ? 'agency' : null;

    const handleSearch = async () => {
        setLoading(true);
        try {
            const results = await policeApi.getHolds({
                controlNumber,
                inventoryNumber,
                caseNumber,
                jurisdiction,
                agency
            });
            setHolds(results);
        } catch (error) {
            console.error('Failed to items', error);
        } finally {
            setLoading(false);
        }
    };

    const handleClear = () => {
        setControlNumber('');
        setInventoryNumber('');
        setCaseNumber('');
        setJurisdiction('');
        setAgency('');
        setHolds([]);
    };

    const handleView = (hold: PoliceHold) => {
        setSelectedHold(hold);
        navigateToTab('newHoldConfiscate');
    };

    const handleNew = () => {
        setSelectedHold(null);
        navigateToTab('newHoldConfiscate');
    };

    return (
        <div className="flex flex-col gap-6">
            <Card>
                <CardHeader>
                    <CardTitle>Search Filters</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="ticket">Ticket #</Label>
                            <Input
                                id="ticket"
                                value={controlNumber}
                                onChange={(e) => setControlNumber(e.target.value)}
                                placeholder="Enter ticket #"
                                disabled={activeFilter !== null && activeFilter !== 'controlNumber'}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="inventory">Inventory #</Label>
                            <Input
                                id="inventory"
                                value={inventoryNumber}
                                onChange={(e) => setInventoryNumber(e.target.value)}
                                placeholder="Enter inventory #"
                                disabled={activeFilter !== null && activeFilter !== 'inventoryNumber'}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="case">Case #</Label>
                            <Input
                                id="case"
                                value={caseNumber}
                                onChange={(e) => setCaseNumber(e.target.value)}
                                placeholder="Enter case #"
                                disabled={activeFilter !== null && activeFilter !== 'caseNumber'}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="jurisdiction">Jurisdiction</Label>
                            <Input
                                id="jurisdiction"
                                value={jurisdiction}
                                onChange={(e) => setJurisdiction(e.target.value)}
                                placeholder="Enter jurisdiction"
                                disabled={activeFilter !== null && activeFilter !== 'jurisdiction'}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="agency">Agency</Label>
                            <Input
                                id="agency"
                                value={agency}
                                onChange={(e) => setAgency(e.target.value)}
                                placeholder="Enter agency"
                                disabled={activeFilter !== null && activeFilter !== 'agency'}
                            />
                        </div>
                        <div className="flex items-end gap-2 justify-end">
                            <Button onClick={handleSearch} disabled={loading} className="flex-1">
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Find
                            </Button>
                            <Button onClick={handleClear} variant="outline" disabled={loading}>
                                Clear
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
            <div className="flex items-end gap-2 justify-end">
                <Button onClick={handleNew} disabled={loading}>
                    Add new
                </Button>
            </div>
            <div className="border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Ticket/ Inv #</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Jurisdiction</TableHead>
                            <TableHead>Case #</TableHead>
                            <TableHead>Date out</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {holds.length === 0 && !loading && (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center text-muted-foreground py-6">
                                    No results found. Adjust filters and try again.
                                </TableCell>
                            </TableRow>
                        )}
                        {holds.map((hold) => (
                            <TableRow key={hold.id}>
                                <TableCell className="font-medium">
                                    {hold.controlNumber || hold.items?.[0]?.inventoryNumber || '—'}
                                </TableCell>
                                <TableCell>{formatDate(hold.holdDate)}</TableCell>
                                <TableCell>{hold.jurisdiction || '—'}</TableCell>
                                <TableCell>{hold.caseNumber || '—'}</TableCell>
                                <TableCell>{formatDate(hold.dateOut) || '—'}</TableCell>
                                <TableCell className="text-right">
                                    <Tooltip content="View details">
                                        <Button variant="ghost" size="icon" onClick={() => handleView(hold)}>
                                            <Eye className="h-4 w-4" />
                                        </Button>
                                    </Tooltip>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
};

const HoldConfiscateTab = () => {
    return (
        <div>
            <h2>New hold / confiscate</h2>
        </div>
    );
};

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
