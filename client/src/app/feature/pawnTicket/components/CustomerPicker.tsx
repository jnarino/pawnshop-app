import { useEffect, useState } from 'react';

interface CustomerSummary { id: string; firstName: string; lastName: string; phone?: string | null; }

interface Props {
  onSelected(id: string): void;
  onCreateNew(id: string): void;
}

export default function CustomerPicker({ onSelected, onCreateNew }: Props) {
  const [customers, setCustomers] = useState<CustomerSummary[]>([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true); setError(null);
    try {
      const res = await fetch('http://localhost:3000/api/customer?limit=25');
      const data = await res.json();
      // adapt simple mapping (assuming backend returns array of customers with snake_case -> quick map)
      const mapped: CustomerSummary[] = (data || []).map((c: any) => ({ id: c.id, firstName: c.first_name, lastName: c.last_name, phone: c.phone_number }));
      setCustomers(mapped);
    } catch (e: any) { setError(e.message || 'Load failed'); }
    finally { setLoading(false); }
  }

  const filtered = q ? customers.filter(c => (c.firstName + ' ' + c.lastName).toLowerCase().includes(q.toLowerCase())) : customers;

  return (
    <div className="customer-picker">
      <h2>Select Customer</h2>
      <div className="customer-picker__search">
        <input placeholder="Search customer" value={q} onChange={e=>setQ(e.target.value)} />
        <button type="button" onClick={load} disabled={loading}>{loading ? '…' : 'Reload'}</button>
        <button type="button" onClick={() => {/* open create modal placeholder */ const tempId = crypto.randomUUID(); onCreateNew(tempId); }}>New Customer</button>
      </div>
      {error && <div className="error">{error}</div>}
      <ul className="customer-picker__list">
        {filtered.map(c => (
          <li key={c.id}>
            <button type="button" onClick={() => onSelected(c.id)}>{c.firstName} {c.lastName}{c.phone ? ' ('+c.phone+')' : ''}</button>
          </li>
        ))}
        {filtered.length === 0 && !loading && <li>No matches</li>}
      </ul>
    </div>
  );
}
