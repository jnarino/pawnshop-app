import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from '@/app/core/redux/store';
import { fetchAttributeValues } from '@/app/core/redux/lookupSlice';
import type { LookupTypeName, LookupOption } from '@/app/shared/types/lookup';

interface UseLookupResult {
  options: LookupOption[];
  isLoading: boolean;
  isLoaded: boolean;
}

export function useLookup(typeName: LookupTypeName): UseLookupResult {
  const dispatch = useDispatch<AppDispatch>();
  
  const typesLoaded = useSelector((state: RootState) => state.lookup.typesLoaded);
  const values = useSelector((state: RootState) => state.lookup.values[typeName.toUpperCase()] || []);
  const valuesLoading = useSelector((state: RootState) => state.lookup.valuesLoading.includes(typeName.toUpperCase()));
  const valuesLoaded = useSelector((state: RootState) => state.lookup.valuesLoaded.includes(typeName.toUpperCase()));

  useEffect(() => {
    if (typesLoaded && !valuesLoaded && !valuesLoading) {
      dispatch(fetchAttributeValues(typeName));
    }
  }, [dispatch, typeName, typesLoaded, valuesLoaded, valuesLoading]);

  const options: LookupOption[] = values.map(v => ({
    id: v.id,
    value: v.value
  }));

  return {
    options,
    isLoading: valuesLoading,
    isLoaded: valuesLoaded,
  };
}
