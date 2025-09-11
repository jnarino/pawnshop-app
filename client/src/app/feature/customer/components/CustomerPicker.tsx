import { useMemo, useState } from 'react';
import React from 'react';
import { AamvaData } from '../../../shared/hooks/useIdScan';
import './CustomerIdScanModal.css';
import { CustomerIdScanModal } from './CustomerIdScanModal';
import type { Customer as CustomerDto } from '../types';
import { CustomerRecord, dtoToRecord, recordToDto, apiToRecordLoose } from '../mappers';
import './CustomerPicker.css'; // add this line

// --- Props -----------------------------------------------------------------
interface Props {
  value?: CustomerDto | null;
  onChange?: (c: CustomerDto | null) => void;
  onCreateNew?(tempId: string): void;      // optional
  onSelected?(id: string): void;            // optional (back-compat)
}

// --- Constants -------------------------------------------------------------
const EYE_COLORS = ['Brown', 'Blue', 'Green', 'Hazel', 'Gray', 'Amber', 'Black'] as const;
const HAIR_COLORS = ['Brown', 'Black', 'Blonde', 'Red', 'Gray', 'White', 'Bald', 'Auburn'] as const;
const RACES = ['White', 'Black or African American', 'Asian', 'Native American', 'Pacific Islander', 'Hispanic', 'Other'] as const;
const US_STATES = ['AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'] as const;

// --- Utilities -------------------------------------------------------------
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

