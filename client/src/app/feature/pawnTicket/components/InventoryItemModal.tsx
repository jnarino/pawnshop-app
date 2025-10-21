import { useEffect, useMemo, useState } from 'react';
import { useBarcodeScan } from '../../../shared/hooks/useBarcodeScan';
import { useInventoryCategories } from '@/app/shared/hooks/useInventoryCategories';
import {
  JEWELRY_COLORS,
  JEWELRY_METALS,
  KARAT_OPTIONS_BY_METAL,
  RING_SIZES,
} from '@/app/shared/constants/jewelry';

// Extended interface to include firearm-specific fields
interface FirearmFields {
  caliber?: string;
  action?: string;
  barrelLength?: string;
  capacity?: string;
}

export interface InventoryItemDraft {
  id?: string;
  type: string;
  sub1?: string;
  sub2?: string;
  sub3?: string;
  sub4?: string;
  brand?: string;
  model?: string;
  serial?: string;
  color?: string;
  amount?: string;
  quantity?: string;
  metal?: string;
  karat?: string;
  weight?: string;
  weightUnit?: string;
  gender?: string;
  style?: string;
  sizeLength?: string;
  description?: string;
  resale?: string;
  replace?: string;
  storageFee?: string;
  condition?: string;
  ownerNumber?: string;
  bin?: string;
}

type EnhancedInventoryItemDraft = InventoryItemDraft & FirearmFields;

interface Props {
  open: boolean;
  initial?: InventoryItemDraft | null;
  onCancel(): void;
  onSave(item: InventoryItemDraft): void;
}

// Constants
const DEFAULT_ITEM: InventoryItemDraft = { type: '', quantity: '1', weightUnit: 'Grams' };
const WEIGHT_UNITS = ['Grams', 'Ounces'] as const;
const GENDER_OPTIONS = ['', 'MAN\'S', 'WOMAN\'S', 'N/A'] as const;

