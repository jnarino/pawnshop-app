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

  const scanSearchInFlight = useRef(false);
  const lastScanQueryKey = useRef<string | null>(null);

  const applyAamva = useCallback(async (d: AamvaData) => {
    if (!d) {
      console.warn('[IDScan] ⚠️ Failed to parse ID data');
      return;
    }

    console.log('[IDScan] 🔍 Searching for customer:', {
      name: `${d.firstName} ${d.lastName}`,
      dob: d.dateOfBirth,
      idNumber: d.idNumber
    });

    try {
      const params = new URLSearchParams();
      if (d.dateOfBirth) params.set('dateOfBirth', d.dateOfBirth);
      if (d.firstName) params.set('firstName', d.firstName);
      if (d.lastName) params.set('lastName', d.lastName);
      params.set('limit', '10');

      const customers = await http(`/api/customer?${params.toString()}`);

      console.log('[IDScan] Search results:', { count: customers?.length || 0 });

      if (!customers || !Array.isArray(customers) || customers.length === 0) {
        console.log('[IDScan] ❌ No customer found by name+DOB');
        setModalEmpty(true);
        setSearchFromScan(true);
        setLastScanData(d);
        setSearchModalOpen(true);
        return;
      }

      const nameAndDobMatch = customers.find((c: any) => {
        const firstMatch = c.firstName?.toUpperCase().trim() === d.firstName?.toUpperCase().trim();
        const lastMatch = c.lastName?.toUpperCase().trim() === d.lastName?.toUpperCase().trim();
        const dobMatch = c.dateOfBirth === d.dateOfBirth;
        return firstMatch && lastMatch && dobMatch;
      });

      if (!nameAndDobMatch) {
        console.log('[IDScan] ⚠️ No exact name+DOB match found');
        setModalEmpty(true);
        setSearchFromScan(true);
        setLastScanData(d);
        setSearchModalOpen(true);
        return;
      }

      const customerRecord = apiToRecordLoose(nameAndDobMatch);

      console.log('[IDScan] ✅ Customer found:', {
        id: nameAndDobMatch.id,
        dbIdNumber: nameAndDobMatch.idNumber,
        scannedIdNumber: d.idNumber
      });

      setForm(customerRecord);
      onChange?.(recordToDto(customerRecord, nameAndDobMatch.id));
      onSelected?.(nameAndDobMatch.id);

      const dbId = nameAndDobMatch.idNumber?.toUpperCase().trim();
      const scannedId = d.idNumber?.toUpperCase().trim();
      const idNumbersMatch = dbId === scannedId;

      console.log('[IDScan] ID comparison:', {
        dbId,
        scannedId,
        match: idNumbersMatch
      });

      if (!idNumbersMatch && d.idNumber) {
        console.log('[IDScan] ⚠️ ID MISMATCH DETECTED');
        setIdConflictData({
          customer: customerRecord,
          scannedIdNumber: d.idNumber,
          scanData: d
        });
        setIdConflictModalOpen(true);
      } else {
        console.log('[IDScan] ✅ ID numbers match - customer loaded');
      }

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
      
      console.log('[IDScan] ✅ ID number updated');
    } catch (err: any) {
      setError(err.message || 'Unable to update ID number');
    } finally {
      setSaving(false);
    }
  };

  const handleKeepExistingId = () => {
    console.log('[IDScan] User chose to keep existing ID number');
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
