import { useState, useCallback } from 'react';
import { salesApi, CreateSalePayload, SaleResponse } from '@/app/core/api/salesApi';
import { getFriendlyErrorMessage } from '@/app/core/utils/errorUtils';

interface UseCreateSaleResult {
  createTicket: (payload: CreateSalePayload) => Promise<SaleResponse | null>;
  isLoading: boolean;
  error: string | null;
  success: string | null;
  resetState: () => void;
}

export function useCreateSale(): UseCreateSaleResult {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const resetState = useCallback(() => {
    setError(null);
    setSuccess(null);
    setIsLoading(false);
  }, []);

  const createTicket = useCallback(async (payload: CreateSalePayload): Promise<SaleResponse | null> => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await salesApi.create(payload);
      const successMessage = `Sale ${result.controlNumber || result.id} created successfully!`;
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