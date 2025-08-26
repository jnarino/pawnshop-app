import { useCallback, useId, useState, useMemo } from 'react';

import { AamvaData } from '../../../shared/hooks/useIdScan';
import React from 'react';
import { CustomerIdScanModal } from './CustomerIdScanModal';
import './CustomerIdScanModal.css';

// --- Types -----------------------------------------------------------------
interface CustomerRecord {
  id?: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  dateOfBirth?: string;
  sex?: string;
  height?: string; // stored as 5'11"
  streetAddress?: string;
  city?: string;
  stateUs?: string;
  zipcode?: string;
  phone?: string;
  email?: string;
  hairColor?: string;
  eyeColor?: string;
  race?: string;
  country?: string;
  weight?: string;
  ssNumber?: string;
  idNumber?: string;
  issueDate?: string;
  expirationDate?: string;
  issuingState?: string;
}

interface Props {
  onSelected(id: string): void;
  onCreateNew(id: string): void;
}
// --- Constants (extracted to avoid re-creation each render) ---------------
const EYE_COLORS = ['Brown', 'Blue', 'Green', 'Hazel', 'Gray', 'Amber', 'Black'] as const;
const HAIR_COLORS = ['Brown', 'Black', 'Blonde', 'Red', 'Gray', 'White', 'Bald', 'Auburn'] as const;
const RACES = [
  'White',
  'Black or African American',
  'Asian',
  'Native American',
  'Pacific Islander',
  'Hispanic',
  'Other',
] as const;
const COUNTRIES = ['United States', 'Canada', 'Mexico', 'United Kingdom', 'China', 'India', 'Brazil'] as const;
const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
] as const;

// --- Utilities -------------------------------------------------------------
function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 10);
  if (!digits) return '';
  const p1 = digits.slice(0, 3);
  const p2 = digits.slice(3, 6);
  const p3 = digits.slice(6);
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

function mapApiCustomer(c: any): CustomerRecord {
  return {
    id: c.id,
    firstName: c.firstName ?? c.first_name,
    middleName: c.middleName ?? c.middle_name ?? undefined,
    lastName: c.lastName ?? c.last_name,
    dateOfBirth: c.dateOfBirth ?? c.date_of_birth,
    sex: c.sex,
    height: c.height,
    streetAddress: c.streetAddress ?? c.street_address,
    city: c.city,
    stateUs: c.stateUs ?? c.state_us,
    zipcode: c.zipcode ?? c.zip_code,
    phone: c.phone ?? c.phone_number,
    email: c.email,
    hairColor: c.hairColor ?? c.hair_color,
    eyeColor: c.eyeColor ?? c.eye_color,
    race: c.race,
    country: c.country,
    weight: c.weight,
    ssNumber: c.ssNumber ?? c.ss_number,
    idNumber: c.idNumber ?? c.id_number,
    issueDate: c.issueDate ?? c.id_issue_date,
    expirationDate: c.expirationDate ?? c.id_expiration,
    issuingState: c.issuing_state ?? c.issuingState,
  };
}

// --- Sub Components --------------------------------------------------------
interface SectionProps { form: CustomerRecord; update<K extends keyof CustomerRecord>(k: K, v: CustomerRecord[K]): void; editing: boolean; }

const IdentityContactSection = ({ form, update, editing }: SectionProps) => (
  <fieldset className="customer-identity">
    <legend>Identity & Contact</legend>
    <div className="grid cols-4 gap" style={{ display: 'grid', gridTemplateColumns: '1fr 120px 1fr 1fr', gap: 10 }}>
      <label>First Name
        <input value={form.firstName} onChange={e => update('firstName', e.target.value)} placeholder="First" />
      </label>
      <label>Middle
        <input value={form.middleName || ''} onChange={e => update('middleName', e.target.value)} placeholder="M" />
      </label>
      <label>Last Name *
        <input value={form.lastName} onChange={e => update('lastName', e.target.value)} placeholder="Last" />
      </label>
      <label>Date of Birth
        <input type="date" value={form.dateOfBirth || ''} onChange={e => update('dateOfBirth', e.target.value || undefined)} />
      </label>
      <label>Phone
        <input value={form.phone || ''} onChange={e => update('phone', formatPhone(e.target.value))} disabled={!editing} placeholder="(555) 123-4567" />
      </label>
      <label>Email
        <input value={form.email || ''} onChange={e => update('email', e.target.value)} disabled={!editing} />
      </label>
    </div>
  </fieldset>
);

