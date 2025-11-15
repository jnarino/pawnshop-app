import { useEffect, useState, useCallback } from 'react';
import './InventoryItemModal.css';
import { Modal } from '@/app/shared/components/Modal';
import { useInventoryCategories } from '@/app/shared/hooks/useInventoryCategories';
import { useBarcodeScan } from '@/app/shared/hooks/useBarcodeScan';
import {
  JEWELRY_COLORS,
  JEWELRY_METALS,
  KARAT_OPTIONS_BY_METAL,
  RING_SIZES,
  WEIGHT_UNITS,
  GENDER_OPTIONS
} from '@/app/shared/constants/jewelry';

export interface InventoryItemDraft {
  id?: string;
  type: string;
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
  condition?: string;
  ownerNumber?: string;
  // Firearm fields
  caliber?: string;
  action?: string;
  barrelLength?: string;
  capacity?: string;
}

interface Props {
  open: boolean;
  initial?: InventoryItemDraft | null;
  onCancel: () => void;
  onSave: (item: InventoryItemDraft) => void;
}

const DEFAULT_ITEM: InventoryItemDraft = {
  type: '',
  quantity: '1',
  weightUnit: 'Grams'
};

// ✅ Single Responsibility: Modal for adding/editing inventory items
export default function InventoryItemModal({ open, initial, onCancel, onSave }: Props) {
  const [draft, setDraft] = useState<InventoryItemDraft>(DEFAULT_ITEM);
  const [error, setError] = useState<string | null>(null);
  const [barcodeMode, setBarcodeMode] = useState(false);
  const [typeQuery, setTypeQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const categoriesHook = useInventoryCategories();
  const categories = categoriesHook?.leafCategories || [];
  const isLoading = categoriesHook?.loading || false;

  // ✅ Initialize form data with proper defaults to prevent controlled/uncontrolled switches
  useEffect(() => {
    if (open) {
      const formData = initial ? { 
        ...DEFAULT_ITEM, 
        ...initial,
        // ✅ Ensure all select fields have default values
        condition: initial.condition || '',
        gender: initial.gender || '',
        weightUnit: initial.weightUnit || 'Grams'
      } : { 
        ...DEFAULT_ITEM,
        // ✅ Ensure all select fields have default values
        condition: '',
        gender: '',
        weightUnit: 'Grams'
      };
      setDraft(formData);
      setTypeQuery(initial?.type || '');
      setError(null);
    }
  }, [open, initial]);

  // ✅ Category suggestions
  const suggestions = categories.filter(cat =>
    cat?.name?.toLowerCase().includes(typeQuery.toLowerCase())
  ).slice(0, 10);

  // ✅ Category type detection
  const isJewelry = draft.type.toLowerCase().includes('jewelry');
  const isFirearm = draft.type.toLowerCase().includes('firearm');
  const isRing = isJewelry && draft.type.toLowerCase().includes('ring');

  // ✅ Karat options based on metal
  const karatOptions = draft.metal && KARAT_OPTIONS_BY_METAL[draft.metal.toLowerCase()] || [];

  // ✅ Update field handler
  const updateField = useCallback((field: keyof InventoryItemDraft, value: any) => {
    setDraft(prev => ({ ...prev, [field]: value }));
  }, []);

  // ✅ Type selection
  const selectType = useCallback((categoryName: string) => {
    updateField('type', categoryName);
    setTypeQuery(categoryName);
    setShowSuggestions(false);
  }, [updateField]);

  // ✅ Barcode scanning
  useBarcodeScan({
    enabled: barcodeMode,
    onBarcode: (code) => {
      updateField('serial', code);
      setBarcodeMode(false);
    },
    allowRegex: /^[A-Z0-9\-]+$/i
  });

  // ✅ Form validation and submission
  const handleSubmit = useCallback((e: React.FormEvent) => {
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
      setError('Metal, Karat and Weight are required for jewelry');
      return;
    }

    // Generate ID if not editing
    const itemData = {
      ...draft,
      id: draft.id || crypto.randomUUID()
    };

    onSave(itemData);
  }, [draft, isJewelry, onSave]);

  if (!open) return null;

  return (
    <Modal 
      isOpen={open} 
      onClose={onCancel}
      title={initial ? 'Edit Item' : 'Add New Item'}
      description="Enter the item details for this pawn transaction"
    >
      <div className="inventory-modal">
        <div className="modal-header">
          <h2 className="modal-title">{initial ? 'Edit Item' : 'Add New Item'}</h2>
          <p className="modal-subtitle">Enter the item details for this pawn transaction</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            {/* Row 1: Basic Information */}
            <div className="form-group">
              <label className="required">Type</label>
              <div className="type-selector">
                <input
                  type="text"
                  value={typeQuery}
                  onChange={(e) => {
                    setTypeQuery(e.target.value);
                    updateField('type', e.target.value);
                    setShowSuggestions(e.target.value.length > 0);
                  }}
                  onFocus={() => setShowSuggestions(typeQuery.length > 0)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  placeholder={isLoading ? "Loading..." : "Search categories..."}
                  disabled={isLoading}
                  required
                />
                {showSuggestions && suggestions.length > 0 && (
                  <div className="suggestions">
                    {suggestions.map((cat, index) => (
                      <div
                        key={cat.id || index}
                        className="suggestion-item"
                        onClick={() => selectType(cat.name)}
                      >
                        {cat.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="form-group">
              <label>Brand</label>
              <input
                value={draft.brand || ''}
                onChange={(e) => updateField('brand', e.target.value)}
                placeholder="e.g., Apple, Samsung"
              />
            </div>

            <div className="form-group">
              <label>Model</label>
              <input
                value={draft.model || ''}
                onChange={(e) => updateField('model', e.target.value)}
                placeholder="e.g., iPhone 13"
              />
            </div>

            <div className="form-group">
              <label>Serial Number</label>
              <input
                value={draft.serial || ''}
                onChange={(e) => updateField('serial', e.target.value)}
                placeholder="Serial/IMEI"
              />
            </div>

            <div className="form-group">
              <label>Color</label>
              <input
                list="colors"
                value={draft.color || ''}
                onChange={(e) => updateField('color', e.target.value)}
                placeholder="Color"
              />
              <datalist id="colors">
                {JEWELRY_COLORS.map(color => (
                  <option key={color} value={color} />
                ))}
              </datalist>
            </div>

            <div className="form-group">
              <label>Condition</label>
              <select
                value={draft.condition || ''}
                onChange={(e) => updateField('condition', e.target.value)}
              >
                <option value="">Select...</option>
                <option value="Excellent">Excellent</option>
                <option value="Good">Good</option>
                <option value="Fair">Fair</option>
                <option value="Poor">Poor</option>
              </select>
            </div>

            {/* Row 2: Value & Quantity */}
            <div className="form-group">
              <label className="required">Value</label>
              <input
                type="number"
                step="0.01"
                value={draft.amount || ''}
                onChange={(e) => updateField('amount', e.target.value)}
                placeholder="0.00"
                required
              />
            </div>

            <div className="form-group">
              <label>Quantity</label>
              <input
                type="number"
                min="1"
                value={draft.quantity || '1'}
                onChange={(e) => updateField('quantity', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Owner Marks</label>
              <input
                value={draft.ownerNumber || ''}
                onChange={(e) => updateField('ownerNumber', e.target.value)}
                placeholder="Marks/engravings"
              />
            </div>

            {/* Spacer for alignment when no jewelry/firearm fields */}
            {!isJewelry && !isFirearm && (
              <>
                <div></div>
                <div></div>
                <div></div>
              </>
            )}

            {/* Jewelry Fields - displayed in same grid */}
            {isJewelry && (
              <>
                <div className="section-header">💎 Jewelry Details</div>
                
                <div className="form-group">
                  <label className="required">Metal</label>
                  <input
                    list="metals"
                    value={draft.metal || ''}
                    onChange={(e) => {
                      updateField('metal', e.target.value.toUpperCase());
                      updateField('karat', '');
                    }}
                    placeholder="GOLD, SILVER..."
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="required">Karat</label>
                  {karatOptions.length > 0 ? (
                    <select
                      value={draft.karat || ''}
                      onChange={(e) => updateField('karat', e.target.value)}
                      required
                    >
                      <option value="">Select...</option>
                      {karatOptions.map(k => (
                        <option key={k} value={k}>{k}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      value={draft.karat || ''}
                      onChange={(e) => updateField('karat', e.target.value)}
                      placeholder="14K, .925"
                      required
                    />
                  )}
                </div>

                <div className="form-group">
                  <label className="required">Weight</label>
                  <div className="flex-row">
                    <input
                      type="number"
                      step="0.01"
                      value={draft.weight || ''}
                      onChange={(e) => updateField('weight', e.target.value)}
                      placeholder="0.00"
                      required
                      style={{ flex: 1 }}
                    />
                    <select
                      value={draft.weightUnit || 'Grams'}
                      onChange={(e) => updateField('weightUnit', e.target.value)}
                      style={{ minWidth: '80px' }}
                    >
                      {WEIGHT_UNITS.map(unit => (
                        <option key={unit} value={unit}>{unit}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Gender</label>
                  <select
                    value={draft.gender || ''}
                    onChange={(e) => updateField('gender', e.target.value)}
                  >
                    <option value="">Select...</option>
                    {GENDER_OPTIONS.map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Size/Length</label>
                  {isRing ? (
                    <select
                      value={draft.sizeLength || ''}
                      onChange={(e) => updateField('sizeLength', e.target.value)}
                    >
                      <option value="">Ring size...</option>
                      {RING_SIZES.map(size => (
                        <option key={size} value={size}>{size}</option>
                      ))}
                    </select>
                  ) : (
                    <div className="flex-row">
                      <input
                        value={draft.sizeLength || ''}
                        onChange={(e) => updateField('sizeLength', e.target.value)}
                        placeholder="Length"
                        style={{ flex: 1 }}
                      />
                      <span>in</span>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Firearm Fields - displayed in same grid */}
            {isFirearm && (
              <>
                <div className="section-header">🔫 Firearm Details</div>
                
                <div className="form-group">
                  <label>Caliber</label>
                  <input
                    value={draft.caliber || ''}
                    onChange={(e) => updateField('caliber', e.target.value)}
                    placeholder="9MM, .45 ACP"
                  />
                </div>

                <div className="form-group">
                  <label>Action</label>
                  <input
                    value={draft.action || ''}
                    onChange={(e) => updateField('action', e.target.value)}
                    placeholder="Semi-auto, Bolt"
                  />
                </div>

                <div className="form-group">
                  <label>Barrel Length</label>
                  <input
                    value={draft.barrelLength || ''}
                    onChange={(e) => updateField('barrelLength', e.target.value)}
                    placeholder="16 inches"
                  />
                </div>

                <div className="form-group">
                  <label>Capacity</label>
                  <input
                    value={draft.capacity || ''}
                    onChange={(e) => updateField('capacity', e.target.value)}
                    placeholder="15 rounds"
                  />
                </div>
              </>
            )}
          </div>

          {/* Description - Full Width */}
          <div className="form-group full-width">
            <label>Description</label>
            <textarea
              value={draft.description || ''}
              onChange={(e) => updateField('description', e.target.value)}
              rows={3}
              placeholder="Detailed description of the item, including any notable features, damage, or special characteristics..."
            />
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="modal-actions">
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <button
                type="button"
                className={`btn btn-scanner ${barcodeMode ? 'active' : ''}`}
                onClick={() => setBarcodeMode(!barcodeMode)}
              >
                {barcodeMode ? '⏹️ Stop Scanner' : '📱 Scan Barcode'}
              </button>
              {barcodeMode && (
                <div className="scanner-status">
                  Scanner active - scan barcode now
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onCancel}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
              >
                {initial ? '💾 Update Item' : '➕ Add Item'}
              </button>
            </div>
          </div>

          {/* Hidden datalists */}
          <datalist id="metals">
            {JEWELRY_METALS.map(metal => (
              <option key={metal} value={metal.toUpperCase()} />
            ))}
          </datalist>
        </form>
      </div>
    </Modal>
  );
}
