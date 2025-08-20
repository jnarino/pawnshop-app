import { useEffect, useState } from 'react';

export interface InventoryItemDraft {
  id?: string; // local uuid
  type: string;
  sub1?: string; sub2?: string; sub3?: string; sub4?: string; // hierarchical subcategories
  brand?: string; model?: string; serial?: string;
  color?: string;
  amount?: string; // value
  quantity?: string;
  // jewelry extras
  metal?: string; karat?: string; weight?: string; weightUnit?: string;
  gender?: string; style?: string; sizeLength?: string;
  description?: string; // replaces note
  // legacy/unused fields kept for now (not shown) to avoid breaking downstream mapping
  resale?: string; replace?: string; storageFee?: string; condition?: string; ownerNumber?: string; bin?: string;
}

interface Props {
  open: boolean;
  initial?: InventoryItemDraft | null;
  onCancel(): void;
  onSave(item: InventoryItemDraft): void;
}

const DEFAULT_ITEM: InventoryItemDraft = { type: '', quantity: '1', weightUnit: 'Grams' };

const weightUnits = ['Grams','Ounces'];
const genderOptions = ['','Male','Female','Unisex'];
// placeholder subcategories for jewelry; more types can be added later
const jewelrySubcats = ['','Necklace','Ring','Bracelet','Earrings','Pendant','Chain','Watch'];

export default function InventoryItemModal({ open, initial, onCancel, onSave }: Props) {
  const [draft, setDraft] = useState<InventoryItemDraft>(DEFAULT_ITEM);
  const [error, setError] = useState<string | null>(null);
  useEffect(()=> { if (open) setDraft(initial ? { ...initial } : { ...DEFAULT_ITEM }); }, [open, initial]);

  function update<K extends keyof InventoryItemDraft>(k: K, v: InventoryItemDraft[K]) { setDraft(d=> ({ ...d, [k]: v })); }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!draft.type.trim()) { setError('Type is required'); return; }
    if (!draft.amount) { setError('Value is required'); return; }
    if (isJewelry) {
      if (!draft.metal || !draft.karat || !draft.weight) {
        setError('Metal, Karat and Weight required for jewelry');
        return;
      }
    }
    onSave({ ...draft, id: draft.id || crypto.randomUUID() });
  }

  const isJewelry = draft.type.trim().toLowerCase() === 'jewelry';

  if (!open) return null;
  return (
    <div className="pawn-modal__backdrop" role="dialog" aria-modal="true" aria-label={initial ? 'Edit Item' : 'New Item'}>
      <div className="pawn-modal">
        <header className="pawn-modal__header">
          <h3>{initial ? 'Edit Pawn Item' : 'New Pawn Item'}</h3>
        </header>
        <form onSubmit={handleSubmit} className="pawn-item-form">
          <div className="pawn-item-grid">
            <label>Type
              <input value={draft.type} onChange={e=>update('type', e.target.value)} required />
            </label>
            <label>Subcategory 1
              {isJewelry ? (
                <select value={draft.sub1||''} onChange={e=>update('sub1', e.target.value)}>
                  {jewelrySubcats.map(s=> <option key={s} value={s}>{s}</option>)}
                </select>
              ) : (
                <input value={draft.sub1||''} onChange={e=>update('sub1', e.target.value)} placeholder="Subtype" />
              )}
            </label>
            <label>Subcategory 2
              <input value={draft.sub2||''} onChange={e=>update('sub2', e.target.value)} />
            </label>
            {/* Removed subcategory 3 & 4 for now */}
            <label>Brand
              <input value={draft.brand||''} onChange={e=>update('brand', e.target.value)} />
            </label>
            <label>Model
              <input value={draft.model||''} onChange={e=>update('model', e.target.value)} />
            </label>
            <label>Serial #
              <input value={draft.serial||''} onChange={e=>update('serial', e.target.value)} />
            </label>
            <label>Color
              <input value={draft.color||''} onChange={e=>update('color', e.target.value)} />
            </label>
            <label>Owner
              <input value={draft.ownerNumber||''} onChange={e=>update('ownerNumber', e.target.value)} />
            </label>
            <label>Value
              <input type="number" step="0.01" value={draft.amount||''} onChange={e=>update('amount', e.target.value)} />
            </label>
            <label>Quantity
              <input type="number" value={draft.quantity||''} onChange={e=>update('quantity', e.target.value)} />
            </label>
            {isJewelry && <>
              <label>Metal
                <input value={draft.metal||''} onChange={e=>update('metal', e.target.value)} />
              </label>
              <label>Karat
                <input value={draft.karat||''} onChange={e=>update('karat', e.target.value)} />
              </label>
              <label>Weight
                <div className="flex">
                  <input value={draft.weight||''} onChange={e=>update('weight', e.target.value)} style={{ width:'70%' }} />
                  <select value={draft.weightUnit||'Grams'} onChange={e=>update('weightUnit', e.target.value)} style={{ width:'30%' }}>
                    {weightUnits.map(u=> <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              </label>
              <label>Gender
                <select value={draft.gender||''} onChange={e=>update('gender', e.target.value)}>
                  {genderOptions.map(g=> <option key={g} value={g}>{g}</option>)}
                </select>
              </label>
              <label>Style
                <input value={draft.style||''} onChange={e=>update('style', e.target.value)} />
              </label>
              <label>Size/Length
                <input value={draft.sizeLength||''} onChange={e=>update('sizeLength', e.target.value)} />
              </label>
            </>}
          </div>
          <label className="pawn-item-note">Description
            <textarea value={draft.description||''} onChange={e=>update('description', e.target.value)} rows={2} />
          </label>
          {error && <div style={{ color:'#b91c1c', fontSize:'.65rem' }}>{error}</div>}
          <div className="pawn-modal__actions">
            <button type="button" onClick={onCancel}>Cancel</button>
            <button type="submit">{initial ? 'Update' : 'Add Item'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
