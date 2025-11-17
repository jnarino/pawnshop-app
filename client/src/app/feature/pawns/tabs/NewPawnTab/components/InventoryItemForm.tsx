import { useState, useCallback } from 'react';
import { CategorySelector } from './CategorySelector';

import { BarcodeScanner } from './BarcodeScanner';
import type { InventoryItemDraft } from './InventoryItemModal';
import { FirearmFieldGroup } from './FirearmFieldGroup';
import { JewelryFieldGroup } from './JewelryFieldGroup';

type EnhancedInventoryItemDraft = InventoryItemDraft & {
  caliber?: string;
  action?: string;
  barrelLength?: string;
  capacity?: string;
};

interface Props {
  draft: EnhancedInventoryItemDraft;
  onDraftChange: (draft: EnhancedInventoryItemDraft) => void;
  onSubmit: (draft: EnhancedInventoryItemDraft) => void;
  onCancel: () => void;
  error: string | null;
  isEditing: boolean;
}

// ✅ Single Responsibility: Form UI and field management
export function InventoryItemForm({ 
  draft, 
  onDraftChange, 
  onSubmit, 
  onCancel, 
  error, 
  isEditing 
}: Props) {
  const [barcodeMode, setBarcodeMode] = useState(false);

  // ✅ Single Responsibility: Field update handler - simplified signature
  const updateField = useCallback((field: string, value: any) => {
    onDraftChange({ ...draft, [field]: value });
  }, [draft, onDraftChange]);

  // ✅ Single Responsibility: Form submission
  const handleFormSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(draft);
  }, [draft, onSubmit]);

  // ✅ Single Responsibility: Category detection
  const isJewelry = draft.type.toLowerCase().includes('jewelry');
  const isFirearm = draft.type.toLowerCase().includes('firearm');

  return (
    <div className="inventory-item-form">
      <style>{`
        .inventory-item-form {
          padding: 16px;
        }
        .form-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
          margin-bottom: 16px;
        }
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .form-group label {
          font-weight: 500;
          font-size: 14px;
        }
        .form-group input,
        .form-group select,
        .form-group textarea {
          padding: 8px 12px;
          border: 1px solid #ccc;
          border-radius: 4px;
          font-size: 14px;
        }
        .form-group input:focus,
        .form-group select:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: #2196f3;
          box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.2);
        }
        .full-width {
          grid-column: 1 / -1;
        }
        .form-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
          padding-top: 16px;
          border-top: 1px solid #eee;
        }
        .error-message {
          color: #d32f2f;
          font-size: 14px;
          padding: 8px 12px;
          background-color: #ffebee;
          border-radius: 4px;
          margin-bottom: 16px;
        }
        button {
          padding: 8px 16px;
          border: 1px solid #ccc;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
        }
        button[type="submit"] {
          background-color: #2196f3;
          color: white;
          border-color: #2196f3;
        }
        button[type="button"] {
          background-color: #f5f5f5;
        }
        button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      `}</style>

      <form onSubmit={handleFormSubmit}>
        <div className="form-grid">
          <CategorySelector
            selectedType={draft.type}
            onTypeChange={(type) => updateField('type', type)}
          />

          <div className="form-group">
            <label>Brand</label>
            <input 
              value={draft.brand || ''} 
              onChange={e => updateField('brand', e.target.value)} 
            />
          </div>

          <div className="form-group">
            <label>Model</label>
            <input 
              value={draft.model || ''} 
              onChange={e => updateField('model', e.target.value)} 
            />
          </div>

          <div className="form-group">
            <label>Serial #</label>
            <input 
              value={draft.serial || ''} 
              onChange={e => updateField('serial', e.target.value)} 
            />
          </div>

          <div className="form-group">
            <label>Value *</label>
            <input 
              type="number" 
              step="0.01" 
              value={draft.amount || ''} 
              onChange={e => updateField('amount', e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Quantity</label>
            <input 
              type="number" 
              min="1"
              value={draft.quantity || '1'} 
              onChange={e => updateField('quantity', e.target.value)} 
            />
          </div>

          {isJewelry && (
            <JewelryFieldGroup
              draft={draft}
              onFieldChange={updateField}
            />
          )}

          {isFirearm && (
            <FirearmFieldGroup
              draft={draft}
              onFieldChange={updateField}
            />
          )}
        </div>

        <div className="form-group full-width">
          <label>Description</label>
          <textarea 
            value={draft.description || ''} 
            onChange={e => updateField('description', e.target.value)} 
            rows={3}
          />
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <div className="form-actions">
          <button type="button" onClick={onCancel}>
            Cancel
          </button>
          <button type="submit">
            {isEditing ? 'Update' : 'Add'} Item
          </button>
        </div>
      </form>

      <BarcodeScanner
        enabled={barcodeMode}
        onScan={(code) => {
          updateField('serial', code);
          setBarcodeMode(false);
        }}
        onToggle={setBarcodeMode}
      />
    </div>
  );
}
