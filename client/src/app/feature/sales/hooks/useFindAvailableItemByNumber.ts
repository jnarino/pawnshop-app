import { useState, useCallback } from 'react';
import { inventoryApi, InventoryItem } from '@/app/core/api/inventoryApi';

interface UseFindAvailableItemByNumberResult {
  findAvailableItemByNumber: (number: string) => Promise<InventoryItem>;
  isLoading: boolean;
  error: string | null;
  success: string | null;
  resetState: () => void;
}

export function useFindAvailableItemByNumber(): UseFindAvailableItemByNumberResult {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const resetState = useCallback(() => {
    setError(null);
    setSuccess(null);
    setIsLoading(false);
  }, []);

  const findAvailableItemByNumber = useCallback(async (number: string): Promise<InventoryItem> => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await inventoryApi.findAvailableItemByNumber(number);
      const successMessage = `Item ${result.inventoryNumber || result.id} found successfully!`;
      setSuccess(successMessage);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to find item';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    findAvailableItemByNumber,
    isLoading,
    error,
    success,
    resetState
  };
}