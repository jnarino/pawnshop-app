import { useState } from 'react';
import { http } from '@/app/core/api/http';
import { CustomerRecord } from '../mappers';

export function useCustomerSave() {
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('');

  async function saveNew(form: CustomerRecord): Promise<string | null> {
    if (saving) return null;

    setSaveError(null);

    if (!form.firstName?.trim() || !form.lastName?.trim() || !form.dateOfBirth) {
      setSaveError('First, Last, and Date of Birth are required');
      return null;
    }

    try {
      setSaving(true);
      const payload = { ...form };
      delete (payload as any).id;

      const data = await http('/api/customer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const newId = data?.id ?? form.id;
      
      setStatusMessage('Customer saved.');
      setTimeout(() => setStatusMessage(''), 2500);

      return newId;
    } catch (e: any) {
      setSaveError(e.message || 'Save failed');
      return null;
    } finally {
      setSaving(false);
    }
  }

  function clearStatus() {
    setStatusMessage('');
    setSaveError(null);
  }

  return {
    saving,
    saveError,
    statusMessage,
    saveNew,
    setStatusMessage,
    clearStatus,
  };
}
