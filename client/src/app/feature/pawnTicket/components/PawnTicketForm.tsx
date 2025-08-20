import { useState } from 'react';
import InventoryItemModal, { InventoryItemDraft } from './InventoryItemModal';

interface Props {
  customerId: string;
  onBack(): void;
}

export default function PawnTicketForm({ customerId, onBack }: Props) {
  const [type, setType] = useState<'PAWN' | 'PURCHASE'>('PAWN');
  const [amountFinanced, setAmountFinanced] = useState('');
  const [periodicRate, setPeriodicRate] = useState('0.25');
  const [controlNumber, setControlNumber] = useState('');
  const [items, setItems] = useState<InventoryItemDraft[]>([]);
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItemDraft | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdId, setCreatedId] = useState<string | null>(null);

  function upsertItem(item: InventoryItemDraft) {
    setItems(prev => {
      const idx = prev.findIndex(p => p.id === item.id);
      if (idx === -1) return [...prev, item];
      const copy = [...prev];
      copy[idx] = item;
      return copy;
    });
  }
  function removeItem(id?: string) { if(!id) return; setItems(prev => prev.filter(it=> it.id !== id)); }
  function openNewItem() { setEditingItem(null); setItemModalOpen(true); }
  function openEditItem(it: InventoryItemDraft) { setEditingItem(it); setItemModalOpen(true); }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null); setSaving(true); setCreatedId(null);
    try {
      const newInventoryItems = items.map(it => ({
        categoryId: it.type,
        itemDescription: buildDescription(it),
        amount: it.amount ? Number(it.amount) : undefined,
        attributes: {
          brand: it.brand,
            model: it.model,
            serial: it.serial,
            color: it.color,
            ownerNumber: it.ownerNumber,
            metal: it.metal,
            karat: it.karat,
            weight: it.weight,
            weightUnit: it.weightUnit,
            gender: it.gender,
            style: it.style,
            sizeLength: it.sizeLength,
            description: it.description,
        },
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
      <form onSubmit={submit} className="pawn-ticket-layout">
        <section className="pawn-ticket-left">
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
          <div className="metrics-box">
            <div className="metric"><span>Active:</span><b>0</b></div>
            <div className="metric"><span>Redeemed:</span><b>0</b></div>
            <div className="metric"><span>Defaulted:</span><b>0</b></div>
            <div className="metric"><span>Buys:</span><b>0</b></div>
            <div className="metric"><span>Sales Amount:</span><b>$0</b></div>
          </div>
        </section>
        <section className="pawn-ticket-right">
          <div className="items-header">
            <div style={{ fontWeight:600 }}>Item Description</div>
            <div style={{ flex:1 }} />
            <button type="button" onClick={openNewItem}>New Item</button>
          </div>
          <div className="items-table-wrapper">
            <table className="items-table">
              <thead><tr><th>Type</th><th>Brand</th><th>Desc</th><th>Amount</th><th /></tr></thead>
              <tbody>
                {items.map(it=> (
                  <tr key={it.id}>
                    <td>{it.type}</td>
                    <td>{it.brand||''}</td>
                    <td className="desc-cell">{buildDescription(it)}</td>
                    <td>{it.amount || ''}</td>
                    <td>
                      <div className="row-actions">
                        <button type="button" onClick={()=>openEditItem(it)}>Edit</button>
                        <button type="button" onClick={()=>removeItem(it.id)}>✕</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {items.length === 0 && <tr><td colSpan={5} style={{ textAlign:'center', fontStyle:'italic' }}>No items</td></tr>}
              </tbody>
            </table>
          </div>
          {error && <div className="error" style={{ marginTop:8 }}>{error}</div>}
          {createdId && <div className="success" style={{ marginTop:8 }}>Created Ticket ID: {createdId}</div>}
          <div className="actions-row" style={{ justifyContent:'flex-end', marginTop:12 }}>
            <button type="submit" disabled={saving || (type==='PAWN' && !amountFinanced)}>Save Pawn Ticket</button>
          </div>
        </section>
      </form>
      <InventoryItemModal
        open={itemModalOpen}
        initial={editingItem}
        onCancel={()=> setItemModalOpen(false)}
        onSave={(item)=> { upsertItem(item); setItemModalOpen(false); }}
      />
    </div>
  );
}

function buildDescription(it: InventoryItemDraft): string {
  if (it.description) return it.description.substring(0, 200);
  const parts = [it.brand, it.model, it.color, it.style].filter(Boolean);
  return parts.join(' ').substring(0, 200);
}
