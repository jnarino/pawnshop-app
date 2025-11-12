import { useMemo, useState, useEffect, useRef } from 'react';
import React, { useCallback } from 'react';
import { AamvaData } from '../../../shared/hooks/useIdScan';
import './CustomerIdScanModal.css';
import { CustomerIdScanModal } from './CustomerIdScanModal';
import { IdConflictModal } from './IdConflictModal';
import type { Customer as CustomerDto } from '../types';
import { CustomerRecord, dtoToRecord, recordToDto, apiToRecordLoose } from '../mappers';
import './customerPicker.css';
import { http } from '@/app/core/api/http';
import { Field, FieldLabel, FieldSet, FieldLegend } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

// Centralized config (env override with safe defaults)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
const CUSTOMER_SEARCH_LIMIT = Number(import.meta.env.VITE_CUSTOMER_SEARCH_LIMIT || 100);

interface Props {
  value?: CustomerDto | null;
  onChange?: (c: CustomerDto | null) => void;
  onCreateNew?(tempId: string): void;
  onSelected?(id: string): void;
  onCancelTransaction?(): void;
}

const EYE_COLORS = ['Brown', 'Blue', 'Green', 'Hazel', 'Gray', 'Amber', 'Black'] as const;
const HAIR_COLORS = ['Brown', 'Black', 'Blonde', 'Red', 'Gray', 'White', 'Bald', 'Auburn'] as const;
const RACES = ['White', 'Black or African American', 'Asian', 'Native American', 'Pacific Islander', 'Hispanic', 'Other'] as const;
const US_STATES = ['AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'] as const;
const ID_TYPES = ['Driver License', 'State ID', 'Passport', 'US Military ID', 'Social Security Card', 'Green Card', 'Other'] as const;

