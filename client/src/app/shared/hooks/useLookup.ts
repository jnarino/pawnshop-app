import { useEffect, useMemo } from 'react';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
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
  const typeNameUpper = typeName.toUpperCase();
  
  const typesLoaded = useSelector((state: RootState) => state.lookup.typesLoaded);
  
  const values = useSelector(
    (state: RootState) => state.lookup.values[typeNameUpper] || [],
    shallowEqual
  );
  
  const valuesLoading = useSelector(
    (state: RootState) => state.lookup.valuesLoading.includes(typeNameUpper)
  );
  
  const valuesLoaded = useSelector(
    (state: RootState) => state.lookup.valuesLoaded.includes(typeNameUpper)
  );

  useEffect(() => {
    if (typesLoaded && !valuesLoaded && !valuesLoading) {
      dispatch(fetchAttributeValues(typeName));
    }
  }, [dispatch, typeName, typesLoaded, valuesLoaded, valuesLoading]);

  const options: LookupOption[] = useMemo(() => 
    values.map(v => ({
      id: v.id,
      value: v.value
    })),
    [values]
  );

  return {
    options,
    isLoading: valuesLoading,
    isLoaded: valuesLoaded,
  };
}
