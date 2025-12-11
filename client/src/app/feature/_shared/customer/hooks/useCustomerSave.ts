import { useState } from 'react';
import { toast } from 'sonner';
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
      
      toast.success('Customer information saved successfully!');
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

  async function updateExisting(form: CustomerRecord, customerId: string): Promise<boolean> {
    if (saving) return false;

    setSaveError(null);

    if (!form.firstName?.trim() || !form.lastName?.trim() || !form.dateOfBirth) {
      setSaveError('First, Last, and Date of Birth are required');
      return false;
    }

    try {
      setSaving(true);
      const payload = { ...form };

      await http(`/api/customer/${customerId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      toast.success('Customer information saved successfully!');
      setStatusMessage('Customer updated.');
      setTimeout(() => setStatusMessage(''), 2500);

      return true;
    } catch (e: any) {
      setSaveError(e.message || 'Update failed');
      return false;
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
    updateExisting,
    setStatusMessage,
    clearStatus,
  };
}