// utils
function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 10);
  if (!digits) return '';
  const p1 = digits.slice(0, 3), p2 = digits.slice(3, 6), p3 = digits.slice(6);
  if (digits.length <= 3) return `(${p1}`;
  if (digits.length <= 6) return `(${p1}) ${p2}`;
  return `(${p1}) ${p2}-${p3}`;
}
function deriveHeightParts(height?: string) {
  if (!height) return { feet: '', inches: '' };
  const ftMatch = height.match(/(\d+)'/);
  const inMatch = height.match(/'(\d{1,2})"?/);
  return { feet: ftMatch ? ftMatch[1] : '', inches: inMatch ? inMatch[1] : '' };
}
function normalizeHeight(feet: string, inches: string): string | undefined {
  const f = feet.replace(/\D/g, '').slice(0, 2);
  const i = inches.replace(/\D/g, '').slice(0, 2);
  if (!f && !i) return undefined;
  return `${f || '0'}'${i || '0'}"`;
}

// sections
interface SectionProps { form: CustomerRecord; update<K extends keyof CustomerRecord>(k: K, v: CustomerRecord[K]): void; editing: boolean; }
const IdentityContactSection = ({ form, update, editing }: SectionProps) => (
  <FieldSet className="card section">
    <FieldLegend className="mb-2 text-sm">Personal Information</FieldLegend>
    <div className="grid grid-cols-2 gap-2">
      <Field>
        <FieldLabel>First Name</FieldLabel>
        <Input value={form.firstName} onChange={e => update('firstName', e.target.value)} placeholder="First" />
      </Field>
      <Field>
        <FieldLabel>Middle</FieldLabel>
        <Input value={form.middleName || ''} onChange={e => update('middleName', e.target.value)} placeholder="M" />
      </Field>
      <Field>
        <FieldLabel>Last Name *</FieldLabel>
        <Input value={form.lastName} onChange={e => update('lastName', e.target.value)} placeholder="Last" />
      </Field>
      <Field>
        <FieldLabel>Date of Birth</FieldLabel>
        <Input type="date" value={form.dateOfBirth || ''} onChange={e => update('dateOfBirth', e.target.value || undefined)} />
      </Field>

      <Field>
        <FieldLabel>Phone (primary)</FieldLabel>
        <Input value={form.phoneNumber || ''} onChange={e => update('phoneNumber', formatPhone(e.target.value))} disabled={!editing} placeholder="(555) 123-4567" />
      </Field>
      <Field>
        <FieldLabel>Cell Phone</FieldLabel>
        <Input value={form.cellPhone || ''} onChange={e => update('cellPhone', formatPhone(e.target.value))} disabled={!editing} placeholder="(555) 987-6543" />
      </Field>
      <Field>
        <FieldLabel>Email</FieldLabel>
        <Input value={form.email || ''} onChange={e => update('email', e.target.value)} disabled={!editing} />
      </Field>
      <Field>
        <FieldLabel>SS Number</FieldLabel>
        <Input value={form.ssNumber || ''} onChange={e => update('ssNumber', e.target.value)} disabled={!editing} placeholder="###-##-####" />
      </Field>
    </div>
  </FieldSet>
);

interface AddressProps extends SectionProps { useIdAddr: boolean; setUseIdAddr(v: boolean): void; }
const AddressSection = ({ form, update, editing, useIdAddr, setUseIdAddr }: AddressProps) => (
  <FieldSet className="card section">
    <FieldLegend className="mb-1 text-sm">Address</FieldLegend>

    <div className="flex items-center space-x-2">
      <Checkbox 
        id="sameAsId" 
        checked={useIdAddr} 
        onCheckedChange={(checked) => {
          setUseIdAddr(!!checked);
          if (checked) {
            update('streetAddress', form.idAddress || '');
            update('city', form.idCity || '');
            update('stateUs', form.idState || '');
            update('zipCode', form.idZip || '');
          }
        }}
      />
      <Label htmlFor="sameAsId" className="text-sm">Use ID address as primary address</Label>
    </div>

    <div className="flex gap-2">
      <Field className="flex-1">
        <FieldLabel>Street Address</FieldLabel>
        <Input value={form.streetAddress || ''} onChange={e => update('streetAddress', e.target.value)} disabled={!editing || useIdAddr} />
      </Field>
      <Field className="w-48">
        <FieldLabel>City</FieldLabel>
        <Input value={form.city || ''} onChange={e => update('city', e.target.value)} disabled={!editing || useIdAddr} />
      </Field>
      <Field className="w-20">
        <FieldLabel>State</FieldLabel>
        <Select value={form.stateUs || undefined} onValueChange={(value) => update('stateUs', value)} disabled={!editing || useIdAddr}>
          <SelectTrigger>
            <SelectValue placeholder="Select state" />
          </SelectTrigger>
          <SelectContent>
            {US_STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </Field>
      <Field className="w-28">
        <FieldLabel>Zip</FieldLabel>
        <Input value={form.zipCode || ''} onChange={e => update('zipCode', e.target.value)} disabled={!editing || useIdAddr} />
      </Field>
    </div>
  </FieldSet>
);

const GovernmentIdSection = ({ form, update, editing }: SectionProps) => (
  <FieldSet className="card section">
    <FieldLegend className="mb-1 text-sm">Government ID</FieldLegend>
    <div className="flex flex-col gap-2">
      <div className="flex gap-2 items-end">
        <Field className="flex-1">
          <FieldLabel>ID Type</FieldLabel>
          <Input list="idTypes" value={form.idType || ''} onChange={e => update('idType', e.target.value)} disabled={!editing} />
        </Field>
        <Field className="flex-1">
          <FieldLabel>ID Number</FieldLabel>
          <Input value={form.idNumber || ''} onChange={e => update('idNumber', e.target.value)} />
        </Field>
        <Field className="w-20">
          <FieldLabel>Issuing State</FieldLabel>
          <Select value={form.idState || undefined} onValueChange={(value) => update('idState', value)} disabled={!editing}>
            <SelectTrigger>
              <SelectValue placeholder="Select state" />
            </SelectTrigger>
            <SelectContent>
              {US_STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
        <Field className="w-36">
          <FieldLabel>ID Issue Date</FieldLabel>
          <Input type="date" value={form.idIssueDate || ''} onChange={e => update('idIssueDate', e.target.value)} disabled={!editing} />
        </Field>
        <Field className="w-36">
          <FieldLabel>ID Expiration</FieldLabel>
          <Input type="date" value={form.idExpiration || ''} onChange={e => update('idExpiration', e.target.value)} disabled={!editing} />
        </Field>
      </div>

      <div className="flex gap-2">
        <Field className="flex-1">
          <FieldLabel>ID Address</FieldLabel>
          <Input value={form.idAddress || ''} onChange={e => update('idAddress', e.target.value)} disabled={!editing} />
        </Field>
        <Field className="w-48">
          <FieldLabel>ID City</FieldLabel>
          <Input value={form.idCity || ''} onChange={e => update('idCity', e.target.value)} disabled={!editing} />
        </Field>
        <Field className="w-28">
          <FieldLabel>ID Zip</FieldLabel>
          <Input value={form.idZip || ''} onChange={e => update('idZip', e.target.value)} disabled={!editing} />
        </Field>
      </div>
    </div>
  </FieldSet>
);

interface PhysicalProps extends SectionProps { setHeight(feet: string, inches: string): void; heightFeet: string; heightInches: string; }
const PhysicalTraitsSection = ({ form, update, editing, setHeight, heightFeet, heightInches }: PhysicalProps) => (
  <FieldSet className="card section">
    <FieldLegend>Physical Traits & Birth</FieldLegend>
    <div className="grid grid-cols-5 gap-4">
      <Field>
        <FieldLabel>Sex</FieldLabel>
        <Select value={form.sex || undefined} onValueChange={(value) => update('sex', value || undefined)} disabled={!editing}>
          <SelectTrigger>
            <SelectValue placeholder="--" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="M">M</SelectItem>
            <SelectItem value="F">F</SelectItem>
            <SelectItem value="O">Other</SelectItem>
          </SelectContent>
        </Select>
      </Field>
      <Field>
        <FieldLabel>Height</FieldLabel>
        <div className="flex gap-1">
          <Input className="w-14" disabled={!editing} value={heightFeet} placeholder="ft" onChange={e => setHeight(e.target.value, heightInches)} />
          <Input className="w-14" disabled={!editing} value={heightInches} placeholder="in" onChange={e => setHeight(heightFeet, e.target.value)} />
        </div>
      </Field>
      <Field>
        <FieldLabel>Weight</FieldLabel>
        <Input value={form.weight || ''} onChange={e => update('weight', e.target.value)} disabled={!editing} placeholder="lbs" />
      </Field>
      <Field>
        <FieldLabel>Hair Color</FieldLabel>
        <Input list="hairColors" value={form.hairColor || ''} onChange={e => update('hairColor', e.target.value)} disabled={!editing} />
      </Field>
      <Field>
        <FieldLabel>Eye Color</FieldLabel>
        <Input list="eyeColors" value={form.eyeColor || ''} onChange={e => update('eyeColor', e.target.value)} disabled={!editing} />
      </Field>

      <Field>
        <FieldLabel>Race</FieldLabel>
        <Input list="races" value={form.race || ''} onChange={e => update('race', e.target.value)} disabled={!editing} />
      </Field>
      <Field>
        <FieldLabel>Birth City</FieldLabel>
        <Input value={form.birthCity || ''} onChange={e => update('birthCity', e.target.value)} disabled={!editing} />
      </Field>
      <Field>
        <FieldLabel>Birth State</FieldLabel>
        <Select value={form.birthState || undefined} onValueChange={(value) => update('birthState', value)} disabled={!editing}>
          <SelectTrigger>
            <SelectValue placeholder="Select state" />
          </SelectTrigger>
          <SelectContent>
            {US_STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </Field>
      <Field>
        <FieldLabel>Birth Country</FieldLabel>
        <Input value={form.birthCountry || ''} onChange={e => update('birthCountry', e.target.value)} disabled={!editing} />
      </Field>
      <Field className="col-span-2">
        <FieldLabel>Marks</FieldLabel>
        <Textarea 
          value={form.marks || ''} 
          onChange={e => update('marks', e.target.value)} 
          disabled={!editing} 
          rows={2} 
        />
      </Field>
    </div>
  </FieldSet>
);

/** Results modal */
interface SearchResultsModalProps {
  open: boolean;
  empty: boolean;
  fromScan: boolean;
  canAddFromScan: boolean;
  results: CustomerRecord[];
  loading: boolean;
  error: string | null;
  onSelect(id: string, r: CustomerRecord): void;
  onAddFromScan(): void;
  onClose(): void;
}
const SearchResultsModal = ({
  open, empty, fromScan, canAddFromScan, results, loading, error, onSelect, onAddFromScan, onClose
}: SearchResultsModalProps) => {
  if (!open) return null;
  const isCompact = !loading && empty; // ALWAYS compact when empty

  return (
    <div
      className={"cust-modal-overlay" + (isCompact ? ' is-compact' : '')}
      onClick={onClose}
    >
      <div
        className={"cust-modal" + (isCompact ? ' cust-modal--compact' : '')}
        onClick={e => e.stopPropagation()}
      >
        <div className="cust-modal__header">
          <h4>{isCompact ? 'Customer Search' : 'Customer Search Results'}</h4>
          <button type="button" className="close-btn" onClick={onClose}>×</button>
        </div>
        <div className="cust-modal__body">
          {error && <div className="error" style={{ marginBottom: 8 }}>{error}</div>}
          {loading && <div>Searching…</div>}

          {!loading && !isCompact && results.length > 0 && (
            <table className="results-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.8rem' }}>
              <thead><tr><th>Name</th><th>DOB</th><th>City</th><th>State</th><th>Phone</th></tr></thead>
              <tbody>
                {results.map(r => (
                  <tr
                    key={r.id}
                    className={r.id ? 'can-select' : ''}
                    onDoubleClick={() => r.id && onSelect(r.id, r)}
                    onClick={() => r.id && onSelect(r.id, r)}
                  >
                    <td>{r.lastName}, {r.firstName}</td>
                    <td>{r.dateOfBirth || ''}</td>
                    <td>{r.city || ''}</td>
                    <td>{r.stateUs || ''}</td>
                    <td>{r.phoneNumber || ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {!loading && isCompact && (
            <div style={{ padding: '10px 4px' }}>
              {!fromScan && (
                <p style={{ margin: 0, fontWeight: 600, textAlign: 'center' }}>Customer not found.</p>
              )}

              {fromScan && canAddFromScan && (
                <>
                  <p style={{ margin: '0 0 14px', fontWeight: 600, textAlign: 'center' }}>
                    Customer not found. Add as a new customer?
                  </p>
                  <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                    <button type="button" onClick={onAddFromScan}>Yes</button>
                    <button type="button" onClick={onClose}>No</button>
                  </div>
                </>
              )}

              {fromScan && !canAddFromScan && (
                <p style={{ margin: 0, fontWeight: 600, textAlign: 'center' }}>Customer not found.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// main
export default function CustomerPicker({ value, onChange, onSelected, onCreateNew, onCancelTransaction }: Props) {
  const [form, setForm] = useState<CustomerRecord>(() => dtoToRecord(value ?? null));
  const [results, setResults] = useState<CustomerRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingNew, setEditingNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [scanModalOpen, setScanModalOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [useIdAddr, setUseIdAddr] = useState(false);

  // NEW: track whether the upcoming modal should render compact “not found”
  const [modalEmpty, setModalEmpty] = useState(false);

  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [searchFromScan, setSearchFromScan] = useState(false);
  const [lastScanData, setLastScanData] = useState<AamvaData | null>(null);

  // ✅ NEW: State for ID conflict modal
  const [idConflictModalOpen, setIdConflictModalOpen] = useState(false);
  const [idConflictData, setIdConflictData] = useState<{
    customer: CustomerRecord;
    scannedIdNumber: string;
    scanData: AamvaData;
  } | null>(null);

  const scanSearchInFlight = useRef(false);
  const manualSearchInFlight = useRef(false);
  const lastScanQueryKey = useRef<string | null>(null);
  const lastManualQueryKey = useRef<string | null>(null);

  useEffect(() => { setForm(dtoToRecord(value ?? null)); }, [value]);

  // ESC closes modals
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (searchModalOpen) { setSearchModalOpen(false); e.stopPropagation(); return; }
        if (scanModalOpen) { setScanModalOpen(false); e.stopPropagation(); }
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [searchModalOpen, scanModalOpen]);

  const disableSearch = !form.firstName && !form.lastName && !form.dateOfBirth && !form.idNumber;

  const { feet: heightFeet, inches: heightInches } = useMemo(
    () => deriveHeightParts(form.height ?? undefined),
    [form.height]
  );

  function update<K extends keyof CustomerRecord>(k: K, v: CustomerRecord[K]) { setForm(prev => ({ ...prev, [k]: v })); }
  const setHeight = (feet: string, inches: string) => update('height', normalizeHeight(feet, inches));

  // After scanning: update minimal fields to query reliably, then search
  const applyAamva = React.useCallback(async (d: AamvaData) => {
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
      // ✅ Search by name + DOB only (ignore ID number initially)
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

      // ✅ Find customer by matching name + DOB (case-insensitive)
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

      // ✅ ALWAYS load customer data into form first
      setForm(customerRecord);
      onChange?.(recordToDto(customerRecord, nameAndDobMatch.id));
      onSelected?.(nameAndDobMatch.id);

      // ✅ NOW check if ID numbers match
      const dbId = nameAndDobMatch.idNumber?.toUpperCase().trim();
      const scannedId = d.idNumber?.toUpperCase().trim();
      const idNumbersMatch = dbId === scannedId;

      console.log('[IDScan] ID comparison:', {
        dbId,
        scannedId,
        match: idNumbersMatch
      });

      if (!idNumbersMatch && d.idNumber) {
        // ✅ ID numbers don't match - show update modal
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
  }, [onChange, onSelected]);

  // Populate form with all scanned data for new customer
  const populateFormFromScan = (d: AamvaData) => {
    setForm(prev => ({
      ...prev,
      firstName: d.firstName || '',
      middleName: d.middleName || '',
      lastName: d.lastName || '',
      dateOfBirth: d.dateOfBirth || undefined,
      idNumber: d.idNumber || '',
      idState: d.stateUs || prev.idState,
      idIssueDate: d.issueDate || prev.idIssueDate,
      idExpiration: d.expirationDate || prev.idExpiration,
      streetAddress: d.streetAddress || prev.streetAddress,
      city: d.city || prev.city,
      stateUs: d.stateUs || prev.stateUs,
      zipCode: d.zipcode || prev.zipCode,
      idAddress: d.streetAddress || prev.idAddress,
      idCity: d.city || prev.idCity,
      idZip: d.zipcode || prev.idZip,
      sex: d.sex || prev.sex,
      height: d.height || prev.height,
      eyeColor: d.eyeColor || prev.eyeColor,
      hairColor: d.hairColor || prev.hairColor,
    }));
  };

  // Load existing customer and merge with scan data
  const loadCustomerFromScan = (customer: CustomerRecord, scan: AamvaData) => {
    const merged = {
      ...customer,
      idNumber: scan.idNumber || customer.idNumber,
      idExpiration: scan.expirationDate || customer.idExpiration,
      idIssueDate: scan.issueDate || customer.idIssueDate,
      streetAddress: scan.streetAddress || customer.streetAddress,
      city: scan.city || customer.city,
      stateUs: scan.stateUs || customer.stateUs,
      zipCode: scan.zipcode || customer.zipCode,
      idAddress: scan.streetAddress || customer.idAddress,
      idCity: scan.city || customer.idCity,
      idZip: scan.zipcode || customer.idZip,
    };
    setForm(merged);
    setEditingNew(false);
    if (merged.id) {
      onSelected?.(merged.id);
      onChange?.(recordToDto(merged, merged.id));
      setStatusMessage('Customer ready for pawn.');
    }
  };

  // ✅ NEW: Handle ID update
  const handleUpdateId = async () => {
    if (!idConflictData) return;
    try {
      setSaving(true);

      await http(`/api/customer/${idConflictData.customer.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idNumber: idConflictData.scannedIdNumber }),
      });

      // Update form with new ID
      setForm(prev => ({
        ...prev,
        idNumber: idConflictData.scannedIdNumber
      }));

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

  // ✅ NEW: Keep existing ID
  const handleKeepExistingId = () => {
    console.log('[IDScan] User chose to keep existing ID number');
    setIdConflictModalOpen(false);
    setIdConflictData(null);
    // Form already has customer data loaded
  };

  // ✅ NEW: Cancel ID conflict
  const handleCancelIdConflict = () => {
    setIdConflictModalOpen(false);
    setIdConflictData(null);
    clearAll();
  };

  function clearAll() {
    setForm({ firstName: '', lastName: '', dateOfBirth: undefined, sex: '' } as any);
    setResults([]);
    setEditingNew(false);
    setSaveError(null);
    setUseIdAddr(false);
    setLastScanData(null);
    setModalEmpty(false);
    lastScanQueryKey.current = null;
    lastManualQueryKey.current = null;
  }

  function handleAddFromScan() {
    if (lastScanData) {
      const d = lastScanData;

      // ✅ FULLY RESET FORM - Start fresh with only scanned data
      setForm({
        // Required fields
        firstName: d.firstName || '',
        middleName: d.middleName || '',
        lastName: d.lastName || '',
        dateOfBirth: d.dateOfBirth,
        sex: d.sex || '',

        // ID Information
        idNumber: d.idNumber || '',
        idType: 'Driver License', // ✅ Default based on scan
        idState: d.stateUs,
        idIssueDate: d.issueDate,
        idExpiration: d.expirationDate,
        idAddress: d.streetAddress,
        idCity: d.city,
        idZip: d.zipcode,

        // Primary Address (from ID)
        streetAddress: d.streetAddress,
        city: d.city,
        stateUs: d.stateUs,
        zipCode: d.zipcode,

        // Physical Traits
        height: d.height,
        weight: d.weight,
        eyeColor: d.eyeColor,
        hairColor: d.hairColor,

        // ✅ Clear all other fields (no leftover data from previous customer)
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

        // System fields
        id: undefined,
        createdAt: undefined,
        updatedAt: undefined,
      } as CustomerRecord);
    }

    setEditingNew(true);
    setSearchModalOpen(false);
    setLastScanData(null); // ✅ Clear scan data after using it
    setModalEmpty(false);
  }

  async function saveNew() {
    if (saving) return;
    setSaveError(null);

    if (!form.firstName?.trim() || !form.lastName?.trim() || !form.dateOfBirth) {
      setSaveError('First, Last, and Date of Birth are required');
      return;
    }

    try {
      setSaving(true);
      const payload = { ...form };
      delete (payload as any).id; // Remove id if present

      // ✅ Use http() instead of fetch() to include JWT token
      const data = await http('/api/customer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const newId = data?.id ?? form.id;
      setEditingNew(false);
      onSelected?.(newId);
      onChange?.(recordToDto(form, newId));
      setStatusMessage('Customer saved.');
      setTimeout(() => setStatusMessage(''), 2500);
    } catch (e: any) {
      setSaveError(e.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  const containerClass = 'customer-lookup' + (editingNew ? ' is-editing-new' : '');
  const canAddFromScan = !!lastScanData && modalEmpty;

  async function search(e: React.FormEvent) {
    e.preventDefault();
    if (disableSearch || loading || manualSearchInFlight.current) return;
    const manualQueryKey = `${form.firstName || ''}|${form.lastName || ''}|${form.dateOfBirth || ''}|${form.idNumber || ''}`;
    if (lastManualQueryKey.current === manualQueryKey) return;
    manualSearchInFlight.current = true;
    lastManualQueryKey.current = manualQueryKey;
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (form.firstName) params.append('firstName', form.firstName);
      if (form.lastName) params.append('lastName', form.lastName);
      if (form.dateOfBirth) params.append('dateOfBirth', form.dateOfBirth);
      if (form.idNumber) params.append('idNumber', form.idNumber);
      params.append('limit', CUSTOMER_SEARCH_LIMIT.toString());

      // Use http function with JWT auth
      const payload = await http(`/api/customer?${params.toString()}`);
      const searchResults = (Array.isArray(payload) ? payload : []).map(apiToRecordLoose);

      setResults(searchResults);
      setModalEmpty(searchResults.length === 0);
      setSearchFromScan(false);
      setSearchModalOpen(true);
    } catch (err: any) {
      setError(err.message || 'Search failed');
      setModalEmpty(true);
      setSearchFromScan(false);
      setSearchModalOpen(true);
    } finally {
      manualSearchInFlight.current = false;
      setLoading(false);
    }
  }

  return (
    <div className={containerClass}>
      <form onSubmit={search} aria-label="Customer search / create">
        <div className="grid grid-cols-3 gap-3">
          <IdentityContactSection form={form} update={update} editing={editingNew} />
          <div className="col-span-2 flex flex-col gap-2">
            <AddressSection form={form} update={update} editing={editingNew} useIdAddr={useIdAddr} setUseIdAddr={setUseIdAddr} />
            <GovernmentIdSection form={form} update={update} editing={editingNew} />
          </div>
          
          <div className="col-span-3 grid grid-cols-12 gap-4">
            <div className="col-span-7">
              <PhysicalTraitsSection form={form} update={update} editing={editingNew} setHeight={setHeight} heightFeet={heightFeet} heightInches={heightInches} />
            </div>
            <div className="col-span-3">
              <FieldSet className="card section h-full">
                <FieldLegend>Notes</FieldLegend>
                <Field className="h-[calc(100%-2rem)]">
                  <Textarea 
                    value={form.description || ''} 
                    onChange={e => update('description', e.target.value)} 
                    className="h-full resize-none"
                    placeholder="Notes / description" 
                  />
                </Field>
              </FieldSet>
            </div>
            <div className="col-span-2 flex flex-col justify-between py-4">
              <div className="flex flex-col gap-2">
                {!editingNew && (
                  <>
                    <Button type="submit" disabled={disableSearch || loading}>{loading ? 'Searching…' : 'Find'}</Button>
                    <Button type="button" variant="outline" onClick={clearAll} disabled={loading}>Clear</Button>
                    <Button type="button" variant="secondary" onClick={() => { setEditingNew(true); setResults([]); onCreateNew?.(crypto.randomUUID()); }} disabled={loading}>Add New</Button>
                    <Button type="button" variant="secondary" onClick={() => setScanModalOpen(true)}>Scan ID</Button>
                  </>
                )}
                {editingNew && (
                  <>
                    <Button type="button" onClick={saveNew} disabled={saving}>{saving ? 'Saving…' : 'Save Customer'}</Button>
                    <Button type="button" variant="outline" onClick={clearAll} disabled={saving}>Cancel</Button>
                  </>
                )}
              </div>
              {!editingNew && onCancelTransaction && (
                <Button type="button" variant="destructive" onClick={onCancelTransaction}>Cancel Transaction</Button>
              )}
            </div>
          </div>
        </div>



        {saveError && <div className="error" role="alert">{saveError}</div>}
        {statusMessage && <div className="cp-status">{statusMessage}</div>}

        <datalist id="eyeColors">{EYE_COLORS.map(c => <option key={c} value={c} />)}</datalist>
        <datalist id="hairColors">{HAIR_COLORS.map(c => <option key={c} value={c} />)}</datalist>
        <datalist id="races">{RACES.map(c => <option key={c} value={c} />)}</datalist>
        <datalist id="idTypes">{ID_TYPES.map(c => <option key={c} value={c} />)}</datalist>
      </form>

      <SearchResultsModal
        open={searchModalOpen}
        empty={modalEmpty}
        fromScan={searchFromScan}
        canAddFromScan={canAddFromScan}
        results={results}
        loading={loading}
        error={error}
        onSelect={(id, rec) => { onSelected?.(id); setForm(rec); onChange?.(recordToDto(rec, id)); setSearchModalOpen(false); }}
        onAddFromScan={handleAddFromScan}
        onClose={() => setSearchModalOpen(false)}
      />

      <CustomerIdScanModal
        open={scanModalOpen}
        onClose={() => setScanModalOpen(false)}
        onScanned={(data: AamvaData) => applyAamva(data)}
      />

      <IdConflictModal
        open={idConflictModalOpen}
        existingIdNumber={idConflictData?.customer.idNumber || ''}
        scannedIdNumber={idConflictData?.scannedIdNumber || ''}
        customerName={
          idConflictData
            ? `${idConflictData.customer.firstName} ${idConflictData.customer.lastName}`
            : ''
        }
        onUpdateId={handleUpdateId}
        onKeepExisting={handleKeepExistingId}
        onCancel={handleCancelIdConflict}
      />
    </div>
  );
}
