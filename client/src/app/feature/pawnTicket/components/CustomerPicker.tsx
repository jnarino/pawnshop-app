import { useState } from 'react';

interface CustomerRecord {
  id?: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  dateOfBirth?: string;
  streetAddress?: string;
  city?: string;
  stateUs?: string;
  zipcode?: string;
  phone?: string;
  email?: string;
}

interface Props { onSelected(id: string): void; onCreateNew(id: string): void; }

export default function CustomerPicker({ onSelected, onCreateNew }: Props) {
  const [form, setForm] = useState<CustomerRecord>({ firstName: '', lastName: '', dateOfBirth: undefined });
  const [results, setResults] = useState<CustomerRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof CustomerRecord>(k: K, v: CustomerRecord[K]) { setForm(f => ({ ...f, [k]: v })); }

  async function search(e?: React.FormEvent) {
    e?.preventDefault();
    setError(null); setLoading(true); setResults([]);
    try {
      // For now we fetch all (limit 100) then filter client-side since backend lacks search params yet.
      const res = await fetch('http://localhost:3000/api/customer?limit=100', { credentials: 'include' });
      const data = await res.json();
      const mapped: CustomerRecord[] = (data || []).map((c: any) => ({
        id: c.id,
        firstName: c.firstName ?? c.first_name,
        middleName: c.middleName ?? c.middle_name ?? undefined,
        lastName: c.lastName ?? c.last_name,
        dateOfBirth: c.dateOfBirth ?? c.date_of_birth,
        streetAddress: c.streetAddress ?? c.street_address,
        city: c.city,
        stateUs: c.stateUs ?? c.state_us,
        zipcode: c.zipcode ?? c.zip_code,
        phone: c.phone ?? c.phone_number,
        email: c.email,
      }));
      const lf = form.firstName.trim().toLowerCase();
      const ll = form.lastName.trim().toLowerCase();
      const dob = (form.dateOfBirth || '').trim();
      const filtered = mapped.filter(m => {
        if (lf && !m.firstName.toLowerCase().startsWith(lf)) return false;
        if (ll && !m.lastName.toLowerCase().startsWith(ll)) return false;
        if (dob && m.dateOfBirth !== dob) return false;
        return true;
      });
      setResults(filtered);
    } catch (err: any) {
      setError(err.message || 'Search failed');
    } finally { setLoading(false); }
  }

  function clearAll() {
    setForm({ firstName: '', lastName: '', dateOfBirth: undefined });
    setResults([]);
  }

  const disableSearch = !form.firstName && !form.lastName && !form.dateOfBirth;

  return (
    <div className="customer-lookup">
      <form onSubmit={search} className="customer-lookup__form" aria-label="Customer search / create">
        <fieldset className="customer-lookup__fieldset">
          <legend>Customer Information</legend>
          <div className="grid cols-4 gap">
            <label>First Name
              <input value={form.firstName} onChange={e=>update('firstName', e.target.value)} placeholder="First" />
            </label>
            <label>Middle
              <input value={form.middleName||''} onChange={e=>update('middleName', e.target.value)} placeholder="M" />
            </label>
            <label>Last Name *
              <input value={form.lastName} onChange={e=>update('lastName', e.target.value)} placeholder="Last" />
            </label>
            <label>Date of Birth
              <input type="date" value={form.dateOfBirth||''} onChange={e=>update('dateOfBirth', e.target.value||undefined)} />
            </label>
          </div>
          <div className="grid cols-3 gap top-margin">
            <label>Street Address
              <input value={form.streetAddress||''} onChange={e=>update('streetAddress', e.target.value)} disabled />
            </label>
            <label>City
              <input value={form.city||''} onChange={e=>update('city', e.target.value)} disabled />
            </label>
            <label>State
              <input value={form.stateUs||''} onChange={e=>update('stateUs', e.target.value)} disabled />
            </label>
            <label>Zip
              <input value={form.zipcode||''} onChange={e=>update('zipcode', e.target.value)} disabled />
            </label>
            <label>Phone
              <input value={form.phone||''} onChange={e=>update('phone', e.target.value)} disabled />
            </label>
            <label>Email
              <input value={form.email||''} onChange={e=>update('email', e.target.value)} disabled />
            </label>
          </div>
          <div className="actions-row">
            <button type="submit" disabled={disableSearch || loading}>{loading ? 'Searching…' : 'Find'}</button>
            <button type="button" onClick={clearAll} disabled={loading}>Clear</button>
            <button type="button" onClick={() => { const id = crypto.randomUUID(); onCreateNew(id); }} disabled={loading}>Add New</button>
          </div>
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
              <tr key={r.id} onDoubleClick={() => r.id && onSelected(r.id)} className={r.id ? 'can-select' : ''}>
                <td>{r.lastName}, {r.firstName}</td>
                <td>{r.dateOfBirth || ''}</td>
                <td>{r.city || ''}</td>
                <td>{r.stateUs || ''}</td>
                <td>{r.phone || ''}</td>
              </tr>
            ))}
            {results.length === 0 && !loading && <tr><td colSpan={5} style={{ textAlign:'center', fontStyle:'italic' }}>No results</td></tr>}
          </tbody>
        </table>
        <p className="hint">Double‑click a row to load it into the form.</p>
      </div>
    </div>
  );
}
