// src/app/feature/pawnTicket/hooks/usePawnTicketCreation.ts
import { useState } from 'react';
import { http } from '@/app/core/api/http';
import type { CreatePawnTicketDto, PawnTicketDto } from '@/app/shared/types/pawnTicket';

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

    return { createPawnTicket, loading, error };
}