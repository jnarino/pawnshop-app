import { useCallback, useEffect, useMemo } from 'react';
import { useLookupStore } from '@/app/core/store/useLookupStore';
import { getAttributeTypes, getAttributeValues } from '@/app/core/api/lookupApi';
import type { LookupTypeName, LookupOption } from '@/app/shared/types/lookup';

export function useLookup(typeName?: LookupTypeName | string) {
  const {
    types, typesLoaded, typesLoading,
    values, valuesLoading, valuesLoaded,
    setTypes, setTypesLoading, setValues, addValueLoading, removeValueLoading
  } = useLookupStore();

  const loadTypes = useCallback(async () => {
    if (typesLoaded || typesLoading) return;

    setTypesLoading(true);
    try {
      const data = await getAttributeTypes();
      setTypes(data);
    } catch (error) {
      console.error('Failed to load types', error);
      setTypesLoading(false);
    }
  }, [typesLoaded, typesLoading, setTypes, setTypesLoading]);

  const loadValues = useCallback(async (targetType: string) => {
    const upperName = targetType.toUpperCase();
    if (valuesLoaded.includes(upperName) || valuesLoading.includes(upperName)) {
      return;
    }

    const typeDef = types.find(t => t.name.toUpperCase() === upperName);
    if (!typeDef) {
      if (typesLoaded) console.warn(`Type definition not found for ${upperName}`);
      return;
    }

    addValueLoading(upperName);
    try {
      const data = await getAttributeValues(typeDef.id);
      setValues(upperName, data);
    } catch (error) {
      console.error(`Failed to load values for ${upperName}`, error);
      removeValueLoading(upperName);
    }
  }, [valuesLoaded, valuesLoading, types, typesLoaded, addValueLoading, setValues, removeValueLoading]);

  useEffect(() => {
    if (typeName && typesLoaded) {
      loadValues(typeName);
    }
  }, [typeName, typesLoaded, loadValues]);

  const options: LookupOption[] = useMemo(() => {
    if (!typeName) return [];
    const upperName = typeName.toUpperCase();
    const typeValues = values[upperName] || [];
    return typeValues.map(v => ({
      id: v.id,
      value: v.value
    }));
  }, [typeName, values]);

  const isLoading = typeName ? valuesLoading.includes(typeName.toUpperCase()) : typesLoading;
  const isLoaded = typeName ? valuesLoaded.includes(typeName.toUpperCase()) : typesLoaded;

  return {
    options,
    isLoading,
    isLoaded,
    loadTypes,
    loadValues
  };
}
