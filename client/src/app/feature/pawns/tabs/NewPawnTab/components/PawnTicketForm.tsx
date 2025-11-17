import { useState, useCallback } from 'react';
import InventoryItemModal, { type InventoryItemDraft } from './InventoryItemModal';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

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
    <div className="flex flex-col gap-6">
      <form onSubmit={handleSubmit}>
        {/* Items Section */}
        <Card className="border-2">
          <CardHeader className="bg-slate-50 border-b flex flex-row items-center justify-between py-4">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              📦 Items <Badge variant="secondary">{formData.items.length}</Badge>
            </CardTitle>
            <Button
              type="button"
              onClick={() => setShowItemModal(true)}
              disabled={disabled}
              size="sm"
            >
              ➕ Add Item
            </Button>
          </CardHeader>

          <CardContent className="p-0">
            <ScrollArea className="max-h-[400px]">
              {formData.items.length === 0 ? (
                <div className="py-10 text-center text-gray-500">
                  No items added yet. Click "Add Item" to get started.
                </div>
              ) : (
                <div className="divide-y">
                  {formData.items.map((item) => (
                    <div key={item.id} className="px-5 py-4 flex justify-between items-center hover:bg-slate-50">
                      <div className="grid grid-cols-4 gap-4 items-center flex-1">
                        <div>
                          <div className="font-semibold">{item.type}</div>
                          {item.brand && <div className="text-sm text-gray-600">Brand: {item.brand}</div>}
                          {item.model && <div className="text-sm text-gray-600">Model: {item.model}</div>}
                        </div>
                        <div className="text-sm">Qty: {item.quantity || 1}</div>
                        <div className="text-sm">${Number(item.amount || 0).toFixed(2)}</div>
                        <div className="font-semibold">${(Number(item.amount || 0) * Number(item.quantity || 1)).toFixed(2)}</div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => handleEditItem(item)}
                          disabled={disabled}
                          className="h-8 w-8"
                        >
                          ✏️
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          onClick={() => handleRemoveItem(item.id!)}
                          disabled={disabled}
                          className="h-8 w-8"
                        >
                          🗑️
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Summary */}
        {formData.items.length > 0 && (
          <Card className="bg-gradient-to-br from-sky-50 to-blue-50 border-2 border-sky-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                📊 Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Total Items:</span>
                <span className="font-medium">{formData.items.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Total Value:</span>
                <span className="font-medium">${totalValue.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-semibold border-t-2 border-sky-300 pt-2 mt-2">
                <span>Transaction Amount:</span>
                <span>
                  ${formData.type === 'PAWN'
                    ? Number(formData.amountFinanced || 0).toFixed(2)
                    : Number(formData.purchaseTradeValue || 0).toFixed(2)
                  }
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex justify-center">
          <Button
            type="submit"
            disabled={disabled || formData.items.length === 0}
            size="lg"
            className="px-8"
          >
            {disabled ? 'Processing...' : `Create ${formData.type} Ticket`}
          </Button>
        </div>
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
