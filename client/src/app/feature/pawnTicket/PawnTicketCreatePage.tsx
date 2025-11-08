import React, { useState } from 'react';
import './PawnTicketCreatePage.css';
import NewPawnTab from './components/NewPawnTab';
import type { Customer as CustomerDto } from '../customer/types';
import CustomerPicker from '../../feature/customer/components/CustomerPicker';
import { createInitialPawnDraft, type PawnDraft } from './types';
import ConfirmModal from '@/app/shared/components/ConfirmModal';
import { useNavigate } from 'react-router-dom'; // ADD

type TabKey = 'customer' | 'additional' | 'newPawn' | 'previousItems' | 'history';

export default function PawnTicketCreatePage() {
    const [customerId, setCustomerId] = useState<string | null>(null);
    const [active, setActive] = useState<TabKey>('customer');
    const [customer, setCustomer] = useState<CustomerDto | null>(null);
    const [pawnDraft, setPawnDraft] = useState<PawnDraft>(() => createInitialPawnDraft());
    const [cancelOpen, setCancelOpen] = useState(false);

    const navigate = useNavigate(); // ADD

    function goto(tab: TabKey) { setActive(tab); }

    const tabs: { key: TabKey; label: string; disabled?: boolean }[] = [
        { key: 'customer', label: '1 Customer Info' },
        { key: 'additional', label: '2 Additional Info', disabled: !customerId },
        { key: 'newPawn', label: '3 New Pawn', disabled: !customerId },
        { key: 'previousItems', label: '4 Previous Items', disabled: !customerId },
        { key: 'history', label: '5 History', disabled: !customerId },
    ];

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
                <nav className="pawn-tabs" aria-label="Pawn ticket steps" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {tabs.map(t => (
                        <button
                            key={t.key}
                            type="button"
                            disabled={t.disabled}
                            className={"pawn-tab " + (active === t.key ? 'is-active' : '')}
                            onClick={() => goto(t.key)}
                        >{t.label}</button>
                    ))}
                    <div style={{ flex: 1 }} />
                    <button type="button" onClick={() => setCancelOpen(true)} style={{ background: '#c62828', color: '#fff' }}>
                        Cancel
                    </button>
                </nav>

                {/* TAB CONTENT */}
                {active === 'customer' && (
                    <div className="pawn-panel">
                        <CustomerPicker
                            value={customer}
                            onChange={setCustomer}
                            onSelected={(id) => { setCustomerId(id); setActive('newPawn'); }}
                            onCreateNew={(tempId) => { setCustomerId(tempId); }}
                        />
                        <p className="hint">Pick an existing customer or create a new one to continue.</p>
                    </div>
                )}

                {active === 'newPawn' && customerId && (
                    <NewPawnTab
                        customerId={customerId}
                        draft={pawnDraft}
                        setDraft={setPawnDraft}
                        onBack={() => setActive('customer')}
                        onGoPreviousItems={() => setActive('previousItems')}
                    />
                )}

                {active === 'previousItems' && customerId && (
                    <div className="pawn-panel placeholder">
                        <h2>Previous Items</h2>
                        <p>Select items from past tickets to add to the current draft. You can still change the customer later; items stay in the draft.</p>
                        <button type="button" onClick={() => setActive('newPawn')}>← Back to New Pawn</button>
                    </div>
                )}

                {active === 'additional' && customerId && (
                    <div className="pawn-panel placeholder">
                        <h2>Additional Info</h2>
                        <p>Extended profile fields (coming soon).</p>
                    </div>
                )}

                {active === 'history' && customerId && (
                    <div className="pawn-panel placeholder">
                        <h2>Customer History</h2>
                        <p>Aggregated statistics & ticket history (coming soon).</p>
                        <button type="button" onClick={() => setActive('newPawn')}>← Back to New Pawn</button>
                    </div>
                )}
            </div>

            <ConfirmModal
                open={cancelOpen}
                title="Cancel Transaction"
                message="Are you sure you want to cancel the transaction?"
                confirmText="Yes, cancel"
                cancelText="No, keep working"
                onConfirm={confirmCancel}
                onCancel={() => setCancelOpen(false)}
            />
        </div>
    );
}
