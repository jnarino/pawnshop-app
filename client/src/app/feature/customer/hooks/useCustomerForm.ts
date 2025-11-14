import { useState, useMemo } from 'react';
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

  function update<K extends keyof CustomerRecord>(k: K, v: CustomerRecord[K]) {
    setForm(prev => ({ ...prev, [k]: v }));
  }

  function setHeight(feet: string, inches: string) {
    update('height', normalizeHeight(feet, inches));
  }

  function clearForm() {
    setForm({ firstName: '', lastName: '', dateOfBirth: undefined, sex: '' } as any);
    setUseIdAddr(false);
  }

  function setFormData(data: CustomerRecord) {
    setForm(data);
  }

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
