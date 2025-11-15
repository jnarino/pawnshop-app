import { useState, useCallback } from 'react';
import './PawnTicketForm.css';
import InventoryItemModal, { type InventoryItemDraft } from './InventoryItemModal';

interface Props {
  onSubmit: (formData: {
    customerId: string;
    type: 'PAWN' | 'PURCHASE';
    amountFinanced?: number;
    purchaseTradeValue?: number;
    periodicRate?: number;
    items: InventoryItemDraft[];
  }) => Promise<void>;
  disabled?: boolean;
}

// ✅ Single Responsibility: Pawn ticket form with inventory management
export default function PawnTicketForm({ onSubmit, disabled = false }: Props) {
  // ✅ Form state with proper initialization
  const [formData, setFormData] = useState({
    customerId: 'temp-customer', // ✅ Temporary - remove customer selection for now
    type: 'PAWN' as 'PAWN' | 'PURCHASE',
    amountFinanced: '',
    purchaseTradeValue: '',
    periodicRate: '0.25',
    items: [] as InventoryItemDraft[]
  });

  const [showItemModal, setShowItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItemDraft | null>(null);

  // ✅ Handle form submission
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.items.length === 0) {
      alert('Please add at least one item');
      return;
    }

    if (formData.type === 'PAWN' && !formData.amountFinanced) {
      alert('Amount financed is required for pawn transactions');
      return;
    }

    if (formData.type === 'PURCHASE' && !formData.purchaseTradeValue) {
      alert('Purchase trade value is required for purchase transactions');
      return;
    }

    // ✅ Convert string values to numbers
    const submitData = {
      customerId: formData.customerId,
      type: formData.type,
      amountFinanced: formData.amountFinanced ? Number(formData.amountFinanced) : undefined,
      purchaseTradeValue: formData.purchaseTradeValue ? Number(formData.purchaseTradeValue) : undefined,
      periodicRate: Number(formData.periodicRate),
      items: formData.items
    };

    await onSubmit(submitData);
  }, [formData, onSubmit]);

  // ✅ Add or update item
  const handleSaveItem = useCallback((item: InventoryItemDraft) => {
    if (editingItem) {
      // Update existing item
      setFormData(prev => ({
        ...prev,
        items: prev.items.map(i => i.id === item.id ? item : i)
      }));
    } else {
      // Add new item
      setFormData(prev => ({
        ...prev,
        items: [...prev.items, item]
      }));
    }

    setShowItemModal(false);
    setEditingItem(null);
  }, [editingItem]);

  // ✅ Edit existing item
  const handleEditItem = useCallback((item: InventoryItemDraft) => {
    setEditingItem(item);
    setShowItemModal(true);
  }, []);

  // ✅ Remove item
  const handleRemoveItem = useCallback((itemId: string) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter(i => i.id !== itemId)
    }));
  }, []);

  // ✅ Calculate total value
  const totalValue = formData.items.reduce((sum, item) => {
    const value = Number(item.amount) || 0;
    const quantity = Number(item.quantity) || 1;
    return sum + (value * quantity);
  }, 0);

  return (
    <div className="pawn-ticket-form">
      <form onSubmit={handleSubmit}>
        {/* Items Section - Now the main content */}
        <div className="items-section">
          <div className="items-header">
            <h3 className="section-title">📦 Items ({formData.items.length})</h3>
            <button
              type="button"
              className="add-item-btn"
              onClick={() => setShowItemModal(true)}
              disabled={disabled}
            >
              ➕ Add Item
            </button>
          </div>

          <div className="items-list">
            {formData.items.length === 0 ? (
              <div className="empty-state">
                No items added yet. Click "Add Item" to get started.
              </div>
            ) : (
              formData.items.map((item) => (
                <div key={item.id} className="item-row">
                  <div className="item-details">
                    <div>
                      <strong>{item.type}</strong>
                      {item.brand && <div>Brand: {item.brand}</div>}
                      {item.model && <div>Model: {item.model}</div>}
                    </div>
                    <div>Qty: {item.quantity || 1}</div>
                    <div>${Number(item.amount || 0).toFixed(2)}</div>
                    <div>${(Number(item.amount || 0) * Number(item.quantity || 1)).toFixed(2)}</div>
                  </div>
                  <div className="item-actions">
                    <button
                      type="button"
                      className="btn-icon btn-edit"
                      onClick={() => handleEditItem(item)}
                      disabled={disabled}
                    >
                      ✏️
                    </button>
                    <button
                      type="button"
                      className="btn-icon btn-remove"
                      onClick={() => handleRemoveItem(item.id!)}
                      disabled={disabled}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Summary */}
        {formData.items.length > 0 && (
          <div className="summary-section">
            <h3 className="section-title">📊 Summary</h3>
            <div className="summary-row">
              <span>Total Items:</span>
              <span>{formData.items.length}</span>
            </div>
            <div className="summary-row">
              <span>Total Value:</span>
              <span>${totalValue.toFixed(2)}</span>
            </div>
            <div className="summary-row summary-total">
              <span>Transaction Amount:</span>
              <span>
                ${formData.type === 'PAWN'
                  ? Number(formData.amountFinanced || 0).toFixed(2)
                  : Number(formData.purchaseTradeValue || 0).toFixed(2)
                }
              </span>
            </div>
          </div>
        )}

        <button
          type="submit"
          className="submit-btn"
          disabled={disabled || formData.items.length === 0}
        >
          {disabled ? 'Processing...' : `Create ${formData.type} Ticket`}
        </button>
      </form>

      {/* ✅ Horizontal Modal */}
      <InventoryItemModal
        open={showItemModal}
        initial={editingItem}
        onCancel={() => {
          setShowItemModal(false);
          setEditingItem(null);
        }}
        onSave={handleSaveItem}
      />
    </div>
  );
}