export default function InventoryItemModal({ open, initial, onCancel, onSave }: Props) {
  // State
  const [draft, setDraft] = useState<EnhancedInventoryItemDraft>(DEFAULT_ITEM);
  const [error, setError] = useState<string | null>(null);
  const [barcodeMode, setBarcodeMode] = useState(false);
  const [typeFilter, setTypeFilter] = useState('');
  const [subcat1Filter, setSubcat1Filter] = useState('');
  const [brandFilter, setBrandFilter] = useState('');
  const [styleFilter, setStyleFilter] = useState('');

  // Load categories from DB
  const { loading: catLoading, error: catError, typeOptions, subcat1OptionsFor, brandOptionsFor } = useInventoryCategories();

  // Derived options
  const subcat1Options = useMemo(() => subcat1OptionsFor(draft.type), [draft.type, subcat1OptionsFor]);
  const brandOptions = useMemo(() => brandOptionsFor(draft.sub1), [draft.sub1, brandOptionsFor]);

  // Category detection
  const isJewelry = useMemo(() => (draft.type || '').toLowerCase() === 'jewelry', [draft.type]);
  const isFirearm = useMemo(() => (draft.type || '').toLowerCase() === 'firearms', [draft.type]);

  // Style options based on jewelry subcategory
  const styleOptions = useMemo(() => {
    if (!isJewelry || !draft.sub1) return [];
    const selectedSubcat = subcat1Options.find(s => s.code === draft.sub1);
    if (!selectedSubcat) return [];
    return brandOptionsFor(selectedSubcat.code);
  }, [isJewelry, draft.sub1, subcat1Options, brandOptionsFor]);

  // Ring detection
  const isRing = useMemo(() => {
    if (!isJewelry || !draft.sub1) return false;
    const subcat1Name = subcat1Options.find(s => s.code === draft.sub1)?.name || '';
    return subcat1Name.toUpperCase().includes('RING');
  }, [isJewelry, draft.sub1, subcat1Options]);

  // Karat options based on metal
  const canonicalMetalKey = useMemo(() => {
    const m = (draft.metal || '').trim().toLowerCase();
    if (!m) return undefined;
    return Object.keys(KARAT_OPTIONS_BY_METAL).find(k => k.toLowerCase() === m);
  }, [draft.metal]);

  const karatOptions = useMemo(() => {
    if (!canonicalMetalKey) return [];
    return KARAT_OPTIONS_BY_METAL[canonicalMetalKey] || [];
  }, [canonicalMetalKey]);

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

  const filteredStyleOptions = useMemo(() =>
    styleOptions.filter(s => s.name.toUpperCase().includes(styleFilter.toUpperCase())),
    [styleOptions, styleFilter]
  );

  // Initialize form when modal opens
  useEffect(() => {
    if (open) {
      setDraft(initial ? { ...initial } : { ...DEFAULT_ITEM });

      if (initial) {
        const typeName = typeOptions.find(t => t.code === initial.type)?.name || initial.type || '';
        const subcat1Name = subcat1OptionsFor(initial.type).find(s => s.code === initial.sub1)?.name || '';
        setTypeFilter(typeName.toUpperCase());
        setSubcat1Filter(subcat1Name.toUpperCase());
        setBrandFilter((initial.brand || '').toUpperCase());
        setStyleFilter((initial.style || '').toUpperCase());
      } else {
        setTypeFilter('');
        setSubcat1Filter('');
        setBrandFilter('');
        setStyleFilter('');
      }
    }
  }, [open, initial, typeOptions, subcat1OptionsFor]);

  // Generic update function for draft fields
  function update<K extends keyof EnhancedInventoryItemDraft>(k: K, v: EnhancedInventoryItemDraft[K]) {
    if (typeof v === 'string' && k !== 'description' && k !== 'ownerNumber') {
      setDraft(d => ({ ...d, [k]: v.toUpperCase() }));
    } else {
      setDraft(d => ({ ...d, [k]: v }));
    }
  }

  // Cascading category changes
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
      sub3: code || undefined,
      brand: opt?.name || ''
    }));
  };

  // Autocomplete input handlers
  const handleTypeInput = (value: string) => {
    const uppercaseValue = value.toUpperCase();
    setTypeFilter(uppercaseValue);

    const matchedType = typeOptions.find(t => t.name.toUpperCase() === uppercaseValue);
    if (matchedType) {
      onTypeChange(matchedType.code);
    } else {
      setDraft(prev => ({ ...prev, type: uppercaseValue }));
    }
  };

  const handleSubcat1Input = (value: string) => {
    const uppercaseValue = value.toUpperCase();
    setSubcat1Filter(uppercaseValue);

    const matchedSubcat = subcat1Options.find(s => s.name.toUpperCase() === uppercaseValue);
    if (matchedSubcat) {
      onSub1Change(matchedSubcat.code);
    } else {
      setDraft(prev => ({ ...prev, sub1: uppercaseValue }));
    }
  };

  const handleBrandInput = (value: string) => {
    const uppercaseValue = value.toUpperCase();
    setBrandFilter(uppercaseValue);

    const matchedBrand = brandOptions.find(b => b.name.toUpperCase() === uppercaseValue);
    if (matchedBrand) {
      onBrandChange(matchedBrand.code);
    } else {
      setDraft(prev => ({ ...prev, sub3: undefined, brand: uppercaseValue }));
    }
  };

  const handleStyleInput = (value: string) => {
    const uppercaseValue = value.toUpperCase();
    setStyleFilter(uppercaseValue);

    const matchedStyle = styleOptions.find(s => s.name.toUpperCase() === uppercaseValue);
    if (matchedStyle) {
      update('style', matchedStyle.name);
    } else {
      update('style', uppercaseValue);
    }
  };

  // Keyboard handlers for autocomplete
  const handleTypeKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === 'Enter' || e.key === 'Tab') && filteredTypeOptions.length > 0) {
      e.preventDefault();
      handleTypeInput(filteredTypeOptions[0].name);

      if (e.key === 'Tab') {
        setTimeout(() => document.querySelector<HTMLInputElement>('[name="subcat1"]')?.focus(), 0);
      }
    }
  };

  const handleSubcat1KeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === 'Enter' || e.key === 'Tab') && filteredSubcat1Options.length > 0) {
      e.preventDefault();
      handleSubcat1Input(filteredSubcat1Options[0].name);

      if (e.key === 'Tab') {
        setTimeout(() => document.querySelector<HTMLInputElement>('[name="brand"]')?.focus(), 0);
      }
    }
  };

  const handleBrandKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === 'Enter' || e.key === 'Tab') && filteredBrandOptions.length > 0) {
      e.preventDefault();
      handleBrandInput(filteredBrandOptions[0].name);

      if (e.key === 'Tab') {
        setTimeout(() => document.querySelector<HTMLInputElement>('[name="model"]')?.focus(), 0);
      }
    }
  };

  const handleStyleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === 'Enter' || e.key === 'Tab') && filteredStyleOptions.length > 0) {
      e.preventDefault();
      handleStyleInput(filteredStyleOptions[0].name);

      if (e.key === 'Tab') {
        setTimeout(() => document.querySelector<HTMLInputElement>('[name="sizeLength"]')?.focus(), 0);
      }
    }
  };

  // Barcode scanning
  useBarcodeScan({
    enabled: barcodeMode,
    onBarcode: (code) => {
      setDraft(i => ({ ...i, serial: i.serial || code }));
      setBarcodeMode(false);
    },
    allowRegex: /^[A-Z0-9\-]+$/i
  });

  // Form submission
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!draft.type.trim()) {
      setError('Type is required');
      return;
    }

    if (!draft.amount) {
      setError('Value is required');
      return;
    }

    if (isJewelry && (!draft.metal || !draft.karat || !draft.weight)) {
      setError('Metal, Karat and Weight required for jewelry');
      return;
    }

    onSave({ ...draft, id: draft.id || crypto.randomUUID() });
  }

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
              <input
                name="type"
                list="typeOptions"
                value={typeFilter || draft.type || ''}
                onChange={e => handleTypeInput(e.target.value)}
                onKeyDown={handleTypeKeyDown}
                disabled={catLoading}
                placeholder="Select or type"
                autoComplete="off"
              />
              <datalist id="typeOptions">
                {filteredTypeOptions.map(t => <option key={t.code} value={t.name} />)}
              </datalist>
            </label>

            <label>Subcategory 1
              <input
                name="subcat1"
                list="subcat1Options"
                value={subcat1Filter || (draft.sub1 ? subcat1Options.find(s => s.code === draft.sub1)?.name : '') || ''}
                onChange={e => handleSubcat1Input(e.target.value)}
                onKeyDown={handleSubcat1KeyDown}
                disabled={!draft.type || catLoading}
                placeholder="Select or type"
                autoComplete="off"
              />
              <datalist id="subcat1Options">
                {filteredSubcat1Options.map(s => <option key={s.code} value={s.name} />)}
              </datalist>
            </label>

            <label>Brand
              <input
                name="brand"
                list="brandOptions"
                value={brandFilter || draft.brand || ''}
                onChange={e => handleBrandInput(e.target.value)}
                onKeyDown={handleBrandKeyDown}
                disabled={!draft.sub1 || catLoading}
                placeholder="Select or type"
                autoComplete="off"
              />
              <datalist id="brandOptions">
                {filteredBrandOptions.map(b => <option key={b.code} value={b.name} />)}
              </datalist>
            </label>

            <label>Model
              <input name="model" value={draft.model || ''} onChange={e => update('model', e.target.value)} />
            </label>

            <label>Serial #
              <input name="serial" value={draft.serial || ''} onChange={e => update('serial', e.target.value)} />
            </label>

            <label>Color
              <input
                name="color"
                list="jewelryColors"
                value={draft.color || ''}
                onChange={e => update('color', e.target.value)}
                autoComplete="off"
              />
            </label>

            <label>Owner Marks
              <input name="ownerNumber" value={draft.ownerNumber || ''} onChange={e => update('ownerNumber', e.target.value)} />
            </label>

            <label>Value
              <input name="amount" type="number" step="0.01" value={draft.amount || ''} onChange={e => update('amount', e.target.value)} />
            </label>

            <label>Quantity
              <input name="quantity" type="number" value={draft.quantity || ''} onChange={e => update('quantity', e.target.value)} />
            </label>

            {isJewelry && <>
              <label>Metal
                <input
                  name="metal"
                  list="jewelryMetals"
                  value={draft.metal || ''}
                  onChange={e => setDraft(d => ({ ...d, metal: e.target.value.toUpperCase(), karat: undefined }))}
                  autoComplete="off"
                />
              </label>

              <label>Karat / Fineness
                {karatOptions.length > 0 ? (
                  <select name="karat" value={draft.karat || ''} onChange={e => update('karat', e.target.value)}>
                    <option value="" />
                    {karatOptions.map(k => <option key={k} value={k}>{k}</option>)}
                  </select>
                ) : (
                  <input
                    name="karat"
                    value={draft.karat || ''}
                    onChange={e => update('karat', e.target.value)}
                    placeholder="e.g. 14K, .925"
                    disabled={!draft.metal}
                  />
                )}
              </label>

              <label>Weight
                <div className="flex">
                  <input
                    name="weight"
                    value={draft.weight || ''}
                    onChange={e => update('weight', e.target.value)}
                    style={{ width: '70%' }}
                  />
                  <select
                    name="weightUnit"
                    value={draft.weightUnit || 'Grams'}
                    onChange={e => update('weightUnit', e.target.value)}
                    style={{ width: '30%' }}
                  >
                    {WEIGHT_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              </label>

              <label>Gender
                <select
                  name="gender"
                  value={draft.gender || ''}
                  onChange={e => update('gender', e.target.value)}
                >
                  {GENDER_OPTIONS.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </label>

              <label>Style
                <input
                  name="style"
                  list="jewelryStyles"
                  value={styleFilter || draft.style || ''}
                  onChange={e => handleStyleInput(e.target.value)}
                  onKeyDown={handleStyleKeyDown}
                  placeholder="Type to search styles"
                  autoComplete="off"
                />
                <datalist id="jewelryStyles">
                  {filteredStyleOptions.map(s => <option key={s.code} value={s.name} />)}
                </datalist>
              </label>

              <label>Size/Length
                {isRing ? (
                  <select
                    name="sizeLength"
                    value={draft.sizeLength || ''}
                    onChange={e => update('sizeLength', e.target.value)}
                  >
                    <option value="">Select Ring Size</option>
                    {RING_SIZES.map(size => (
                      <option key={size} value={size}>{size}</option>
                    ))}
                  </select>
                ) : (
                  <div className="flex">
                    <input
                      name="sizeLength"
                      value={draft.sizeLength || ''}
                      onChange={e => update('sizeLength', e.target.value)}
                      style={{ width: '70%' }}
                    />
                    <span style={{ marginLeft: '5px', alignSelf: 'center' }}>inches</span>
                  </div>
                )}
              </label>
            </>}

            {isFirearm && <>
              <label>Caliber
                <input name="caliber" value={draft.caliber || ''} onChange={e => update('caliber', e.target.value)} />
              </label>
              <label>Action
                <input name="action" value={draft.action || ''} onChange={e => update('action', e.target.value)} placeholder="e.g. Semi-auto, Bolt" />
              </label>
              <label>Barrel Length
                <input name="barrelLength" value={draft.barrelLength || ''} onChange={e => update('barrelLength', e.target.value)} placeholder="e.g. 16 in" />
              </label>
              <label>Capacity
                <input name="capacity" value={draft.capacity || ''} onChange={e => update('capacity', e.target.value)} />
              </label>
            </>}
          </div>

          <label className="pawn-item-note">Description
            <textarea name="description" value={draft.description || ''} onChange={e => update('description', e.target.value)} rows={2} />
          </label>

          {error && <div style={{ color: '#b91c1c', fontSize: '.65rem' }}>{error}</div>}
          {catError && <div style={{ color: '#b45309', fontSize: '.65rem' }}>Could not load categories.</div>}

          <div className="pawn-modal__actions">
            <button type="button" onClick={onCancel}>Cancel</button>
            <button type="submit">{initial ? 'Update' : 'Add Item'}</button>
          </div>

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
