// src/app/feature/pawns/tabs/NewPawnTab/hooks/usePawnTicketCreation.ts
import { useState } from 'react';
import { http } from '@/app/core/api/http';
import type { CreatePawnTicketDto, PawnTicketDto } from '@/app/shared/types/pawnTicket';
import type { Customer } from '@/app/feature/_shared/customer/types';

// Re-export Customer type for convenience
export type { Customer } from '@/app/feature/_shared/customer/types';

export function usePawnTicketCreation() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const createPawnTicket = async (data: CreatePawnTicketDto): Promise<PawnTicketDto> => {
        try {
            setLoading(true);
            setError(null);

            const response = await http<PawnTicketDto>('/api/pawnTicket', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            return response;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to create pawn ticket';
            setError(errorMessage);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const getCustomerInfo = async (customerId: string): Promise<Customer> => {
        try {
            const customer = await http<Customer>(`/api/customer/${customerId}`);
            return customer;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to fetch customer';
            setError(errorMessage);
            throw err;
        }
    };

    return { createPawnTicket, getCustomerInfo, loading, error };
}