// --- Sub Components --------------------------------------------------------
interface SectionProps { form: CustomerRecord; update<K extends keyof CustomerRecord>(k: K, v: CustomerRecord[K]): void; editing: boolean; }
const IdentityContactSection = ({ form, update, editing }: SectionProps) => (
  <fieldset className="customer-identity">
    <legend>Identity & Contact</legend>
    <div className="grid cols-4 gap" style={{ display: 'grid', gridTemplateColumns: '1fr 120px 1fr 1fr', gap: 10 }}>
      <label>First Name <input value={form.firstName} onChange={e => update('firstName', e.target.value)} placeholder="First" /></label>
      <label>Middle <input value={form.middleName || ''} onChange={e => update('middleName', e.target.value)} placeholder="M" /></label>
      <label>Last Name * <input value={form.lastName} onChange={e => update('lastName', e.target.value)} placeholder="Last" /></label>
      <label>Date of Birth <input type="date" value={form.dateOfBirth || ''} onChange={e => update('dateOfBirth', e.target.value || undefined)} /></label>
      <label>Phone <input value={form.phoneNumber || ''} onChange={e => update('phoneNumber', formatPhone(e.target.value))} disabled={!editing} placeholder="(555) 123-4567" /></label>
      <label>Email <input value={form.email || ''} onChange={e => update('email', e.target.value)} disabled={!editing} /></label>
    </div>
  </fieldset>
);
const AddressSection = ({ form, update, editing }: SectionProps) => (
  <fieldset className="top-margin">
    <legend>Address</legend>
    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 120px 120px', gap: 10 }}>
      <label>Street Address <input value={form.streetAddress || ''} onChange={e => update('streetAddress', e.target.value)} disabled={!editing} /></label>
      <label>City <input value={form.city || ''} onChange={e => update('city', e.target.value)} disabled={!editing} /></label>
      <label>State
        <select value={form.stateUs || ''} onChange={e => update('stateUs', e.target.value)} disabled={!editing}>
          <option value="" />
          {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </label>
      <label>Zip <input value={form.zipCode || ''} onChange={e => update('zipCode', e.target.value)} disabled={!editing} /></label>
    </div>
  </fieldset>
);
const GovernmentIdSection = ({ form, update, editing }: SectionProps) => (
  <fieldset className="top-margin">
    <legend>Government ID</legend>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 120px 1fr 1fr', gap: 10 }}>
      <label>ID Number
        {/* Allow entering ID Number for search even when not editing */}
        <input value={form.idNumber || ''} onChange={e => update('idNumber', e.target.value)} />
      </label>
      <label>SS Number
        <input value={form.ssNumber || ''} onChange={e => update('ssNumber', e.target.value)} disabled={!editing} />
      </label>
      <label>Issuing State
        <select value={form.idState || ''} onChange={e => update('idState', e.target.value)} disabled={!editing}>
          <option value="" />
          {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </label>
      <label>ID Issue Date
        <input type="date" value={form.idIssueDate || ''} onChange={e => update('idIssueDate', e.target.value)} disabled={!editing} />
      </label>
      <label>ID Expiration
        <input type="date" value={form.idExpiration || ''} onChange={e => update('idExpiration', e.target.value)} disabled={!editing} />
      </label>
    </div>
  </fieldset>
);
interface PhysicalProps extends SectionProps { setHeight(feet: string, inches: string): void; heightFeet: string; heightInches: string; }
const PhysicalTraitsSection = ({ form, update, editing, setHeight, heightFeet, heightInches }: PhysicalProps) => (
  <fieldset className="top-margin">
    <legend>Physical Traits</legend>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr', gap: 10 }}>
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
    </div>
  </fieldset>
);

interface ResultsProps { results: CustomerRecord[]; loading: boolean; error: string | null; onPick(id: string, r: CustomerRecord): void; }
const ResultsTable = ({ results, loading, error, onPick }: ResultsProps) => (
  <aside className="customer-lookup__results" aria-live="polite">
    <div className="results-header" style={{ fontWeight: 600, marginBottom: 6 }}>Matches ({results.length})</div>
    {error && <div className="error" style={{ marginBottom: 6 }}>{error}</div>}
    <div className="results-table-wrapper" style={{ maxHeight: 420, overflow: 'auto', border: '1px solid #ddd', borderRadius: 6 }}>
      <table className="results-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead style={{ position: 'sticky', top: 0, background: '#fafafa' }}>
          <tr><th style={thStyle}>Name</th><th style={thStyle}>DOB</th><th style={thStyle}>City</th><th style={thStyle}>State</th><th style={thStyle}>Phone</th></tr>
        </thead>
        <tbody>
          {results.map(r => (
            <tr key={r.id} onDoubleClick={() => r.id && onPick(r.id, r)} className={r.id ? 'can-select' : ''}>
              <td style={tdStyle}>{r.lastName}, {r.firstName}</td>
              <td style={tdStyle}>{r.dateOfBirth || ''}</td>
              <td style={tdStyle}>{r.city || ''}</td>
              <td style={tdStyle}>{r.stateUs || ''}</td>
              <td style={tdStyle}>{r.phoneNumber || ''}</td>
            </tr>
          ))}
          {results.length === 0 && !loading && (
            <tr><td colSpan={5} style={{ textAlign: 'center', fontStyle: 'italic', padding: 16 }}>No results</td></tr>
          )}
        </tbody>
      </table>
    </div>
    <p className="hint" style={{ marginTop: 6, color: '#666' }}>Double-click a row to load it into the form.</p>
  </aside>
);

const thStyle: React.CSSProperties = { textAlign: 'left', padding: 8, borderBottom: '1px solid #eee' };
const tdStyle: React.CSSProperties = { padding: 8, borderBottom: '1px solid #f2f2f2' };

// --- Main Component --------------------------------------------------------
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

  // Keep form in sync with value
  React.useEffect(() => { setForm(dtoToRecord(value ?? null)); }, [value]);

  const disableSearch = !form.firstName && !form.lastName && !form.dateOfBirth && !form.idNumber;
  const { feet: heightFeet, inches: heightInches } = useMemo(() => deriveHeightParts(form.height), [form.height]);

  function update<K extends keyof CustomerRecord>(k: K, v: CustomerRecord[K]) {
    setForm(prev => ({ ...prev, [k]: v }));
  }
  const setHeight = (feet: string, inches: string) => update('height', normalizeHeight(feet, inches));

  // When scanning, update the form and emit to parent so the page sees the new data immediately
  const applyAamva = React.useCallback((d: AamvaData) => {
    setForm(f => {
      const next = {
        ...f,
        firstName: d.firstName ?? f.firstName,
        middleName: d.middleName ?? f.middleName,
        lastName: d.lastName ?? f.lastName,
        dateOfBirth: d.dateOfBirth ?? f.dateOfBirth,
        idIssueDate: d.issueDate ?? f.idIssueDate,
        idExpiration: d.expirationDate ?? f.idExpiration,
        streetAddress: d.streetAddress ?? f.streetAddress,
        city: d.city ?? f.city,
        stateUs: d.stateUs ?? f.stateUs,
        zipCode: d.zipcode ?? f.zipCode,
        sex: d.sex ?? f.sex,
        height: d.height ?? f.height,
        idNumber: d.idNumber ?? f.idNumber,
        weight: d.weight ?? f.weight,
      } as CustomerRecord;
      onChange?.(recordToDto(next, next.id));
      return next;
    });
  }, [onChange]);

  async function search(e?: React.FormEvent) {
    e?.preventDefault();
    if (disableSearch && !form.idNumber) return; // allow search by ID Number too
    setError(null);
    setLoading(true);
    setResults([]);
    try {
      const params = new URLSearchParams();
      if (form.firstName) params.append('firstName', form.firstName.trim());
      if (form.lastName) params.append('lastName', form.lastName.trim());
      if (form.dateOfBirth) params.append('dateOfBirth', form.dateOfBirth);
      if (form.idNumber) params.append('idNumber', form.idNumber.trim());
      params.append('limit', '100');
      const res = await fetch(`http://localhost:3000/api/customer?${params.toString()}`, { credentials: 'include' });
      const data = await res.json();
      setResults((Array.isArray(data) ? data : []).map(apiToRecordLoose));
    } catch (err: any) {
      setError(err.message || 'Search failed');
    } finally {
      setLoading(false);
    }
  }

  function clearAll() {
    setForm({ firstName: '', lastName: '', dateOfBirth: undefined, sex: '' });
    setResults([]);
    setEditingNew(false);
    setSaveError(null);
  }

  async function saveNew() {
    if (saving) return;
    setSaveError(null);
    if (!form.firstName.trim() || !form.lastName.trim() || !form.dateOfBirth) {
      setSaveError('First, Last, and Date of Birth are required');
      return;
    }
    try {
      setSaving(true);
      const payload = { ...form } as any;
      delete payload.id;
      const res = await fetch('http://localhost:3000/api/customer', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error((await res.text()) || 'Save failed');
      const data = await res.json(); // expects { id: string } or full customer
      const newId = data?.id ?? form.id;
      setEditingNew(false);
      onSelected?.(newId);
      onChange?.(recordToDto(form, newId));
    } catch (e: any) {
      setSaveError(e.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  const containerClass = 'customer-lookup' + (editingNew ? ' is-editing-new' : '');

  return (
    <div className={containerClass}>
      <form onSubmit={search} aria-label="Customer search / create">
        <IdentityContactSection form={form} update={update} editing={editingNew} />
        <AddressSection form={form} update={update} editing={editingNew} />
        <GovernmentIdSection form={form} update={update} editing={editingNew} />
        <PhysicalTraitsSection form={form} update={update} editing={editingNew} setHeight={setHeight} heightFeet={heightFeet} heightInches={heightInches} />

        <div className="actions-row">
          {!editingNew && (
            <>
              <button type="submit" disabled={disableSearch || loading}>{loading ? 'Searching…' : 'Find'}</button>
              <button type="button" onClick={clearAll} disabled={loading}>Clear</button>
              <button type="button" onClick={() => { setEditingNew(true); setResults([]); onCreateNew?.(crypto.randomUUID()); }} disabled={loading}>Add New</button>
            </>
          )}
          {editingNew && (
            <>
              <button type="button" onClick={saveNew} disabled={saving}>{saving ? 'Saving…' : 'Save Customer'}</button>
              <button type="button" onClick={clearAll} disabled={saving}>Cancel</button>
              <button type="button" onClick={() => setScanModalOpen(true)}>Scan ID</button>
            </>
          )}
        </div>

        {saveError && <div className="error" role="alert">{saveError}</div>}
        {statusMessage && <div className="cp-status">{statusMessage}</div>}

        <datalist id="eyeColors">{EYE_COLORS.map(c => <option key={c} value={c} />)}</datalist>
        <datalist id="hairColors">{HAIR_COLORS.map(c => <option key={c} value={c} />)}</datalist>
        <datalist id="races">{RACES.map(c => <option key={c} value={c} />)}</datalist>
      </form>

      {!editingNew && (
        <ResultsTable
          results={results}
          loading={loading}
          error={error}
          onPick={(id, rec) => {
            onSelected?.(id);
            setForm(rec);
            onChange?.(recordToDto(rec, id));
          }}
        />
      )}

      <CustomerIdScanModal
        open={scanModalOpen}
        onClose={() => setScanModalOpen(false)}
        onScanned={(data: AamvaData) => applyAamva(data)}
      />
    </div>
  );
}
