import React, { useState } from 'react';

import './PawnTicketCreatePage.css';

import NewPawnTab from './components/NewPawnTab';
// Use client DTO type (don’t import server domain types in the client)
import type { Customer as CustomerDto } from '../customer/types';
import CustomerPicker from '../../feature/customer/components/CustomerPicker';
import { createInitialPawnDraft, type PawnDraft } from './types';

type TabKey = 'customer' | 'additional' | 'newPawn' | 'previousItems' | 'history';

export default function PawnTicketCreatePage() {
    const [customerId, setCustomerId] = useState<string | null>(null);
    const [active, setActive] = useState<TabKey>('customer');
    const [customer, setCustomer] = useState<CustomerDto | null>(null);

    // Persist the pawn draft across tab changes and customer changes
    const [pawnDraft, setPawnDraft] = useState<PawnDraft>(() => createInitialPawnDraft());

    function goto(tab: TabKey) { setActive(tab); }

    const tabs: { key: TabKey; label: string; disabled?: boolean }[] = [
        { key: 'customer', label: '1 Customer Info' },
        { key: 'additional', label: '2 Additional Info', disabled: !customerId },
        { key: 'newPawn', label: '3 New Pawn', disabled: !customerId },
        { key: 'previousItems', label: '4 Previous Items', disabled: !customerId },
        { key: 'history', label: '5 History', disabled: !customerId },
    ];

    return (
        // Note: no outer <form> to avoid nesting with CustomerPicker’s form
        <div className="pawn-flow-page">
            <div className="pawn-flow">
                <nav className="pawn-tabs" aria-label="Pawn ticket steps">
                    {tabs.map(t => (
                        <button
                            key={t.key}
                            type="button"
                            disabled={t.disabled}
                            className={"pawn-tab " + (active === t.key ? 'is-active' : '')}
                            onClick={() => goto(t.key)}
                        >{t.label}</button>
                    ))}
                </nav>

                {/* TAB CONTENT */}
                {active === 'customer' && (
                    <div className="pawn-panel">
                        <CustomerPicker
                            value={customer}
                            onChange={setCustomer}
                            onSelected={(id) => { setCustomerId(id); setActive('newPawn'); }}
                            onCreateNew={(tempId) => { setCustomerId(tempId); /* keep draft; allow assigning items later */ }}
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
                        {/* You can plug in a list here that calls setPawnDraft(d => ({ ...d, items: [...d.items, selectedItem] })) */}
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
        </div>
    );
}
