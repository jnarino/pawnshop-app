import { useMemo, useState } from 'react';
import React from 'react';
import { AamvaData } from '../../../shared/hooks/useIdScan';
import './CustomerIdScanModal.css';
import { CustomerIdScanModal } from './CustomerIdScanModal';
import type { Customer as CustomerDto } from '../types';
import { CustomerRecord, dtoToRecord, recordToDto, apiToRecordLoose } from '../mappers';
import './CustomerPicker.css';

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

interface SearchResultsModalProps {
  open: boolean;
  results: CustomerRecord[];
  loading: boolean;
  error: string | null;
  fromScan: boolean;
  canAddFromScan: boolean;
  onSelect(id: string, rec: CustomerRecord): void;
  onAddFromScan(): void;
  onClose(): void;
}
const SearchResultsModal = ({ open, results, loading, error, fromScan, canAddFromScan, onSelect, onAddFromScan, onClose }: SearchResultsModalProps) => {
  if (!open) return null;
  return (
    <div className="cust-modal-overlay" role="dialog" aria-modal="true">
      <div className="cust-modal">
        <div className="cust-modal__header">
          <h4>Customer Search Results</h4>
          <button type="button" className="close-btn" onClick={onClose}>×</button>
        </div>
        <div className="cust-modal__body">
          {error && <div className="error" style={{ marginBottom: 8 }}>{error}</div>}
          {loading && <div>Searching…</div>}
          {!loading && results.length > 0 && (
            <table className="results-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.8rem' }}>
              <thead><tr><th>Name</th><th>DOB</th><th>City</th><th>State</th><th>Phone</th></tr></thead>
              <tbody>
                {results.map(r => (
                  <tr key={r.id} className={r.id ? 'can-select' : ''} onDoubleClick={() => r.id && onSelect(r.id, r)} onClick={() => r.id && onSelect(r.id, r)}>
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
          {!loading && results.length === 0 && (
            <div style={{ padding: '12px 4px' }}>
              <p style={{ margin: 0, fontWeight: 600 }}>No customer found.</p>
              {fromScan && canAddFromScan && (
                <div style={{ marginTop: 8 }}>
                  <p style={{ margin: '0 0 6px' }}>Customer not found, would you like to add it as a new customer?</p>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button type="button" onClick={onAddFromScan}>Yes</button>
                    <button type="button" onClick={onClose}>No</button>
                  </div>
                </div>
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
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [searchFromScan, setSearchFromScan] = useState(false);
  const [lastScanData, setLastScanData] = useState<AamvaData | null>(null);

  React.useEffect(() => { setForm(dtoToRecord(value ?? null)); }, [value]);

  const disableSearch = !form.firstName && !form.lastName && !form.dateOfBirth && !form.idNumber;
  const { feet: heightFeet, inches: heightInches } = useMemo(() => deriveHeightParts(form.height ?? undefined), [form.height]);

  function update<K extends keyof CustomerRecord>(k: K, v: CustomerRecord[K]) { setForm(prev => ({ ...prev, [k]: v })); }
  const setHeight = (feet: string, inches: string) => update('height', normalizeHeight(feet, inches));

  const applyAamva = React.useCallback((d: AamvaData) => {
    setLastScanData(d);
    setForm(f => {
      const next: CustomerRecord = { ...f, firstName: d.firstName ?? f.firstName, middleName: d.middleName ?? f.middleName, lastName: d.lastName ?? f.lastName, dateOfBirth: d.dateOfBirth ?? f.dateOfBirth, idIssueDate: d.issueDate ?? f.idIssueDate, idExpiration: d.expirationDate ?? f.idExpiration, streetAddress: d.streetAddress ?? f.streetAddress, city: d.city ?? f.city, stateUs: d.stateUs ?? f.stateUs, zipCode: d.zipcode ?? f.zipCode, sex: d.sex ?? f.sex, height: d.height ?? f.height, idNumber: d.idNumber ?? f.idNumber, weight: d.weight ?? f.weight };
      if (d.eyeColor && !f.eyeColor) next.eyeColor = d.eyeColor;
      if (d.hairColor && !f.hairColor) next.hairColor = d.hairColor;
      onChange?.(recordToDto(next, next.id));
      return next;
    });
    // Automatically search after scanning
    setTimeout(() => { search(undefined, { fromScan: true }); }, 0);
  }, [onChange]);

  async function search(e?: React.FormEvent, opts?: { fromScan?: boolean }) {
    e?.preventDefault();
    if (disableSearch && !form.idNumber) return;
    setError(null);
    setLoading(true);
    setResults([]);
    setSearchFromScan(!!opts?.fromScan);
    try {
      const params = new URLSearchParams();
      if (form.firstName) params.append('firstName', form.firstName.trim());
      if (form.lastName) params.append('lastName', form.lastName.trim());
      if (form.dateOfBirth) params.append('dateOfBirth', form.dateOfBirth as string);
      if (form.idNumber) params.append('idNumber', form.idNumber as string);
      params.append('limit', String(CUSTOMER_SEARCH_LIMIT));
      const res = await fetch(`${API_BASE_URL}/api/customer?${params.toString()}`, { credentials: 'include' });
      const data = await res.json();
      const mapped = (Array.isArray(data) ? data : []).map(apiToRecordLoose);
      setResults(mapped);
    } catch (err: any) {
      setError(err.message || 'Search failed');
    } finally {
      setLoading(false);
      setSearchModalOpen(true);
    }
  }

  function clearAll() {
    setForm({ firstName: '', lastName: '', dateOfBirth: undefined, sex: '' } as any);
    setResults([]);
    setEditingNew(false);
    setSaveError(null);
    setUseIdAddr(false);
    setLastScanData(null);
  }

  function handleAddFromScan() {
    setEditingNew(true);
    setSearchModalOpen(false);
  }

  async function saveNew() {
    if (saving) return; setSaveError(null);
    if (!form.firstName?.trim() || !form.lastName?.trim() || !form.dateOfBirth) { setSaveError('First, Last, and Date of Birth are required'); return; }
    try {
      setSaving(true);
      const payload = { ...form } as any; delete payload.id;
      const res = await fetch(`${API_BASE_URL}/api/customer`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(payload) });
      if (!res.ok) throw new Error((await res.text()) || 'Save failed');
      const data = await res.json(); const newId = data?.id ?? form.id;
      setEditingNew(false); onSelected?.(newId); onChange?.(recordToDto(form, newId)); setStatusMessage('Customer saved.'); setTimeout(() => setStatusMessage(''), 2500);
    } catch (e: any) { setSaveError(e.message || 'Save failed'); } finally { setSaving(false); }
  }

  const containerClass = 'customer-lookup' + (editingNew ? ' is-editing-new' : '');
  const canAddFromScan = !!lastScanData && results.length === 0;

  return (
    <div className={containerClass}>
      <form onSubmit={(e) => search(e)} aria-label="Customer search / create">
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
        results={results}
        loading={loading}
        error={error}
        fromScan={searchFromScan}
        canAddFromScan={canAddFromScan}
        onSelect={(id, rec) => { onSelected?.(id); setForm(rec); onChange?.(recordToDto(rec, id)); setSearchModalOpen(false); }}
        onAddFromScan={handleAddFromScan}
        onClose={() => setSearchModalOpen(false)}
      />

      <CustomerIdScanModal
        open={scanModalOpen}
        onClose={() => setScanModalOpen(false)}
        onScanned={(data: AamvaData) => applyAamva(data)}
      />
    </div>
  );
}
