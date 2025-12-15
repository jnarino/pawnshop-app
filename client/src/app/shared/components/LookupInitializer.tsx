import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from '@/app/core/redux/store';
import { fetchAttributeTypes } from '@/app/core/redux/lookupSlice';
import { isAuthenticated } from '@/app/core/auth/authService';

/**
 * Initializes item_attribute_types on app startup.
 * Fetches all available item_attribute_types from the API and caches them in Redux.
 * This enables the LookupSelect component to load values on-demand for each type.
 */
export function LookupInitializer({ children }: { readonly children: React.ReactNode }) {
  const dispatch = useDispatch<AppDispatch>();
  const typesLoaded = useSelector((state: RootState) => state.lookup.typesLoaded);
  const typesLoading = useSelector((state: RootState) => state.lookup.typesLoading);

  useEffect(() => {
    // Only fetch lookups if user is authenticated
    if (!typesLoaded && !typesLoading && isAuthenticated()) {
      dispatch(fetchAttributeTypes());
    }
  }, [dispatch, typesLoaded, typesLoading]);

  return <>{children}</>;
}
