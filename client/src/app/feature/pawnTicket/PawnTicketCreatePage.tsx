import React, { useState } from 'react';

import './PawnTicketCreatePage.css';

import NewPawnTab from './components/NewPawnTab';
import type { Customer } from '../../../../../server/src/domain/customer/Customer'; // type-only
import CustomerPicker from './components/CustomerPicker';

type TabKey = 'customer' | 'additional' | 'newPawn' | 'previousItems' | 'history';

export default function PawnTicketCreatePage() {
    const [customerId, setCustomerId] = useState<string | null>(null);
    const [active, setActive] = useState<TabKey>('customer');
    const [customer, setCustomer] = useState<Customer | null>(null);

    function goto(tab: TabKey) { setActive(tab); }

    const tabs: { key: TabKey; label: string; disabled?: boolean }[] = [
        { key: 'customer', label: '1 Customer Info' },
        { key: 'additional', label: '2 Additional Info', disabled: !customerId },
        { key: 'newPawn', label: '3 New Pawn', disabled: !customerId },
        { key: 'previousItems', label: '4 Previous Items', disabled: !customerId },
        { key: 'history', label: '5 History', disabled: !customerId },
    ];

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!customer) { alert('Select a customer'); return; }
        // build your payload without embedding a customer form
        const payload = {
            // ...other fields...
            customerId: customer.id,
            // inventoryItemIds / newInventoryItems as needed
        };
        // ...post to API...
    };

    return (
        <form onSubmit={submit}>
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
                            onSelected={(id) => { setCustomerId(id); setActive('newPawn'); }}
                            onCreateNew={(id) => { setCustomerId(id); /* stay on customer tab until saved */ }}
                        />
                        <p className="hint">Pick an existing customer or create a new one to continue.</p>
                    </div>
                )}

                {active === 'additional' && customerId && (
                    <div className="pawn-panel placeholder">
                        <h2>Additional Info</h2>
                        <p>Extended profile fields (employment, preferences, compliance) will go here.</p>
                    </div>
                )}

                {active === 'newPawn' && customerId && (
                    <NewPawnTab
                        customerId={customerId}
                        onBack={() => setActive('customer')}
                        onGoPreviousItems={() => setActive('previousItems')}
                    />
                )}

                {active === 'previousItems' && customerId && (
                    <div className="pawn-panel placeholder">
                        <h2>Previous Items</h2>
                        <p>List of items previously pawned / purchased will appear here (coming soon).</p>
                        <button type="button" onClick={() => setActive('newPawn')}>← Back to New Pawn</button>
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
            {/* Reusable picker */}
            <CustomerPicker onSelected={function (id: string): void {
                throw new Error('Function not implemented.');
            }} onCreateNew={function (id: string): void {
                throw new Error('Function not implemented.');
            }} />

            {/* ...existing pawn ticket fields... */}

            <button type="submit">Create Ticket</button>
        </form>
    );
}
