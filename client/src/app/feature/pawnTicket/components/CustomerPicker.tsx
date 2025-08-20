import { useState } from 'react';

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

interface Props { onSelected(id: string): void; onCreateNew(id: string): void; }

export default function CustomerPicker({ onSelected, onCreateNew }: Props) {
  const [form, setForm] = useState<CustomerRecord>({ firstName: '', lastName: '', dateOfBirth: undefined, sex: '' });
  const [results, setResults] = useState<CustomerRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingNew, setEditingNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  function update<K extends keyof CustomerRecord>(k: K, v: CustomerRecord[K]) { setForm(f => ({ ...f, [k]: v })); }

  async function search(e?: React.FormEvent) {
    e?.preventDefault();
    setError(null); setLoading(true); setResults([]);
    try {
      const params = new URLSearchParams();
      if (form.firstName) params.append('firstName', form.firstName.trim());
      if (form.lastName) params.append('lastName', form.lastName.trim());
      if (form.dateOfBirth) params.append('dateOfBirth', form.dateOfBirth);
      params.append('limit', '100');
      const res = await fetch(`http://localhost:3000/api/customer?${params.toString()}`, { credentials: 'include' });
      const data = await res.json();
      const mapped: CustomerRecord[] = (data || []).map((c: any) => ({
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
        issuingState: c.issuingState ?? c.issuing_state,
      }));
      setResults(mapped);
    } catch (err: any) {
      setError(err.message || 'Search failed');
    } finally { setLoading(false); }
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
    // Basic client-side validation
    if (!form.firstName.trim() || !form.lastName.trim() || !form.dateOfBirth) {
      setSaveError('First, Last, and Date of Birth are required');
      return;
    }
    try {
      setSaving(true);
      const payload: any = { ...form };
      // Remove id if any (shouldn't be set yet)
      delete payload.id;
      const res = await fetch('http://localhost:3000/api/customer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || 'Save failed');
      }
      const data = await res.json();
      if (data?.id) {
        setEditingNew(false);
        onSelected(data.id); // parent will advance flow
      } else {
        throw new Error('Missing id in response');
      }
    } catch (e: any) {
      setSaveError(e.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  const disableSearch = !form.firstName && !form.lastName && !form.dateOfBirth;

  // Option lists
  const eyeColors = ['Brown', 'Blue', 'Green', 'Hazel', 'Gray', 'Amber', 'Black'];
  const hairColors = ['Brown', 'Black', 'Blonde', 'Red', 'Gray', 'White', 'Bald', 'Auburn'];
  const races = ['White', 'Black or African American', 'Asian', 'Native American', 'Pacific Islander', 'Hispanic', 'Other'];
  const countries = ['United States', 'Canada', 'Mexico', 'United Kingdom', 'China', 'India', 'Brazil'];
  const statesUS = ['AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'];

  // Phone formatting (digits to (XXX) XXX-XXXX)
  function formatPhone(raw: string) {
    const digits = raw.replace(/\D/g, '').slice(0, 10);
    if (!digits) return '';
    const p1 = digits.slice(0, 3);
    const p2 = digits.slice(3, 6);
    const p3 = digits.slice(6);
    if (digits.length <= 3) return `(${p1}`;
    if (digits.length <= 6) return `(${p1}) ${p2}`;
    return `(${p1}) ${p2}-${p3}`;
  }
  function onPhoneChange(v: string) {
    update('phone', formatPhone(v));
  }

  // Height formatting - separate feet & inches inputs for clarity
  const heightFeet = (() => { const m = form.height?.match(/(\d+)'/); return m ? m[1] : ''; })();
  const heightInches = (() => { const m = form.height?.match(/'(\d{1,2})"?/); return m ? m[1] : ''; })();
  function setHeight(feet: string, inches: string) {
    const f = feet.replace(/\D/g, '').slice(0, 2);
    const i = inches.replace(/\D/g, '').slice(0, 2);
    if (!f && !i) update('height', undefined);
    else update('height', `${f || '0'}'${i || '0'}"`);
  }

  return (
    <div className="customer-lookup">
      <form onSubmit={search} className="customer-lookup__form" aria-label="Customer search / create">
        <fieldset className="customer-lookup__fieldset">
          <legend>Customer Information</legend>
          {/* Identity */}
          <div className="grid cols-4 gap">
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
            <label>Sex
              <select value={form.sex || ''} onChange={e => update('sex', e.target.value || undefined)} disabled={!editingNew}>
                <option value="">--</option>
                <option value="M">M</option>
                <option value="F">F</option>
                <option value="O">Other</option>
              </select>
            </label>
            <label>Height
              <div style={{ display: 'flex', gap: 4 }}>
                <input style={{ width: 50 }} disabled={!editingNew} value={heightFeet} placeholder="ft" onChange={e => setHeight(e.target.value, heightInches)} />
                <input style={{ width: 50 }} disabled={!editingNew} value={heightInches} placeholder="in" onChange={e => setHeight(heightFeet, e.target.value)} />
              </div>
            </label>
            <label>Weight
              <input value={form.weight || ''} onChange={e => update('weight', e.target.value)} disabled={!editingNew} placeholder="lbs" />
            </label>
          </div>
          {/* Physical & Demographic */}
          <div className="grid cols-3 gap top-margin">
            <label>Hair Color
              <input list="hairColors" value={form.hairColor || ''} onChange={e => update('hairColor', e.target.value)} disabled={!editingNew} />
            </label>
            <label>Eye Color
              <input list="eyeColors" value={form.eyeColor || ''} onChange={e => update('eyeColor', e.target.value)} disabled={!editingNew} />
            </label>
            <label>Race
              <input list="races" value={form.race || ''} onChange={e => update('race', e.target.value)} disabled={!editingNew} />
            </label>
            <label>Phone
              <input value={form.phone || ''} onChange={e => onPhoneChange(e.target.value)} disabled={!editingNew} placeholder="(555) 123-4567" />
            </label>
            <label>Email
              <input value={form.email || ''} onChange={e => update('email', e.target.value)} disabled={!editingNew} />
            </label>
            <label>Country
              <input list="countries" value={form.country || ''} onChange={e => update('country', e.target.value)} disabled={!editingNew} />
            </label>
          </div>
          {/* Address */}
          <div className="grid cols-3 gap top-margin">
            <label>Street Address
              <input value={form.streetAddress || ''} onChange={e => update('streetAddress', e.target.value)} disabled={!editingNew} />
            </label>
            <label>City
              <input value={form.city || ''} onChange={e => update('city', e.target.value)} disabled={!editingNew} />
            </label>
            <label>State
              <select value={form.stateUs || ''} onChange={e => update('stateUs', e.target.value)} disabled={!editingNew}>
                <option value=""></option>
                {statesUS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </label>
            <label>Zip
              <input value={form.zipcode || ''} onChange={e => update('zipcode', e.target.value)} disabled={!editingNew} />
            </label>
          </div>
          {/* Identification */}
          <div className="grid cols-3 gap top-margin">
            <label>ID Number
              <input value={form.idNumber || ''} onChange={e => update('idNumber', e.target.value)} disabled={!editingNew} />
            </label>
            <label>SS Number
              <input value={form.ssNumber || ''} onChange={e => update('ssNumber', e.target.value)} disabled={!editingNew} />
            </label>
            <label>Issuing State
              <select value={form.issuingState || ''} onChange={e => update('issuingState', e.target.value)} disabled={!editingNew}>
                <option value=""></option>
                {statesUS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </label>
            <label>ID Issue Date
              <input type="date" value={form.issueDate || ''} onChange={e => update('issueDate', e.target.value)} disabled={!editingNew} />
            </label>
            <label>ID Expiration
              <input type="date" value={form.expirationDate || ''} onChange={e => update('expirationDate', e.target.value)} disabled={!editingNew} />
            </label>
          </div>
          <div className="actions-row">
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
          </div>
          {saveError && <div className="error" role="alert">{saveError}</div>}
          {/* Datalists for suggestions */}
          <datalist id="eyeColors">{eyeColors.map(c => <option key={c} value={c} />)}</datalist>
          <datalist id="hairColors">{hairColors.map(c => <option key={c} value={c} />)}</datalist>
          <datalist id="races">{races.map(c => <option key={c} value={c} />)}</datalist>
          <datalist id="countries">{countries.map(c => <option key={c} value={c} />)}</datalist>
        </fieldset>
      </form>
      <div className="customer-lookup__results">
        <div className="results-header">Matches ({results.length})</div>
        {error && <div className="error">{error}</div>}
        <table className="results-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>DOB</th>
              <th>City</th>
              <th>State</th>
              <th>Phone</th>
            </tr>
          </thead>
          <tbody>
            {results.map(r => (
              <tr key={r.id} onDoubleClick={() => { if (r.id) { onSelected(r.id); setForm(r); } }} className={r.id ? 'can-select' : ''}>
                <td>{r.lastName}, {r.firstName}</td>
                <td>{r.dateOfBirth || ''}</td>
                <td>{r.city || ''}</td>
                <td>{r.stateUs || ''}</td>
                <td>{r.phone || ''}</td>
              </tr>
            ))}
            {results.length === 0 && !loading && <tr><td colSpan={5} style={{ textAlign: 'center', fontStyle: 'italic' }}>No results</td></tr>}
          </tbody>
        </table>
        <p className="hint">Double‑click a row to load it into the form.</p>
      </div>
    </div>
  );
}
