import { useState, useCallback, useEffect } from 'react';
import { pawnHistoryApi, PawnHistory } from '@/app/core/api/pawnHistoryApi';

interface UsePawnHistoryResult {
  history: PawnHistory[];
  loading: boolean;
  error: string | null;
  refreshHistory: () => Promise<void>;
}

export function usePawnHistory(): UsePawnHistoryResult {
  const [history, setHistory] = useState<PawnHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadHistory = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await pawnHistoryApi.getAll();
      setHistory(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load history');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  return {
    history,
    loading,
    error,
    refreshHistory: loadHistory
  };
}
