import { useState, useCallback } from 'react';
import { getFriendlyErrorMessage } from '@/app/core/utils/errorUtils';
import { CreateLayawayPayload, layawayApi, LayawayResponse } from '@/app/core/api/layawayApi';

interface UseCreateLayawayResult {
  createTicket: (payload: CreateLayawayPayload) => Promise<LayawayResponse | null>;
  isLoading: boolean;
  error: string | null;
  success: string | null;
  resetState: () => void;
}

export function useCreateLayaway(): UseCreateLayawayResult {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const resetState = useCallback(() => {
    setError(null);
    setSuccess(null);
    setIsLoading(false);
  }, []);

  const createTicket = useCallback(async (payload: CreateLayawayPayload): Promise<LayawayResponse | null> => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await layawayApi.create(payload);
      const successMessage = `Layaway ${result.ticketNumber || result.id} created successfully!`;
      setSuccess(successMessage);
      return result;
    } catch (err) {
      const errorMessage = getFriendlyErrorMessage(err);
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    createTicket,
    isLoading,
    error,
    success,
    resetState
  };
}