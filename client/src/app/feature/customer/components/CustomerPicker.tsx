import { useMemo, useState, useEffect, useRef } from 'react';
import React, { useCallback } from 'react';
import { AamvaData } from '../../../shared/hooks/useIdScan';
import './CustomerIdScanModal.css';
import { CustomerIdScanModal } from './CustomerIdScanModal';
import { IdConflictModal } from './IdConflictModal';
import type { Customer as CustomerDto } from '../types';
import { CustomerRecord, dtoToRecord, recordToDto, apiToRecordLoose } from '../mappers';
import './customerPicker.css'; // ← ensure the case matches the actual filename
import { http } from '@/app/core/api/http'; // ✅ Add this import

// Centralized config (env override with safe defaults)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
const CUSTOMER_SEARCH_LIMIT = Number(import.meta.env.VITE_CUSTOMER_SEARCH_LIMIT || 100);

interface Props {
  value?: CustomerDto | null;
  onChange?: (c: CustomerDto | null) => void;
  onCreateNew?(tempId: string): void;
  onSelected?(id: string): void;
}

const EYE_COLORS = ['Brown', 'Blue', 'Green', 'Hazel', 'Gray', 'Amber', 'Black'] as const;
const HAIR_COLORS = ['Brown', 'Black', 'Blonde', 'Red', 'Gray', 'White', 'Bald', 'Auburn'] as const;
const RACES = ['White', 'Black or African American', 'Asian', 'Native American', 'Pacific Islander', 'Hispanic', 'Other'] as const;
const US_STATES = ['', 'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'] as const;
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
  <fieldset className="card section">
    <legend>Personal Information</legend>
    <div className="grid cols-4 gap">
      <label>First Name<input value={form.firstName} onChange={e => update('firstName', e.target.value)} placeholder="First" /></label>
      <label>Middle<input value={form.middleName || ''} onChange={e => update('middleName', e.target.value)} placeholder="M" /></label>
      <label>Last Name *<input value={form.lastName} onChange={e => update('lastName', e.target.value)} placeholder="Last" /></label>
      <label>Date of Birth<input type="date" value={form.dateOfBirth || ''} onChange={e => update('dateOfBirth', e.target.value || undefined)} /></label>

      <label>Phone (primary)<input value={form.phoneNumber || ''} onChange={e => update('phoneNumber', formatPhone(e.target.value))} disabled={!editing} placeholder="(555) 123-4567" /></label>
      <label>Cell Phone<input value={form.cellPhone || ''} onChange={e => update('cellPhone', formatPhone(e.target.value))} disabled={!editing} placeholder="(555) 987-6543" /></label>
      <label>Email<input value={form.email || ''} onChange={e => update('email', e.target.value)} disabled={!editing} /></label>
      <label>SS Number<input value={form.ssNumber || ''} onChange={e => update('ssNumber', e.target.value)} disabled={!editing} placeholder="###-##-####" /></label>
    </div>
  </fieldset>
);

