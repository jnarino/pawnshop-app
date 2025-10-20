import { useEffect, useMemo, useState } from 'react';
import { useBarcodeScan } from '../../../shared/hooks/useBarcodeScan';
import { useInventoryCategories } from '@/app/shared/hooks/useInventoryCategories';
import { JEWELRY_COLORS, JEWELRY_METALS, KARAT_OPTIONS_BY_METAL } from '@/app/shared/constants/jewelry';

export interface InventoryItemDraft {
  id?: string; // local uuid
  type: string;                  // DB code of top-level category
  sub1?: string; sub2?: string;  // sub1 = DB code of child under type
  sub3?: string; sub4?: string;  // sub3 = DB code used for Brand
  brand?: string; model?: string; serial?: string;
  color?: string;
  amount?: string; // value
  quantity?: string;
  // jewelry extras
  metal?: string; karat?: string; weight?: string; weightUnit?: string;
  gender?: string; style?: string; sizeLength?: string;
  description?: string; // replaces note
  // legacy/unused fields kept for now
  resale?: string; replace?: string; storageFee?: string; condition?: string; ownerNumber?: string; bin?: string;
}

interface Props {
  open: boolean;
  initial?: InventoryItemDraft | null;
  onCancel(): void;
  onSave(item: InventoryItemDraft): void;
}

const DEFAULT_ITEM: InventoryItemDraft = { type: '', quantity: '1', weightUnit: 'Grams' };
const weightUnits = ['Grams', 'Ounces'];
const genderOptions = ['', 'Male', 'Female', 'Unisex'];

