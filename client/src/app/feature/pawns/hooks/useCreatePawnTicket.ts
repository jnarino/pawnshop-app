import { useState, useCallback } from 'react';
import { pawnTicketApi, CreatePawnTicketPayload, PawnTicketResponse } from '@/app/core/api/pawnTicketApi';

interface UseCreatePawnTicketResult {
  createTicket: (payload: CreatePawnTicketPayload) => Promise<PawnTicketResponse | null>;
  updateTicket: (payload: any) => Promise<PawnTicketResponse | null>;
  isLoading: boolean;
  error: string | null;
  success: string | null;
  resetState: () => void;
}

export function useCreatePawnTicket(): UseCreatePawnTicketResult {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const resetState = useCallback(() => {
    setError(null);
    setSuccess(null);
    setIsLoading(false);
  }, []);

  const createTicket = useCallback(async (payload: CreatePawnTicketPayload): Promise<PawnTicketResponse | null> => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await pawnTicketApi.create(payload);
      const successMessage = `Pawn ticket ${result.controlNumber || result.id} created successfully!`;
      setSuccess(successMessage);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create pawn ticket';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateTicket = useCallback(async (payload: any): Promise<PawnTicketResponse | null> => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await pawnTicketApi.update(payload);
      const successMessage = `Pawn ticket ${result.controlNumber || result.id} updated successfully!`;
      setSuccess(successMessage);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update pawn ticket';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    createTicket,
    updateTicket,
    isLoading,
    error,
    success,
    resetState
  };
}