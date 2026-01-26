import { useCallback, useState } from 'react';

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CancelButton } from '@/app/shared/components/CancelButton';

import { Loader2 } from 'lucide-react';
import { apiToRecordLoose, type CustomerRecord } from '@/app/feature/_shared/customer/mappers';
import { customerApi } from '@/app/core/api/customerApi';
import { RangeDatePicker } from '@/components/ui/range-date-picker';
import { formatDate } from '@/lib/utils';
import { CustomerIdScanModal } from '@/app/feature/_shared/customer';
import { AamvaData } from '../hooks/useIdScan';

type TabKey = 'customer' | 'ticket' | 'date-range';
export type ScopeFilter = 'all' | 'active';

interface MaintainSearchProps {
    handleSearchControlNumber: (ticketNumber: string) => void;
    handleSelectedCustomer: (params: CustomerRecord, scope: ScopeFilter) => void;
    handleSearchByDateRange?: (startDate: string, endDate: string) => void;
    setShowTicketTable: (show: boolean) => void;
    showCustomerTab?: boolean;
    showTicketTab?: boolean;
    showDateRangeTab?: boolean;
    iniitialDates?: {
        from: string;
        to: string;
    };
}

export const MaintainSearch = ({
    handleSearchControlNumber,
    handleSelectedCustomer,
    handleSearchByDateRange,
    setShowTicketTable,
    showCustomerTab = true,
    showTicketTab = true,
    showDateRangeTab = true,
    iniitialDates = {
        from: '',
        to: ''
    }
}: MaintainSearchProps) => {
    const [selectedCustomer, setSelectedCustomer] = useState<CustomerRecord | null>(null);
    const [activeTab, setActiveTab] = useState<TabKey>('customer');
    const [scope, setScope] = useState<ScopeFilter>('active');
    const [customerResults, setCustomerResults] = useState<CustomerRecord[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [showIdScanModal, setShowIdScanModal] = useState(false);

    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [dateOfBirth, setDateOfBirth] = useState('');
    const [loading, setLoading] = useState(false);
    const [ticketNumber, setTicketNumber] = useState('');
    const [dates, setDates] = useState(iniitialDates);

    const searchCustomers = useCallback(async () => {
        if (!firstName && !lastName && !dateOfBirth) {
            setError('Enter first name, last name, or DOB');
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams();
            if (firstName) params.append('firstName', firstName);
            if (lastName) params.append('lastName', lastName);
            if (dateOfBirth) params.append('dateOfBirth', dateOfBirth);
            params.append('limit', import.meta.env.VITE_CUSTOMER_SEARCH_LIMIT || '100');
            const payload = await customerApi.findCustomer(params.toString());
            const results = (Array.isArray(payload) ? payload : []).map(apiToRecordLoose);
            setCustomerResults(results);
            if (results.length === 0) {
                setError('No customers found with those fields');
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Search failed';
            setError(message);
            setCustomerResults([]);
        } finally {
            setLoading(false);
        }
    }, [firstName, lastName, dateOfBirth]);

    const tabCount = [showCustomerTab, showTicketTab, showDateRangeTab].filter(Boolean).length;
    const gridColsClass = {
        1: 'grid-cols-1',
        2: 'grid-cols-2',
        3: 'grid-cols-3',
    }[tabCount] || 'grid-cols-4';

    function handleScanned(data: AamvaData, raw: string): void {
        console.log("Scanner data", { data, raw });
        setFirstName(data.firstName || '');
        setLastName(data.lastName || '');
        setDateOfBirth(data.dateOfBirth || '');
    }

    return (
        <Tabs value={activeTab} onValueChange={(v) => {
            setShowTicketTable(false);
            setActiveTab(v as TabKey)
        }
        }>
            <div className="flex items-center gap-4 flex-shrink-0">
                <TabsList className={`grid ${gridColsClass} w-full`}>
                    {showCustomerTab && <TabsTrigger value="customer">By Customer</TabsTrigger>}
                    {showTicketTab && <TabsTrigger value="ticket">By Ticket ID</TabsTrigger>}
                    {showDateRangeTab && <TabsTrigger value="date-range">By Date Range</TabsTrigger>}
                </TabsList>
                <CancelButton />
            </div>
            <TabsContent value="customer" className="space-y-4">
                <div className="grid grid-cols-12 items-end gap-3 py-4">
                    <div className="col-span-3 space-y-2">
                        <Label htmlFor="first-name">First Name</Label>
                        <Input
                            id="first-name"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !loading) {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    searchCustomers();
                                }
                            }}
                            placeholder="First name"
                            disabled={loading}
                            className="text-sm"
                        />
                    </div>
                    <div className="col-span-3 space-y-2">
                        <Label htmlFor="last-name">Last Name</Label>
                        <Input
                            id="last-name"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !loading) {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    searchCustomers();
                                }
                            }}
                            placeholder="Last name"
                            disabled={loading}
                            className="text-sm"
                        />
                    </div>
                    <div className="col-span-3 space-y-2">
                        <Label htmlFor="dob">Birthdate</Label>
                        <Input
                            id="dob"
                            type="date"
                            value={dateOfBirth}
                            onChange={(e) => setDateOfBirth(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !loading) {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    searchCustomers();
                                }
                            }}
                            disabled={loading}
                            className="text-sm"
                        />
                    </div>
                    <Button
                        className="col-span-3"
                        type="button"
                        variant="secondary"
                        onClick={() => setShowIdScanModal(true)}
                    >
                        Scan ID
                    </Button>
                    {
                        showIdScanModal && (<CustomerIdScanModal
                            open={showIdScanModal}
                            onClose={() => setShowIdScanModal(false)}
                            onScanned={(data, raw) => handleScanned(data, raw)}
                        />)
                    }
                </div>

                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <Label>Status</Label>
                        <RadioGroup
                            value={scope}
                            onValueChange={(value) => {
                                const nextScope = value as ScopeFilter;
                                setScope(nextScope);
                                if (selectedCustomer) {
                                    handleSelectedCustomer(selectedCustomer, nextScope);
                                }
                            }}
                            className="flex gap-4"
                        >
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="all" id="scope-all" />
                                <Label htmlFor="scope-all" className="cursor-pointer">All</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="active" id="scope-active" />
                                <Label htmlFor="scope-active" className="cursor-pointer">Active</Label>
                            </div>
                        </RadioGroup>
                    </div>
                    <div className="flex gap-2">
                        <Button onClick={searchCustomers} disabled={loading}>
                            {loading ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Searching...
                                </>
                            ) : 'Search Customers'}
                        </Button>
                    </div>
                </div>

                {error && (
                    <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                <div className="border rounded-lg">
                    <Table stickyHeader>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-40">Customer</TableHead>
                                <TableHead className="w-32">Birthdate</TableHead>
                                <TableHead className="w-32">ID Number</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {customerResults.map((c) => (
                                <TableRow
                                    key={c.id}
                                    className={`cursor-pointer hover:bg-muted/50 ${selectedCustomer?.id === c.id ? 'bg-amber-50 border-l-4 border-amber-500' : ''}`}
                                    onClick={() => {
                                        setSelectedCustomer(c);
                                        !loading && handleSelectedCustomer(c, scope);
                                    }}
                                >
                                    <TableCell className="font-semibold">{c.firstName} {c.lastName}</TableCell>
                                    <TableCell>{formatDate(c.dateOfBirth) || '—'}</TableCell>
                                    <TableCell>{c.idNumber || '—'}</TableCell>
                                </TableRow>
                            ))}
                            {customerResults.length === 0 && !loading && (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center text-muted-foreground py-6">
                                        No customers yet. Search by name or DOB.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </TabsContent>

            <TabsContent value="ticket" className="space-y-4">
                <div className="grid grid-cols-12 gap-3 items-end">
                    <div className="col-span-6 space-y-2">
                        <Label htmlFor="ticket-number">Ticket #</Label>
                        <Input
                            id="ticket-number"
                            value={ticketNumber}
                            onChange={(e) => setTicketNumber(e.target.value)}
                            placeholder="Enter ticket number"
                            disabled={loading}
                            className="text-sm"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !loading) {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleSearchControlNumber(ticketNumber);
                                }
                            }}
                        />
                    </div>
                    <div className="col-span-6 flex justify-end gap-2">
                        <Button onClick={() => handleSearchControlNumber(ticketNumber)} disabled={loading}>
                            {loading ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Searching...
                                </>
                            ) : 'Find'}
                        </Button>
                    </div>
                </div>

                {error && (
                    <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}
            </TabsContent>

            <TabsContent value="date-range" className="space-y-4">
                <div className="grid grid-cols-12 gap-3 items-end">
                    <div className="col-span-6 space-y-2">
                        <Label htmlFor="ticket-number">Select Date Range</Label>
                        <RangeDatePicker
                            value={dates}
                            onChange={setDates}
                        />
                    </div>
                    <div className="col-span-6 flex justify-end gap-2">
                        <Button onClick={() => handleSearchByDateRange?.(dates.from, dates.to)} disabled={loading}>
                            {loading ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Searching...
                                </>
                            ) : 'Find'}
                        </Button>
                    </div>
                </div>

                {error && (
                    <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}
            </TabsContent>
        </Tabs>
    );
};