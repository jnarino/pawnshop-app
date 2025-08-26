import { useCallback, useRef, useState } from 'react';
import { Customer } from '../../../../../../server/src/domain/customer/Customer';

type Query = { firstName?: string; lastName?: string; dateOfBirth?: string };
export function useCustomerSearch() {
    const [results, setResults] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const abortRef = useRef<AbortController | null>(null);

    const search = useCallback(async (q: Query) => {
        setLoading(true);
        setError(null);
        abortRef.current?.abort();
        const ctrl = new AbortController();
        abortRef.current = ctrl;

        const params = new URLSearchParams();
        if (q.firstName) params.set('firstName', q.firstName);
        if (q.lastName) params.set('lastName', q.lastName);
        if (q.dateOfBirth) params.set('dateOfBirth', q.dateOfBirth); // keep as-is (no month math)

        try {
            const res = await fetch(`/api/customer?${params.toString()}`, { signal: ctrl.signal, credentials: 'include' });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            setResults(Array.isArray(data) ? data : []);
        } catch (e: any) {
            if (e?.name !== 'AbortError') setError(e?.message ?? 'Search failed');
        } finally {
            setLoading(false);
        }
    }, []);

    return { results, loading, error, search };
}