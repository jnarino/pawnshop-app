import { useState } from 'react';

interface Props {
  customerId: string;
  onBack(): void;
}

export default function PawnTicketForm({ customerId, onBack }: Props) {
  const [type, setType] = useState<'PAWN' | 'PURCHASE'>('PAWN');
  const [amountFinanced, setAmountFinanced] = useState('');
  const [periodicRate, setPeriodicRate] = useState('0.25');
  const [controlNumber, setControlNumber] = useState('');
  const [items, setItems] = useState<Array<{ categoryId: string; description: string; amount?: string }>>([
    { categoryId: '', description: '' }
  ]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdId, setCreatedId] = useState<string | null>(null);

  function updateItem(i: number, patch: Partial<{ categoryId: string; description: string; amount?: string }>) {
    setItems(prev => prev.map((it, idx) => idx === i ? { ...it, ...patch } : it));
  }
  function addItem() { setItems(prev => [...prev, { categoryId: '', description: '' }]); }
  function removeItem(i: number) { setItems(prev => prev.filter((_,idx)=>idx!==i)); }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null); setSaving(true); setCreatedId(null);
    try {
      const newInventoryItems = items.map((it, idx) => ({
        categoryId: it.categoryId,
        itemDescription: it.description,
        amount: it.amount ? Number(it.amount) : undefined,
        attributes: {},
      }));
      const body: any = {
        type,
        customerId,
        controlNumber: controlNumber || undefined,
        newInventoryItems,
      };
      if (type === 'PAWN') {
        body.amountFinanced = Number(amountFinanced);
        body.periodicRate = Number(periodicRate);
      }
      const res = await fetch('http://localhost:3000/api/pawnTicket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body)
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || 'Failed');
      }
      const data = await res.json();
      setCreatedId(data.id);
      // simple reset
      // setItems([{ categoryId: '', description: '' }]);
    } catch (e:any) { setError(e.message || 'Save failed'); }
    finally { setSaving(false); }
  }

  return (
    <div className="pawn-ticket-form">
      <button type="button" onClick={onBack}>← Back</button>
      <h2>Pawn Ticket Details</h2>
      <form onSubmit={submit}>
        <div className="row"><label>Type
          <select value={type} onChange={e=>setType(e.target.value as any)}>
            <option value="PAWN">Pawn</option>
            <option value="PURCHASE">Purchase</option>
          </select>
        </label></div>
        <div className="row"><label>Control #
          <input value={controlNumber} onChange={e=>setControlNumber(e.target.value)} placeholder="e.g. 1000" />
        </label></div>
        {type === 'PAWN' && <>
          <div className="row"><label>Amount Financed
            <input type="number" step="0.01" value={amountFinanced} onChange={e=>setAmountFinanced(e.target.value)} required />
          </label></div>
          <div className="row"><label>Periodic Rate
            <input type="number" step="0.01" value={periodicRate} onChange={e=>setPeriodicRate(e.target.value)} required />
          </label></div>
        </>}

        <fieldset className="items">
          <legend>Items ({items.length})</legend>
          {items.map((it, idx) => (
            <div key={idx} className="item-row">
              <input placeholder="Category Id" value={it.categoryId} onChange={e=>updateItem(idx,{categoryId:e.target.value})} required />
              <input placeholder="Description" value={it.description} onChange={e=>updateItem(idx,{description:e.target.value})} required />
              <input placeholder="Amount" type="number" step="0.01" value={it.amount || ''} onChange={e=>updateItem(idx,{amount:e.target.value})} />
              <button type="button" onClick={()=>removeItem(idx)} disabled={items.length===1}>✕</button>
            </div>
          ))}
          <button type="button" onClick={addItem}>+ Add Item</button>
        </fieldset>

        {error && <div className="error">{error}</div>}
        {createdId && <div className="success">Created Ticket ID: {createdId}</div>}

        <button type="submit" disabled={saving || (type==='PAWN' && !amountFinanced)}>Save Pawn Ticket</button>
      </form>
    </div>
  );
}