export default function InventoryItemModal({ open, initial, onCancel, onSave }: Props) {
  const [draft, setDraft] = useState<InventoryItemDraft>(DEFAULT_ITEM);
  const [error, setError] = useState<string | null>(null);
  const [barcodeMode, setBarcodeMode] = useState(false);
  
  // Filter state for autocomplete
  const [typeFilter, setTypeFilter] = useState('');
  const [subcat1Filter, setSubcat1Filter] = useState('');
  const [brandFilter, setBrandFilter] = useState('');

  // Load categories from DB
  const { loading: catLoading, error: catError, typeOptions, subcat1OptionsFor, brandOptionsFor } = useInventoryCategories();
  const subcat1Options = useMemo(() => subcat1OptionsFor(draft.type), [draft.type, subcat1OptionsFor]);
  const brandOptions = useMemo(() => brandOptionsFor(draft.sub1), [draft.sub1, brandOptionsFor]);

  // Filtered options for autocomplete
  const filteredTypeOptions = useMemo(() => 
    typeOptions.filter(t => t.name.toUpperCase().includes(typeFilter.toUpperCase())),
    [typeOptions, typeFilter]
  );
  
  const filteredSubcat1Options = useMemo(() => 
    subcat1Options.filter(s => s.name.toUpperCase().includes(subcat1Filter.toUpperCase())),
    [subcat1Options, subcat1Filter]
  );
  
  const filteredBrandOptions = useMemo(() => 
    brandOptions.filter(b => b.name.toUpperCase().includes(brandFilter.toUpperCase())),
    [brandOptions, brandFilter]
  );

  useEffect(() => {
    if (open) {
      setDraft(initial ? { ...initial } : { ...DEFAULT_ITEM });
      setTypeFilter('');
      setSubcat1Filter('');
      setBrandFilter('');
    }
  }, [open, initial]);

  function update<K extends keyof InventoryItemDraft>(k: K, v: InventoryItemDraft[K]) {
    // For string values, convert to uppercase except for ownerNumber and description
    if (typeof v === 'string' && k !== 'description' && k !== 'ownerNumber') {
      setDraft(d => ({ ...d, [k]: v.toUpperCase() }));
    } else {
      setDraft(d => ({ ...d, [k]: v }));
    }
  }

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

  // Helpers
  const canonicalMetalKey = useMemo(() => {
    const m = (draft.metal || '').trim().toLowerCase();
    if (!m) return undefined;
    return Object.keys(KARAT_OPTIONS_BY_METAL).find(k => k.toLowerCase() === m);
  }, [draft.metal]);

  const karatOptions = useMemo(() => {
    return canonicalMetalKey ? KARAT_OPTIONS_BY_METAL[canonicalMetalKey] : [];
  }, [canonicalMetalKey]);

  // Auto-show extras based on selected Type code
  const isJewelry = (draft.type || '').toLowerCase() === 'jewelry';
  const isFirearm = (draft.type || '').toLowerCase() === 'firearms';

  // Cascading changes
  const onTypeChange = (code: string) => {
    setDraft(prev => ({
      ...prev,
      type: code || '',
      sub1: undefined,
      sub3: undefined,
      brand: undefined
    }));
  };
  const onSub1Change = (code: string) => {
    setDraft(prev => ({
      ...prev,
      sub1: code || undefined,
      sub3: undefined,
      brand: undefined
    }));
  };
  const onBrandChange = (code: string) => {
    const opt = brandOptions.find(o => o.code === code);
    setDraft(prev => ({
      ...prev,
      sub3: code || undefined,     // brand stored as subcategory 3 code
      brand: opt?.name || ''       // store brand name for display if needed
    }));
  };

  useBarcodeScan({
    enabled: barcodeMode,
    onBarcode: (code) => {
      setDraft(i => ({
        ...i,
        serial: i.serial || code,
      }));
      setBarcodeMode(false);
    },
    allowRegex: /^[A-Z0-9\-]+$/i
  });

  // Handlers for autocomplete fields
  const handleTypeInput = (value: string) => {
    setTypeFilter(value);
    const matchedType = typeOptions.find(t => t.name.toUpperCase() === value.toUpperCase());
    if (matchedType) {
      onTypeChange(matchedType.code);
    } else {
      // Just update the filter, not the actual type until a match is selected
      setDraft(prev => ({ ...prev, type: value.toUpperCase() }));
    }
  };

  const handleSubcat1Input = (value: string) => {
    setSubcat1Filter(value);
    const matchedSubcat = subcat1Options.find(s => s.name.toUpperCase() === value.toUpperCase());
    if (matchedSubcat) {
      onSub1Change(matchedSubcat.code);
    } else {
      setDraft(prev => ({ ...prev, sub1: value.toUpperCase() }));
    }
  };

  const handleBrandInput = (value: string) => {
    setBrandFilter(value);
    const matchedBrand = brandOptions.find(b => b.name.toUpperCase() === value.toUpperCase());
    if (matchedBrand) {
      onBrandChange(matchedBrand.code);
    } else {
      setDraft(prev => ({ ...prev, sub3: undefined, brand: value.toUpperCase() }));
    }
  };

  if (!open) return null;
  return (
    <div className="pawn-modal__backdrop" role="dialog" aria-modal="true" aria-label={initial ? 'Edit Item' : 'New Item'}>
      <div className="pawn-modal">
        <header className="pawn-modal__header">
          <h3>{initial ? 'Edit Pawn Item' : 'New Pawn Item'}</h3>
        </header>
        <form onSubmit={handleSubmit} className="pawn-item-form">
          <div className="pawn-item-grid">
            {/* Type (top-level category) - with autocomplete */}
            <label>Type
              <input 
                list="typeOptions"
                value={typeFilter || draft.type || ''}
                onChange={e => handleTypeInput(e.target.value)}
                disabled={catLoading}
                placeholder="Select or type"
              />
              <datalist id="typeOptions">
                {filteredTypeOptions.map(t => <option key={t.code} value={t.name} />)}
              </datalist>
            </label>

            {/* Subcategory 1 - with autocomplete */}
            <label>Subcategory 1
              <input 
                list="subcat1Options"
                value={subcat1Filter || (draft.sub1 ? subcat1Options.find(s => s.code === draft.sub1)?.name : '') || ''}
                onChange={e => handleSubcat1Input(e.target.value)}
                disabled={!draft.type || catLoading}
                placeholder="Select or type"
              />
              <datalist id="subcat1Options">
                {filteredSubcat1Options.map(s => <option key={s.code} value={s.name} />)}
              </datalist>
            </label>

            {/* Brand - with autocomplete */}
            <label>Brand
              <input 
                list="brandOptions"
                value={brandFilter || draft.brand || ''}
                onChange={e => handleBrandInput(e.target.value)}
                disabled={!draft.sub1 || catLoading}
                placeholder="Select or type"
              />
              <datalist id="brandOptions">
                {filteredBrandOptions.map(b => <option key={b.code} value={b.name} />)}
              </datalist>
            </label>

            <label>Model
              <input value={draft.model || ''} onChange={e => update('model', e.target.value)} />
            </label>
            <label>Serial #
              <input value={draft.serial || ''} onChange={e => update('serial', e.target.value)} />
            </label>
            <label>Color
              <input list="jewelryColors" value={draft.color || ''} onChange={e => update('color', e.target.value)} />
            </label>
            <label>Owner
              <input value={draft.ownerNumber || ''} onChange={e => update('ownerNumber', e.target.value)} />
            </label>
            <label>Value
              <input type="number" step="0.01" value={draft.amount || ''} onChange={e => update('amount', e.target.value)} />
            </label>
            <label>Quantity
              <input type="number" value={draft.quantity || ''} onChange={e => update('quantity', e.target.value)} />
            </label>

            {/* Jewelry extras */}
            {isJewelry && <>
              <label>Metal
                <input
                  list="jewelryMetals"
                  value={draft.metal || ''}
                  onChange={e => setDraft(d => ({ ...d, metal: e.target.value.toUpperCase(), karat: undefined }))}
                />
              </label>
              <label>Karat / Fineness
                {karatOptions.length > 0 ? (
                  <select value={draft.karat || ''} onChange={e => update('karat', e.target.value)}>
                    <option value="" />
                    {karatOptions.map(k => <option key={k} value={k}>{k}</option>)}
                  </select>
                ) : (
                  <input value={draft.karat || ''} onChange={e => update('karat', e.target.value)} placeholder="e.g. 14K, .925" />
                )}
              </label>
              <label>Weight
                <div className="flex">
                  <input value={draft.weight || ''} onChange={e => update('weight', e.target.value)} style={{ width: '70%' }} />
                  <select value={draft.weightUnit || 'Grams'} onChange={e => update('weightUnit', e.target.value)} style={{ width: '30%' }}>
                    {weightUnits.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              </label>
              <label>Gender
                <select value={draft.gender || ''} onChange={e => update('gender', e.target.value)}>
                  {genderOptions.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </label>
              <label>Style
                <input value={draft.style || ''} onChange={e => update('style', e.target.value)} />
              </label>
              <label>Size/Length
                <input value={draft.sizeLength || ''} onChange={e => update('sizeLength', e.target.value)} />
              </label>
            </>}

            {/* Firearm extras */}
            {isFirearm && <>
              <label>Caliber
                <input value={(draft as any).caliber || ''} onChange={e => update('caliber' as any, e.target.value as any)} />
              </label>
              <label>Action
                <input value={(draft as any).action || ''} onChange={e => update('action' as any, e.target.value as any)} placeholder="e.g. Semi-auto, Bolt" />
              </label>
              <label>Barrel Length
                <input value={(draft as any).barrelLength || ''} onChange={e => update('barrelLength' as any, e.target.value as any)} placeholder="e.g. 16 in" />
              </label>
              <label>Capacity
                <input value={(draft as any).capacity || ''} onChange={e => update('capacity' as any, e.target.value as any)} />
              </label>
            </>}
          </div>

          <label className="pawn-item-note">Description
            <textarea value={draft.description || ''} onChange={e => update('description', e.target.value)} rows={2} />
          </label>
          {error && <div style={{ color: '#b91c1c', fontSize: '.65rem' }}>{error}</div>}
          {catError && <div style={{ color: '#b45309', fontSize: '.65rem' }}>Could not load categories.</div>}

          <div className="pawn-modal__actions">
            <button type="button" onClick={onCancel}>Cancel</button>
            <button type="submit">{initial ? 'Update' : 'Add Item'}</button>
          </div>

          {/* Datalists for autofill */}
          <datalist id="jewelryColors">
            {JEWELRY_COLORS.map(c => <option key={c} value={c.toUpperCase()} />)}
          </datalist>
          <datalist id="jewelryMetals">
            {JEWELRY_METALS.map(m => <option key={m} value={m.toUpperCase()} />)}
          </datalist>
        </form>

        <div className="toolbar">
          <button type="button" onClick={() => setBarcodeMode(m => !m)}
            style={{ background: barcodeMode ? '#c33' : '#444' }}>
            {barcodeMode ? 'Stop Scan' : 'Scan Barcode'}
          </button>
        </div>
      </div>
    </div>
  );
}