interface AddressProps extends SectionProps { useIdAddr: boolean; setUseIdAddr(v: boolean): void; }
const AddressSection = ({ form, update, editing, useIdAddr, setUseIdAddr }: AddressProps) => (
  <fieldset className="card section">
    <legend>Address</legend>

    <div className="checkbox-row">
      <input id="sameAsId" type="checkbox" checked={useIdAddr} onChange={e => {
        const checked = e.target.checked;
        setUseIdAddr(checked);
        if (checked) {
          update('streetAddress', form.idAddress || '');
          update('city', form.idCity || '');
          update('stateUs', form.idState || '');
          update('zipCode', form.idZip || '');
        }
      }} />
      <label htmlFor="sameAsId">Use ID address as primary address</label>
    </div>

    <div className="grid cols-4 gap">
      <label className="col-span-2">Street Address<input value={form.streetAddress || ''} onChange={e => update('streetAddress', e.target.value)} disabled={!editing || useIdAddr} /></label>
      <label>City<input value={form.city || ''} onChange={e => update('city', e.target.value)} disabled={!editing || useIdAddr} /></label>
      <label>State
        <select value={form.stateUs || ''} onChange={e => update('stateUs', e.target.value)} disabled={!editing || useIdAddr}>
          {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </label>
      <label>Zip<input value={form.zipCode || ''} onChange={e => update('zipCode', e.target.value)} disabled={!editing || useIdAddr} /></label>
    </div>
  </fieldset>
);

const GovernmentIdSection = ({ form, update, editing }: SectionProps) => (
  <fieldset className="card section">
    <legend>Government ID</legend>
    <div className="grid cols-4 gap">
      <label>ID Type
        <input list="idTypes" value={form.idType || ''} onChange={e => update('idType', e.target.value)} disabled={!editing} />
      </label>
      <label>ID Number
        <input value={form.idNumber || ''} onChange={e => update('idNumber', e.target.value)} />
      </label>
      <label>Issuing State
        <select value={form.idState || ''} onChange={e => update('idState', e.target.value)} disabled={!editing}>
          {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </label>
      <label>ID Issue Date
        <input type="date" value={form.idIssueDate || ''} onChange={e => update('idIssueDate', e.target.value)} disabled={!editing} />
      </label>
      <label>ID Expiration
        <input type="date" value={form.idExpiration || ''} onChange={e => update('idExpiration', e.target.value)} disabled={!editing} />
      </label>

      <label className="col-span-2">ID Address<input value={form.idAddress || ''} onChange={e => update('idAddress', e.target.value)} disabled={!editing} /></label>
      <label>ID City<input value={form.idCity || ''} onChange={e => update('idCity', e.target.value)} disabled={!editing} /></label>
      <label>ID Zip<input value={form.idZip || ''} onChange={e => update('idZip', e.target.value)} disabled={!editing} /></label>
    </div>
  </fieldset>
);

interface PhysicalProps extends SectionProps { setHeight(feet: string, inches: string): void; heightFeet: string; heightInches: string; }
const PhysicalTraitsSection = ({ form, update, editing, setHeight, heightFeet, heightInches }: PhysicalProps) => (
  <fieldset className="card section">
    <legend>Physical Traits & Birth</legend>
    <div className="grid cols-5 gap">
      <label>Sex
        <select value={form.sex || ''} onChange={e => update('sex', e.target.value || undefined)} disabled={!editing}>
          <option value="">--</option><option value="M">M</option><option value="F">F</option><option value="O">Other</option>
        </select>
      </label>
      <label>Height
        <div style={{ display: 'flex', gap: 4 }}>
          <input style={{ width: 50 }} disabled={!editing} value={heightFeet} placeholder="ft" onChange={e => setHeight(e.target.value, heightInches)} />
          <input style={{ width: 50 }} disabled={!editing} value={heightInches} placeholder="in" onChange={e => setHeight(heightFeet, e.target.value)} />
        </div>
      </label>
      <label>Weight <input value={form.weight || ''} onChange={e => update('weight', e.target.value)} disabled={!editing} placeholder="lbs" /></label>
      <label>Hair Color <input list="hairColors" value={form.hairColor || ''} onChange={e => update('hairColor', e.target.value)} disabled={!editing} /></label>
      <label>Eye Color <input list="eyeColors" value={form.eyeColor || ''} onChange={e => update('eyeColor', e.target.value)} disabled={!editing} /></label>

      <label>Race <input list="races" value={form.race || ''} onChange={e => update('race', e.target.value)} disabled={!editing} /></label>
      <label>Birth City<input value={form.birthCity || ''} onChange={e => update('birthCity', e.target.value)} disabled={!editing} /></label>
      <label>Birth State
        <select value={form.birthState || ''} onChange={e => update('birthState', e.target.value)} disabled={!editing}>
          {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </label>
      <label>Birth Country<input value={form.birthCountry || ''} onChange={e => update('birthCountry', e.target.value)} disabled={!editing} /></label>
      <label className="col-span-2">Marks<textarea value={form.marks || ''} onChange={e => update('marks', e.target.value)} disabled={!editing} rows={2} /></label>
    </div>
  </fieldset>
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
export default function CustomerPicker({ value, onChange, onSelected, onCreateNew }: Props) {
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

  // Add new state for ID conflict handling
  const [idConflictModalOpen, setIdConflictModalOpen] = useState(false);
  const [foundCustomerWithDifferentId, setFoundCustomerWithDifferentId] = useState<{ customer: CustomerRecord; scannedIdNumber: string } | null>(null);

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
      // ✅ Use http() instead of fetch() to include JWT token
      const params = new URLSearchParams();
      if (d.dateOfBirth) params.set('dateOfBirth', d.dateOfBirth);
      if (d.firstName) params.set('firstName', d.firstName);
      if (d.lastName) params.set('lastName', d.lastName);
      params.set('limit', '10');

      const customers = await http(`/api/customer?${params.toString()}`);

      console.log('[IDScan] Search results:', { count: customers?.length || 0 });

      if (!customers || !Array.isArray(customers) || customers.length === 0) {
        console.log('[IDScan] ❌ No customer found');
        // Show "not found" modal
        setModalEmpty(true);
        setSearchFromScan(true);
        setLastScanData(d);
        setSearchModalOpen(true);
        return;
      }

      // Find exact match by ID number
      const match = customers.find((c: any) =>
        c.idNumber?.toUpperCase() === d.idNumber?.toUpperCase()
      );

      if (match) {
        console.log('[IDScan] ✅ Customer found:', match.id);
        // Update form with customer data
        const rec = apiToRecordLoose(match);
        setForm(rec);
        onChange?.(recordToDto(rec, match.id));
        onSelected?.(match.id);
      } else {
        console.log('[IDScan] ⚠️ Customers found but no ID match');
        // Show "not found" modal
        setModalEmpty(true);
        setSearchFromScan(true);
        setLastScanData(d);
        setSearchModalOpen(true);
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

  // Handle ID conflict resolution - Update ID
  const handleUpdateId = async () => {
    if (!foundCustomerWithDifferentId || !lastScanData) return;
    try {
      setSaving(true);
      const { customer, scannedIdNumber } = foundCustomerWithDifferentId;
      const resp = await fetch(`${API_BASE_URL}/api/customer/${customer.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ idNumber: scannedIdNumber }),
      });
      if (!resp.ok) throw new Error('Failed to update ID number');
      setIdConflictModalOpen(false);
      setFoundCustomerWithDifferentId(null);
      loadCustomerFromScan({ ...customer, idNumber: scannedIdNumber }, lastScanData);
      setStatusMessage('ID number updated.');
    } catch (err: any) {
      setError(err.message || 'Unable to update ID number');
    } finally {
      setSaving(false);
    }
  };

  // Handle ID conflict resolution - Keep existing ID
  const handleKeepExistingId = () => {
    if (!foundCustomerWithDifferentId || !lastScanData) return;
    const { customer } = foundCustomerWithDifferentId;
    setIdConflictModalOpen(false);
    setFoundCustomerWithDifferentId(null);
    loadCustomerFromScan(customer, lastScanData);
  };

  // Handle ID conflict resolution - Cancel
  const handleCancelIdConflict = () => {
    setIdConflictModalOpen(false);
    setFoundCustomerWithDifferentId(null);
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
      setForm(prev => ({
        ...prev,
        idIssueDate: d.issueDate ?? prev.idIssueDate,
        idExpiration: d.expirationDate ?? prev.idExpiration,
        streetAddress: d.streetAddress ?? prev.streetAddress,
        city: d.city ?? prev.city,
        stateUs: d.stateUs ?? prev.stateUs,
        zipCode: d.zipcode ?? prev.zipCode,
        sex: d.sex ?? prev.sex,
        height: d.height ?? prev.height,
        weight: d.weight ?? prev.weight,
        eyeColor: prev.eyeColor || d.eyeColor,
        hairColor: prev.hairColor || d.hairColor,
      }));
    }
    setEditingNew(true);
    setSearchModalOpen(false);
  }

  async function saveNew() {
    if (saving) return; setSaveError(null);
    if (!form.firstName?.trim() || !form.lastName?.trim() || !form.dateOfBirth) { setSaveError('First, Last, and Date of Birth are required'); return; }
    try {
      setSaving(true);
      const payload = { ...form } as any; delete payload.id;
      const res = await fetch(`${API_BASE_URL}/api/customer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error((await res.text()) || 'Save failed');
      const data = await res.json(); const newId = data?.id ?? form.id;
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
        <IdentityContactSection form={form} update={update} editing={editingNew} />
        <AddressSection form={form} update={update} editing={editingNew} useIdAddr={useIdAddr} setUseIdAddr={setUseIdAddr} />
        <GovernmentIdSection form={form} update={update} editing={editingNew} />
        <PhysicalTraitsSection form={form} update={update} editing={editingNew} setHeight={setHeight} heightFeet={heightFeet} heightInches={heightInches} />

        <fieldset className="card section">
          <legend>Notes</legend>
          <label className="block">
            <textarea value={form.description || ''} onChange={e => update('description', e.target.value)} rows={3} placeholder="Notes / description" />
          </label>
        </fieldset>

        <div className="actions-row">
          {!editingNew && (
            <>
              <button type="submit" disabled={disableSearch || loading}>{loading ? 'Searching…' : 'Find'}</button>
              <button type="button" onClick={clearAll} disabled={loading}>Clear</button>
              <button type="button" onClick={() => { setEditingNew(true); setResults([]); onCreateNew?.(crypto.randomUUID()); }} disabled={loading}>Add New</button>
              <button type="button" onClick={() => setScanModalOpen(true)}>Scan ID</button>
            </>
          )}
          {editingNew && (
            <>
              <button type="button" onClick={saveNew} disabled={saving}>{saving ? 'Saving…' : 'Save Customer'}</button>
              <button type="button" onClick={clearAll} disabled={saving}>Cancel</button>
            </>
          )}
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
        existingIdNumber={foundCustomerWithDifferentId?.customer.idNumber || ''}
        scannedIdNumber={foundCustomerWithDifferentId?.scannedIdNumber || ''}
        customerName={
          foundCustomerWithDifferentId
            ? `${foundCustomerWithDifferentId.customer.firstName} ${foundCustomerWithDifferentId.customer.lastName}`
            : ''
        }
        onUpdateId={handleUpdateId}
        onKeepExisting={handleKeepExistingId}
        onCancel={handleCancelIdConflict}
      />
    </div>
  );
}
