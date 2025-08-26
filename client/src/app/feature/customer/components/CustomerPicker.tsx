import React, { useMemo, useState } from 'react';
import { useCustomerSearch } from '../hooks/useCustomerSearch';
import { Customer } from '../types';

type Props = {
    value?: Customer | null;
    onChange?: (c: Customer | null) => void;
    allowClear?: boolean;
    autoFocus?: boolean;
    disabled?: boolean;
    label?: string;
};

export const CustomerPicker: React.FC<Props> = ({ value, onChange, allowClear = true, autoFocus, disabled, label = 'Customer' }) => {
    const [open, setOpen] = useState(false);
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [dateOfBirth, setDateOfBirth] = useState('');
    const { results, loading, error, search } = useCustomerSearch();

    const selectedName = useMemo(() => {
        if (!value) return 'None';
        return [value.firstName, value.middleName, value.lastName].filter(Boolean).join(' ');
    }, [value]);

    const doSearch = (e?: React.FormEvent) => {
        e?.preventDefault();
        search({ firstName, lastName, dateOfBirth });
    };

    const pick = (c: Customer) => {
        onChange?.(c);
        setOpen(false);
    };

    const clear = () => onChange?.(allowClear ? null : value ?? null);

    return (
        <div>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: 4 }}>{label}</label>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span>{selectedName}</span>
                <button type="button" onClick={() => setOpen(true)} disabled={disabled} autoFocus={autoFocus}>
                    {value ? 'Change' : 'Select'}
                </button>
                {allowClear && value && (
                    <button type="button" onClick={clear} disabled={disabled}>Clear</button>
                )}
            </div>

            {open && (
                <div style={{ border: '1px solid #ccc', padding: 12, marginTop: 8, borderRadius: 6 }}>
                    <form onSubmit={doSearch} style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                        <input placeholder="First name" value={firstName} onChange={e => setFirstName(e.target.value)} />
                        <input placeholder="Last name" value={lastName} onChange={e => setLastName(e.target.value)} />
                        <input type="date" placeholder="Date of Birth" value={dateOfBirth} onChange={e => setDateOfBirth(e.target.value)} />
                        <button type="submit" disabled={loading}>Search</button>
                        <button type="button" onClick={() => setOpen(false)}>Close</button>
                    </form>

                    {error && <div style={{ color: 'red' }}>{error}</div>}
                    <div style={{ maxHeight: 240, overflowY: 'auto', borderTop: '1px solid #eee' }}>
                        {loading && <div>Loading…</div>}
                        {!loading && results.length === 0 && <div style={{ padding: 8 }}>No results</div>}
                        {results.map(c => {
                            // Ensure all required fields are present and of correct type
                            const clientCustomer: Customer = {
                                ...c,
                                streetAddress: c.streetAddress ?? '',
                                city: c.city ?? '',
                                stateUs: c.stateUs ?? '',
                                // Add similar conversions for any other required fields if needed
                            };
                            return (
                                <div key={c.id} style={{ padding: 8, display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f0f0f0' }}>
                                    <div>
                                        <div style={{ fontWeight: 600 }}>{[c.firstName, c.middleName, c.lastName].filter(Boolean).join(' ')}</div>
                                        <div style={{ fontSize: 12, opacity: 0.8 }}>{c.dateOfBirth} · {c.phone ?? ''} · {c.email ?? ''}</div>
                                    </div>
                                    <button type="button" onClick={() => pick(clientCustomer)}>Select</button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};