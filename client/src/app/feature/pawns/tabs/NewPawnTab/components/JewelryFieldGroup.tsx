import { useMemo } from 'react';
import {
  JEWELRY_METALS,
  KARAT_OPTIONS_BY_METAL,
  RING_SIZES,
  WEIGHT_UNITS,
  GENDER_OPTIONS
} from '@/app/shared/constants/jewelry';

interface Props {
  draft: any; // ✅ Keep flexible for now
  onFieldChange: (field: string, value: any) => void; // ✅ Match the expected signature
}

// ✅ Single Responsibility: Jewelry-specific form fields
export function JewelryFieldGroup({ draft, onFieldChange }: Props) {
  // ✅ Karat options based on selected metal
  const karatOptions = useMemo(() => {
    const metalKey = draft.metal?.toLowerCase();
    return metalKey && metalKey in KARAT_OPTIONS_BY_METAL
      ? KARAT_OPTIONS_BY_METAL[metalKey as keyof typeof KARAT_OPTIONS_BY_METAL]
      : [];
  }, [draft.metal]);

  const isRing = draft.type?.toLowerCase().includes('ring');

  return (
    <>
      <div className="form-group">
        <label>Metal *</label>
        <input
          list="jewelryMetals"
          value={draft.metal || ''}
          onChange={e => {
            onFieldChange('metal', e.target.value.toUpperCase());
            onFieldChange('karat', ''); // Reset karat when metal changes
          }}
          required
        />
        <datalist id="jewelryMetals">
          {JEWELRY_METALS.map(m => (
            <option key={m} value={m.toUpperCase()} />
          ))}
        </datalist>
      </div>

      <div className="form-group">
        <label>Karat / Fineness *</label>
        {karatOptions.length > 0 ? (
          <select
            value={draft.karat || ''}
            onChange={e => onFieldChange('karat', e.target.value)}
            required
          >
            <option value="">Select karat...</option>
            {karatOptions.map(k => (
              <option key={k} value={k}>{k}</option>
            ))}
          </select>
        ) : (
          <input
            value={draft.karat || ''}
            onChange={e => onFieldChange('karat', e.target.value)}
            placeholder="e.g. 14K, .925"
            required
          />
        )}
      </div>

      <div className="form-group">
        <label>Weight *</label>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            type="number"
            step="0.01"
            value={draft.weight || ''}
            onChange={e => onFieldChange('weight', e.target.value)}
            required
            style={{ flex: '1' }}
          />
          <select
            value={draft.weightUnit || 'Grams'}
            onChange={e => onFieldChange('weightUnit', e.target.value)}
            style={{ minWidth: '80px' }}
          >
            {WEIGHT_UNITS.map(u => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="form-group">
        <label>Gender</label>
        <select
          value={draft.gender || ''}
          onChange={e => onFieldChange('gender', e.target.value)}
        >
          <option value="">Select gender...</option>
          {GENDER_OPTIONS.map(g => (
            <option key={g} value={g}>{g}</option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label>Style</label>
        <input
          value={draft.style || ''}
          onChange={e => onFieldChange('style', e.target.value)}
          placeholder="Type to search styles"
        />
      </div>

      <div className="form-group">
        <label>Size/Length</label>
        {isRing ? (
          <select
            value={draft.sizeLength || ''}
            onChange={e => onFieldChange('sizeLength', e.target.value)}
          >
            <option value="">Select Ring Size</option>
            {RING_SIZES.map(size => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
        ) : (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input
              value={draft.sizeLength || ''}
              onChange={e => onFieldChange('sizeLength', e.target.value)}
              style={{ flex: '1' }}
            />
            <span>inches</span>
          </div>
        )}
      </div>
    </>
  );
}