const AddressSection = ({ form, update, editing }: SectionProps) => (
  <fieldset className="top-margin">
    <legend>Address</legend>
    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 120px 120px', gap: 10 }}>
      <label>Street Address
        <input value={form.streetAddress || ''} onChange={e => update('streetAddress', e.target.value)} disabled={!editing} />
      </label>
      <label>City
        <input value={form.city || ''} onChange={e => update('city', e.target.value)} disabled={!editing} />
      </label>
      <label>State
        <select value={form.stateUs || ''} onChange={e => update('stateUs', e.target.value)} disabled={!editing}>
          <option value="" />
          {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </label>
      <label>Zip
        <input value={form.zipcode || ''} onChange={e => update('zipcode', e.target.value)} disabled={!editing} />
      </label>
    </div>
  </fieldset>
);

const GovernmentIdSection = ({ form, update, editing }: SectionProps) => (
  <fieldset className="top-margin">
    <legend>Government ID</legend>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 120px 1fr 1fr', gap: 10 }}>
      <label>ID Number
        <input value={form.idNumber || ''} onChange={e => update('idNumber', e.target.value)} disabled={!editing} />
      </label>
      <label>SS Number
        <input value={form.ssNumber || ''} onChange={e => update('ssNumber', e.target.value)} disabled={!editing} />
      </label>
      <label>Issuing State
        <select value={form.issuingState || ''} onChange={e => update('issuingState', e.target.value)} disabled={!editing}>
          <option value="" />
          {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </label>
      <label>ID Issue Date
        <input type="date" value={form.issueDate || ''} onChange={e => update('issueDate', e.target.value)} disabled={!editing} />
      </label>
      <label>ID Expiration
        <input type="date" value={form.expirationDate || ''} onChange={e => update('expirationDate', e.target.value)} disabled={!editing} />
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
          <option value="">--</option>
          <option value="M">M</option>
          <option value="F">F</option>
          <option value="O">Other</option>
        </select>
      </label>
      <label>Height
        <div style={{ display: 'flex', gap: 4 }}>
          <input style={{ width: 50 }} disabled={!editing} value={heightFeet} placeholder="ft" onChange={e => setHeight(e.target.value, heightInches)} />
          <input style={{ width: 50 }} disabled={!editing} value={heightInches} placeholder="in" onChange={e => setHeight(heightFeet, e.target.value)} />
        </div>
      </label>
      <label>Weight
        <input value={form.weight || ''} onChange={e => update('weight', e.target.value)} disabled={!editing} placeholder="lbs" />
      </label>
      <label>Hair Color
        <input list="hairColors" value={form.hairColor || ''} onChange={e => update('hairColor', e.target.value)} disabled={!editing} />
      </label>
      <label>Eye Color
        <input list="eyeColors" value={form.eyeColor || ''} onChange={e => update('eyeColor', e.target.value)} disabled={!editing} />
      </label>
      <label>Race
        <input list="races" value={form.race || ''} onChange={e => update('race', e.target.value)} disabled={!editing} />
      </label>
      <label>Country
        <input list="countries" value={form.country || ''} onChange={e => update('country', e.target.value)} disabled={!editing} />
      </label>
    </div>
  </fieldset>
);

interface ResultsProps { results: CustomerRecord[]; loading: boolean; error: string | null; onPick(id: string, record: CustomerRecord): void; }
const ResultsTable = ({ results, loading, error, onPick }: ResultsProps) => (
  <aside className="customer-lookup__results" aria-live="polite">
    <div className="results-header" style={{ fontWeight: 600, marginBottom: 6 }}>Matches ({results.length})</div>
    {error && <div className="error" style={{ marginBottom: 6 }}>{error}</div>}
    <div className="results-table-wrapper" style={{ maxHeight: 420, overflow: 'auto', border: '1px solid #ddd', borderRadius: 6 }}>
      <table className="results-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead style={{ position: 'sticky', top: 0, background: '#fafafa' }}>
          <tr>
            <th style={thStyle}>Name</th>
            <th style={thStyle}>DOB</th>
            <th style={thStyle}>City</th>
            <th style={thStyle}>State</th>
            <th style={thStyle}>Phone</th>
          </tr>
        </thead>
        <tbody>
          {results.map(r => (
            <tr key={r.id} onDoubleClick={() => r.id && onPick(r.id, r)} className={r.id ? 'can-select' : ''}>
              <td style={tdStyle}>{r.lastName}, {r.firstName}</td>
              <td style={tdStyle}>{r.dateOfBirth || ''}</td>
              <td style={tdStyle}>{r.city || ''}</td>
              <td style={tdStyle}>{r.stateUs || ''}</td>
              <td style={tdStyle}>{r.phone || ''}</td>
            </tr>
          ))}
          {results.length === 0 && !loading && (
            <tr>
              <td colSpan={5} style={{ textAlign: 'center', fontStyle: 'italic', padding: 16 }}>No results</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
    <p className="hint" style={{ marginTop: 6, color: '#666' }}>Double-click a row to load it into the form.</p>
  </aside>
);

// Shared cell styles (avoid magic duplication)
const thStyle: React.CSSProperties = { textAlign: 'left', padding: 8, borderBottom: '1px solid #eee' };
const tdStyle: React.CSSProperties = { padding: 8, borderBottom: '1px solid #f2f2f2' };

// --- Main Component --------------------------------------------------------
export default function CustomerPicker({ onSelected, onCreateNew }: Props) {
  const [form, setForm] = useState<CustomerRecord>({ firstName: '', lastName: '', dateOfBirth: undefined, sex: '' });
  const [results, setResults] = useState<CustomerRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingNew, setEditingNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [scanModalOpen, setScanModalOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>('');

  const disableSearch = !form.firstName && !form.lastName && !form.dateOfBirth;
  const { feet: heightFeet, inches: heightInches } = useMemo(() => deriveHeightParts(form.height), [form.height]);

  function update<K extends keyof CustomerRecord>(k: K, v: CustomerRecord[K]) {
    setForm(prev => ({ ...prev, [k]: v }));
  }

  const applyAamva = React.useCallback((d: AamvaData) => {
    setForm(f => ({
      ...f,
      firstName: d.firstName ?? f.firstName,
      middleName: d.middleName ?? f.middleName,
      lastName: d.lastName ?? f.lastName,
      dateOfBirth: d.dateOfBirth ?? f.dateOfBirth,
      issueDate: d.issueDate ?? f.issueDate,
      expirationDate: d.expirationDate ?? f.expirationDate,
      streetAddress: d.streetAddress ?? f.streetAddress,
      city: d.city ?? f.city,
      stateUs: d.stateUs ?? f.stateUs,
      zipcode: d.zipcode ?? f.zipcode,
      sex: d.sex ?? f.sex,
      height: d.height ?? f.height,
      idNumber: d.idNumber ?? f.idNumber,
      country: d.country ?? f.country,
      weight: d.weight ?? f.weight,
    }));
  }, []);

  async function search(e?: React.FormEvent) {
    e?.preventDefault();
    if (disableSearch) return; // nothing to search
    setError(null);
    setLoading(true);
    setResults([]);
    try {
      const params = new URLSearchParams();
      if (form.firstName) params.append('firstName', form.firstName.trim());
      if (form.lastName) params.append('lastName', form.lastName.trim());
      if (form.dateOfBirth) params.append('dateOfBirth', form.dateOfBirth);
      params.append('limit', '100');
      const res = await fetch(`http://localhost:3000/api/customer?${params.toString()}`, { credentials: 'include' });
      const data = await res.json();
      setResults((data || []).map(mapApiCustomer));
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
      const payload = { ...form } as any; // backend contract (kept flat)
      delete payload.id;
      const res = await fetch('http://localhost:3000/api/customer', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(payload)
      });
      if (!res.ok) {
        throw new Error((await res.text()) || 'Save failed');
      }
      const data = await res.json();
      if (!data?.id) throw new Error('Missing id in response');
      setEditingNew(false);
      onSelected(data.id);
    } catch (e: any) {
      setSaveError(e.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  function setHeight(feet: string, inches: string) {
    update('height', normalizeHeight(feet, inches));
  }

  const layoutColumns = editingNew ? '1fr' : '1fr 420px'; // when creating new, form covers matches region

  return (
    <div className="customer-lookup" style={{ display: 'grid', gridTemplateColumns: layoutColumns, gap: 16 }}>
      <form onSubmit={search} aria-label="Customer search / create">
        <IdentityContactSection form={form} update={update} editing={editingNew} />
        <AddressSection form={form} update={update} editing={editingNew} />
        <GovernmentIdSection form={form} update={update} editing={editingNew} />
        <PhysicalTraitsSection form={form} update={update} editing={editingNew} setHeight={setHeight} heightFeet={heightFeet} heightInches={heightInches} />

        <div className="actions-row" style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          {!editingNew && (
            <>
              <button type="submit" disabled={disableSearch || loading}>{loading ? 'Searching…' : 'Find'}</button>
              <button type="button" onClick={clearAll} disabled={loading}>Clear</button>
              <button type="button" onClick={() => { setEditingNew(true); setResults([]); onCreateNew(crypto.randomUUID()); }} disabled={loading}>Add New</button>
            </>
          )}
          {editingNew && (
            <>
              <button type="button" onClick={saveNew} disabled={saving}>{saving ? 'Saving…' : 'Save Customer'}</button>
              <button type="button" onClick={clearAll} disabled={saving}>Cancel</button>
            </>
          )}
          {editingNew && (
            <button type="button" onClick={() => setScanModalOpen(true)}>
              Scan ID
            </button>
          )}
        </div>
        {saveError && <div className="error" role="alert" style={{ marginTop: 8 }}>{saveError}</div>}
        {statusMessage && <div className="cp-status">{statusMessage}</div>}

        {/* Datalists */}
        <datalist id="eyeColors">{EYE_COLORS.map(c => <option key={c} value={c} />)}</datalist>
        <datalist id="hairColors">{HAIR_COLORS.map(c => <option key={c} value={c} />)}</datalist>
        <datalist id="races">{RACES.map(c => <option key={c} value={c} />)}</datalist>
        <datalist id="countries">{COUNTRIES.map(c => <option key={c} value={c} />)}</datalist>
      </form>
      {!editingNew && (
        <ResultsTable results={results} loading={loading} error={error} onPick={(id, rec) => { onSelected(id); setForm(rec); }} />
      )}
      <CustomerIdScanModal
        open={scanModalOpen}
        onClose={() => setScanModalOpen(false)}
        onScanned={(data: AamvaData) => applyAamva(data)}
      />
    </div>
  );
}
