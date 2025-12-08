import { useState, useCallback, useEffect } from 'react';
import { activePawnApi, ActivePawn } from '@/app/core/api/activePawnApi';

interface UseActivePawnsResult {
  pawns: ActivePawn[];
  loading: boolean;
  error: string | null;
  refreshPawns: () => Promise<void>;
}

export function useActivePawns(): UseActivePawnsResult {
  const [pawns, setPawns] = useState<ActivePawn[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadActivePawns = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await activePawnApi.getAll();
      setPawns(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load active pawns');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadActivePawns();
  }, [loadActivePawns]);

  return {
    pawns,
    loading,
    error,
    refreshPawns: loadActivePawns
  };
}
