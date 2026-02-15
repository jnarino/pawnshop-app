import { useState, useRef, useCallback } from 'react';
import { http } from '@/app/core/api/http';
import { AamvaData } from '@/app/shared/hooks/useIdScan';
import { CustomerRecord, apiToRecordLoose, recordToDto } from '../mappers';

interface IdConflictData {
  customer: CustomerRecord;
  scannedIdNumber: string;
  scanData: AamvaData;
}

interface UseIdScanHandlerProps {
  onSelected?: (id: string) => void;
  onChange?: (c: any) => void;
  setForm: (data: CustomerRecord) => void;
  setModalEmpty: (v: boolean) => void;
  setSearchFromScan: (v: boolean) => void;
  setSearchModalOpen: (v: boolean) => void;
  setStatusMessage: (msg: string) => void;
  setError: (err: string | null) => void;
}

export function useIdScanHandler({
  onSelected,
  onChange,
  setForm,
  setModalEmpty,
  setSearchFromScan,
  setSearchModalOpen,
  setStatusMessage,
  setError,
}: UseIdScanHandlerProps) {
  const [scanModalOpen, setScanModalOpen] = useState(false);
  const [lastScanData, setLastScanData] = useState<AamvaData | null>(null);
  const [idConflictModalOpen, setIdConflictModalOpen] = useState(false);
  const [idConflictData, setIdConflictData] = useState<IdConflictData | null>(null);
  const [saving, setSaving] = useState(false);
  const lastScanQueryKey = useRef<string | null>(null);

  const applyAamva = useCallback(async (d: AamvaData) => {
    if (!d) {
      console.warn('[IDScan] ⚠️ Failed to parse ID data');
      return;
    }

    console.info('[IDScan] 🔍 Searching for customer:', {
      idType: 'DRIVERS LICENSE',
      idState: d.stateUs,
      idNumber: d.idNumber
    });

    try {
      // Search by Driver License + State + ID Number
      const params = new URLSearchParams();
      params.set('idType', 'DRIVERS LICENSE');
      if (d.stateUs) params.set('idState', d.stateUs);
      if (d.idNumber) params.set('idNumber', d.idNumber);
      params.set('limit', '10');

      const customers = await http(`/api/customer?${params.toString()}`);

      console.info('[IDScan] Search results:', { count: customers?.length || 0 });

      if (!customers || !Array.isArray(customers) || customers.length === 0) {
        console.info('[IDScan] ❌ No customer found by Driver License + State + ID Number');
        setModalEmpty(true);
        setSearchFromScan(true);
        setLastScanData(d);
        setSearchModalOpen(true);
        return;
      }

      // Find exact match by idType, idState, and idNumber
      const idMatch = customers.find((c: any) => {
        const typeMatch = c.idType?.toUpperCase().trim() === 'DRIVERS LICENSE';
        const stateMatch = c.idState?.toUpperCase().trim() === d.stateUs?.toUpperCase().trim();
        const numberMatch = c.idNumber?.toUpperCase().trim() === d.idNumber?.toUpperCase().trim();
        return typeMatch && stateMatch && numberMatch;
      });

      if (!idMatch) {
        console.info('[IDScan] ⚠️ No exact ID match found');
        setModalEmpty(true);
        setSearchFromScan(true);
        setLastScanData(d);
        setSearchModalOpen(true);
        return;
      }

      const customerRecord = apiToRecordLoose(idMatch);

      console.info('[IDScan] ✅ Customer found:', {
        id: idMatch.id,
        name: `${idMatch.firstName} ${idMatch.lastName}`,
        idType: idMatch.idType,
        idState: idMatch.idState,
        idNumber: idMatch.idNumber
      });

      setForm(customerRecord);
      onChange?.(recordToDto(customerRecord, idMatch.id));
      onSelected?.(idMatch.id);

      console.info('[IDScan] ✅ Customer loaded successfully');

    } catch (err) {
      console.error('[IDScan] ❌ Search failed:', err);
      setError(err instanceof Error ? err.message : 'Search failed');
      setModalEmpty(true);
      setSearchFromScan(true);
      setLastScanData(d);
      setSearchModalOpen(true);
    }
  }, [onChange, onSelected, setForm, setModalEmpty, setSearchFromScan, setSearchModalOpen, setError]);

  const handleUpdateId = async () => {
    if (!idConflictData) return;
    try {
      setSaving(true);

      await http(`/api/customer/${idConflictData.customer.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idNumber: idConflictData.scannedIdNumber }),
      });

      setForm({
        ...idConflictData.customer,
        idNumber: idConflictData.scannedIdNumber
      });

      setIdConflictModalOpen(false);
      setIdConflictData(null);
      setStatusMessage('ID number updated successfully.');

      console.info('[IDScan] ✅ ID number updated');
    } catch (err: any) {
      setError(err.message || 'Unable to update ID number');
    } finally {
      setSaving(false);
    }
  };

  const handleKeepExistingId = () => {
    console.info('[IDScan] User chose to keep existing ID number');
    setIdConflictModalOpen(false);
    setIdConflictData(null);
  };

  const handleCancelIdConflict = (clearAll: () => void) => {
    setIdConflictModalOpen(false);
    setIdConflictData(null);
    clearAll();
  };

  const handleAddFromScan = (setEditingNew: (v: boolean) => void) => {
    if (lastScanData) {
      const d = lastScanData;

      setForm({
        firstName: d.firstName || '',
        middleName: d.middleName || '',
        lastName: d.lastName || '',
        dateOfBirth: d.dateOfBirth,
        sex: d.sex || '',
        idNumber: d.idNumber || '',
        idType: 'Driver License',
        idState: d.stateUs,
        idIssueDate: d.issueDate,
        idExpiration: d.expirationDate,
        idAddress: d.streetAddress,
        idCity: d.city,
        idZip: d.zipcode,
        streetAddress: d.streetAddress,
        city: d.city,
        stateUs: d.stateUs,
        zipCode: d.zipcode,
        height: d.height,
        weight: d.weight,
        eyeColor: d.eyeColor,
        hairColor: d.hairColor,
        phoneNumber: undefined,
        cellPhone: undefined,
        email: undefined,
        ssNumber: undefined,
        race: undefined,
        birthCity: undefined,
        birthState: undefined,
        birthCountry: undefined,
        marks: undefined,
        description: undefined,
        id: undefined,
        createdAt: undefined,
        updatedAt: undefined,
      } as CustomerRecord);
    }

    setEditingNew(true);
    setSearchModalOpen(false);
    setLastScanData(null);
    setModalEmpty(false);
  };

  const clearScanData = () => {
    setLastScanData(null);
    lastScanQueryKey.current = null;
  };

  return {
    scanModalOpen,
    setScanModalOpen,
    lastScanData,
    idConflictModalOpen,
    idConflictData,
    saving: saving,
    applyAamva,
    handleUpdateId,
    handleKeepExistingId,
    handleCancelIdConflict,
    handleAddFromScan,
    clearScanData,
  };
}
