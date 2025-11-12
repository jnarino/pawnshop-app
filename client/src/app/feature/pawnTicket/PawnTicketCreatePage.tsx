import React, { useState } from 'react';
import './PawnTicketCreatePage.css';
import NewPawnTab from './components/NewPawnTab';
import type { Customer as CustomerDto } from '../customer/types';
import CustomerPicker from '../../feature/customer/components/CustomerPicker';
import { createInitialPawnDraft, type PawnDraft } from './types';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';

type TabKey = 'customer' | 'additional' | 'newPawn' | 'previousItems' | 'history';

export default function PawnTicketCreatePage() {
    const [customerId, setCustomerId] = useState<string | null>(null);
    const [active, setActive] = useState<TabKey>('customer');
    const [customer, setCustomer] = useState<CustomerDto | null>(null);
    const [pawnDraft, setPawnDraft] = useState<PawnDraft>(() => createInitialPawnDraft());
    const [cancelOpen, setCancelOpen] = useState(false);

    const navigate = useNavigate();

    const confirmCancel = () => {
        setCancelOpen(false);
        // reset flow
        setCustomerId(null);
        setCustomer(null);
        setPawnDraft(createInitialPawnDraft());
        setActive('customer');
        // redirect to main page (adjust path if needed)
        navigate('/', { replace: true });
    };

    return (
        <div className="pawn-flow-page">
            <div className="pawn-flow">
                <Tabs value={active} onValueChange={(value) => setActive(value as TabKey)} className="space-y-2">
                    <TabsList className="grid w-full grid-cols-5">
                        <TabsTrigger className="w-full" value="customer">1 Customer Info</TabsTrigger>
                        <TabsTrigger className="w-full" value="additional" disabled={!customerId}>2 Additional Info</TabsTrigger>
                        <TabsTrigger className="w-full" value="newPawn" disabled={!customerId}>3 New Pawn</TabsTrigger>
                        <TabsTrigger className="w-full" value="previousItems" disabled={!customerId}>4 Previous Items</TabsTrigger>
                        <TabsTrigger className="w-full" value="history" disabled={!customerId}>5 History</TabsTrigger>
                    </TabsList>

                    <TabsContent value="customer">
                        <div className="pawn-panel">
                            <p className="hint">Pick an existing customer or create a new one to continue.</p>
                            <CustomerPicker
                                value={customer}
                                onChange={setCustomer}
                                onSelected={(id) => { setCustomerId(id); setActive('newPawn'); }}
                                onCreateNew={(tempId) => { setCustomerId(tempId); }}
                                onCancelTransaction={() => setCancelOpen(true)}
                            />
                        </div>
                    </TabsContent>

                    <TabsContent value="newPawn">
                        {customerId && (
                            <NewPawnTab
                                customerId={customerId}
                                draft={pawnDraft}
                                setDraft={setPawnDraft}
                                onBack={() => setActive('customer')}
                                onGoPreviousItems={() => setActive('previousItems')}
                            />
                        )}
                    </TabsContent>

                    <TabsContent value="previousItems">
                        {customerId && (
                            <div className="pawn-panel placeholder">
                                <h2>Previous Items</h2>
                                <p>Select items from past tickets to add to the current draft. You can still change the customer later; items stay in the draft.</p>
                                <button type="button" onClick={() => setActive('newPawn')}>← Back to New Pawn</button>
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="additional">
                        {customerId && (
                            <div className="pawn-panel placeholder">
                                <h2>Additional Info</h2>
                                <p>Extended profile fields (coming soon).</p>
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="history">
                        {customerId && (
                            <div className="pawn-panel placeholder">
                                <h2>Customer History</h2>
                                <p>Aggregated statistics & ticket history (coming soon).</p>
                                <button type="button" onClick={() => setActive('newPawn')}>← Back to New Pawn</button>
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </div>

            <AlertDialog open={cancelOpen} onOpenChange={setCancelOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Cancel Transaction</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to cancel the transaction?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>No, keep working</AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={confirmCancel}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Yes, cancel
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
