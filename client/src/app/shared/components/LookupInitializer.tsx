import { useEffect } from 'react';
import { useLookup } from '@/app/shared/hooks/useLookup';
import { useAuthStore } from '@/app/core/store/useAuthStore';

/**
 * Initializes item_attribute_types on app startup.
 * Fetches all available item_attribute_types from the API and caches them in Store.
 * This enables the LookupSelect component to load values on-demand for each type.
 */
export function LookupInitializer({ children }: { readonly children: React.ReactNode }) {
  const { loadTypes } = useLookup();
  const isAuthenticated = useAuthStore(s => s.status === 'authenticated');

  useEffect(() => {
    // Only fetch lookups if user is authenticated
    if (isAuthenticated) {
      loadTypes();
    }
  }, [loadTypes, isAuthenticated]);

  return <>{children}</>;
}
