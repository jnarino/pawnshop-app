
import { useState, useCallback, useEffect } from 'react';
import { pawnTicketApi, TicketByControlNumber } from '@/app/core/api/pawnTicketApi';

interface UseCustomerHistoryResult {
    history: TicketByControlNumber[];
    loading: boolean;
    error: Error | null;
    refetch: () => Promise<void>;
}

export const useCustomerHistory = (customerId: string | undefined): UseCustomerHistoryResult => {
    const [history, setHistory] = useState<TicketByControlNumber[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const fetchHistory = useCallback(async () => {
        if (!customerId) {
            setHistory([]);
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const tickets = await pawnTicketApi.getAllTicketsByCustomer(customerId);
            setHistory(tickets);
        } catch (err) {
            console.error("Failed to fetch customer history", err);
            setError(err instanceof Error ? err : new Error('Failed to fetch history'));
            setHistory([]);
        } finally {
            setLoading(false);
        }
    }, [customerId]);

    useEffect(() => {
        fetchHistory();
    }, [fetchHistory]);

    return { history, loading, error, refetch: fetchHistory };
};
