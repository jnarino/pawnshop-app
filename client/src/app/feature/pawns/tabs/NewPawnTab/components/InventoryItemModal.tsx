import { useEffect, useState, useCallback } from 'react';
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

  // ✅ Initialize form data
  useEffect(() => {
    if (open) {
      const formData = initial ? { ...DEFAULT_ITEM, ...initial } : { ...DEFAULT_ITEM };
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
        <style>{`
          .inventory-modal {
            width: 100%;
            max-width: 900px;
            padding: 24px;
            background: white;
            border-radius: 12px;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
          }
          
          .modal-header {
            margin-bottom: 24px;
            padding-bottom: 16px;
            border-bottom: 2px solid #e5e7eb;
          }
          
          .modal-title {
            font-size: 24px;
            font-weight: 600;
            color: #1f2937;
            margin: 0 0 8px 0;
          }
          
          .modal-subtitle {
            font-size: 14px;
            color: #6b7280;
            margin: 0;
          }
          
          .form-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 20px;
            margin-bottom: 24px;
          }
          
          .form-group {
            display: flex;
            flex-direction: column;
            gap: 6px;
          }
          
          .form-group label {
            font-weight: 600;
            font-size: 14px;
            color: #374151;
            display: flex;
            align-items: center;
            gap: 4px;
          }
          
          .required::after {
            content: '*';
            color: #dc2626;
            font-weight: bold;
          }
          
          .form-group input,
          .form-group select,
          .form-group textarea {
            padding: 12px 16px;
            border: 2px solid #e5e7eb;
            border-radius: 8px;
            font-size: 14px;
            transition: all 0.2s ease;
            background: white;
          }
          
          .form-group input:focus,
          .form-group select:focus,
          .form-group textarea:focus {
            outline: none;
            border-color: #3b82f6;
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
            background: #fefefe;
          }
          
          .form-group input:disabled,
          .form-group select:disabled {
            background-color: #f3f4f6;
            color: #6b7280;
            cursor: not-allowed;
          }
          
          .type-selector {
            position: relative;
          }
          
          .suggestions {
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            background: white;
            border: 2px solid #e5e7eb;
            border-top: none;
            border-radius: 0 0 8px 8px;
            max-height: 240px;
            overflow-y: auto;
            z-index: 1000;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
          }
          
          .suggestion-item {
            padding: 12px 16px;
            cursor: pointer;
            font-size: 14px;
            border-bottom: 1px solid #f3f4f6;
            transition: background-color 0.15s ease;
          }
          
          .suggestion-item:hover {
            background-color: #f8fafc;
          }
          
          .suggestion-item:last-child {
            border-bottom: none;
          }
          
          .flex-row {
            display: flex;
            gap: 12px;
            align-items: center;
          }
          
          .full-width {
            grid-column: 1 / -1;
          }
          
          .section-divider {
            grid-column: 1 / -1;
            height: 1px;
            background: linear-gradient(to right, transparent, #e5e7eb 20%, #e5e7eb 80%, transparent);
            margin: 16px 0;
          }
          
          .section-header {
            grid-column: 1 / -1;
            font-size: 16px;
            font-weight: 600;
            color: #1f2937;
            margin: 16px 0 8px 0;
            padding-bottom: 8px;
            border-bottom: 1px solid #e5e7eb;
          }
          
          .error-message {
            color: #dc2626;
            background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
            padding: 16px;
            border-radius: 8px;
            margin: 16px 0;
            font-size: 14px;
            border: 1px solid #fecaca;
            display: flex;
            align-items: center;
            gap: 8px;
          }
          
          .error-message::before {
            content: '⚠️';
            font-size: 16px;
          }
          
          .modal-actions {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding-top: 24px;
            border-top: 2px solid #e5e7eb;
            margin-top: 24px;
          }
          
          .btn {
            padding: 12px 24px;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            border: 2px solid;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            gap: 8px;
          }
          
          .btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
          }
          
          .btn-secondary {
            background: white;
            color: #374151;
            border-color: #d1d5db;
          }
          
          .btn-secondary:hover:not(:disabled) {
            background: #f9fafb;
            border-color: #9ca3af;
          }
          
          .btn-primary {
            background: #3b82f6;
            color: white;
            border-color: #3b82f6;
          }
          
          .btn-primary:hover:not(:disabled) {
            background: #2563eb;
            border-color: #2563eb;
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
          }
          
          .btn-scanner {
            background: ${barcodeMode ? '#dc2626' : '#6b7280'};
            color: white;
            border-color: ${barcodeMode ? '#dc2626' : '#6b7280'};
          }
          
          .btn-scanner:hover:not(:disabled) {
            background: ${barcodeMode ? '#b91c1c' : '#4b5563'};
            border-color: ${barcodeMode ? '#b91c1c' : '#4b5563'};
          }
          
          .scanner-status {
            color: #059669;
            font-size: 12px;
            font-weight: 500;
            display: flex;
            align-items: center;
            gap: 4px;
          }
          
          .scanner-status::before {
            content: '📱';
          }
          
          /* Responsive adjustments */
          @media (max-width: 768px) {
            .inventory-modal {
              max-width: 100%;
              margin: 16px;
              padding: 20px;
            }
            
            .form-grid {
              grid-template-columns: 1fr;
              gap: 16px;
            }
            
            .modal-actions {
              flex-direction: column-reverse;
              gap: 12px;
            }
            
            .btn {
              width: 100%;
              justify-content: center;
            }
          }
        `}</style>

        <div className="modal-header">
          <h2 className="modal-title">{initial ? 'Edit Item' : 'Add New Item'}</h2>
          <p className="modal-subtitle">Enter the item details for this pawn transaction</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            {/* Type Selection */}
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
                  placeholder={isLoading ? "Loading categories..." : "Type to search categories..."}
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

            {/* Basic Information */}
            <div className="form-group">
              <label>Brand</label>
              <input
                value={draft.brand || ''}
                onChange={(e) => updateField('brand', e.target.value)}
                placeholder="e.g., Apple, Samsung, Rolex"
              />
            </div>

            <div className="form-group">
              <label>Model</label>
              <input
                value={draft.model || ''}
                onChange={(e) => updateField('model', e.target.value)}
                placeholder="e.g., iPhone 13, Galaxy S21"
              />
            </div>

            <div className="form-group">
              <label>Serial Number</label>
              <input
                value={draft.serial || ''}
                onChange={(e) => updateField('serial', e.target.value)}
                placeholder="Serial or IMEI number"
              />
            </div>

            <div className="form-group">
              <label>Color</label>
              <input
                list="colors"
                value={draft.color || ''}
                onChange={(e) => updateField('color', e.target.value)}
                placeholder="Select or type color"
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
                <option value="">Select condition...</option>
                <option value="Excellent">Excellent</option>
                <option value="Good">Good</option>
                <option value="Fair">Fair</option>
                <option value="Poor">Poor</option>
              </select>
            </div>

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

            {/* Jewelry Fields */}
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
                    placeholder="e.g., GOLD, SILVER, PLATINUM"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="required">Karat / Fineness</label>
                  {karatOptions.length > 0 ? (
                    <select
                      value={draft.karat || ''}
                      onChange={(e) => updateField('karat', e.target.value)}
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
                      onChange={(e) => updateField('karat', e.target.value)}
                      placeholder="e.g. 14K, .925, .999"
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
                      style={{ minWidth: '100px' }}
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
                    <option value="">Select gender...</option>
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
                      <option value="">Select ring size...</option>
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
                      <span>inches</span>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Firearm Fields */}
            {isFirearm && (
              <>
                <div className="section-header">🔫 Firearm Details</div>
                
                <div className="form-group">
                  <label>Caliber</label>
                  <input
                    value={draft.caliber || ''}
                    onChange={(e) => updateField('caliber', e.target.value)}
                    placeholder="e.g., 9MM, .45 ACP, .22 LR"
                  />
                </div>

                <div className="form-group">
                  <label>Action</label>
                  <input
                    value={draft.action || ''}
                    onChange={(e) => updateField('action', e.target.value)}
                    placeholder="e.g., Semi-auto, Bolt action"
                  />
                </div>

                <div className="form-group">
                  <label>Barrel Length</label>
                  <input
                    value={draft.barrelLength || ''}
                    onChange={(e) => updateField('barrelLength', e.target.value)}
                    placeholder="e.g., 16 inches"
                  />
                </div>

                <div className="form-group">
                  <label>Capacity</label>
                  <input
                    value={draft.capacity || ''}
                    onChange={(e) => updateField('capacity', e.target.value)}
                    placeholder="e.g., 15 rounds"
                  />
                </div>
              </>
            )}

            <div className="form-group">
              <label>Owner Marks</label>
              <input
                value={draft.ownerNumber || ''}
                onChange={(e) => updateField('ownerNumber', e.target.value)}
                placeholder="Any identifying marks or engravings"
              />
            </div>
          </div>

          <div className="form-group full-width">
            <label>Description</label>
            <textarea
              value={draft.description || ''}
              onChange={(e) => updateField('description', e.target.value)}
              rows={4}
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
                className="btn btn-scanner"
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
