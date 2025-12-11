import { useState, useMemo, useCallback } from 'react';
import type { Customer as CustomerDto } from '../types';
import { CustomerRecord, dtoToRecord } from '../mappers';
import { deriveHeightParts, normalizeHeight } from '../utils/formatters';

export function useCustomerForm(initialValue?: CustomerDto | null) {
  const [form, setForm] = useState<CustomerRecord>(() => dtoToRecord(initialValue ?? null));
  const [useIdAddr, setUseIdAddr] = useState(false);

  const { feet: heightFeet, inches: heightInches } = useMemo(
    () => deriveHeightParts(form.height ?? undefined),
    [form.height]
  );

  const update = useCallback(<K extends keyof CustomerRecord>(k: K, v: CustomerRecord[K]) => {
    setForm(prev => ({ ...prev, [k]: v }));
  }, []);

  const setHeight = useCallback((feet: string, inches: string) => {
    update('height', normalizeHeight(feet, inches));
  }, [update]);

  const clearForm = useCallback(() => {
    setForm({ firstName: '', lastName: '', dateOfBirth: undefined, sex: '' } as any);
    setUseIdAddr(false);
  }, []);

  const setFormData = useCallback((data: CustomerRecord) => {
    setForm(data);
  }, []);

  return {
    form,
    setForm: setFormData,
    update,
    setHeight,
    heightFeet,
    heightInches,
    useIdAddr,
    setUseIdAddr,
    clearForm,
  };
}
