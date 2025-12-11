import { useState, useCallback, useMemo } from 'react';
import InventoryItemModal, { type InventoryItemDraft } from './InventoryItemModal';
import TransactionDetails from './TransactionDetails';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format, addDays } from 'date-fns';
import packageIcon from '@/assets/icons/package.svg';
import addIcon from '@/assets/icons/add.svg';
import editIcon from '@/assets/icons/edit.svg';
import deleteIcon from '@/assets/icons/delete.svg';

interface Props {
  onSubmit: (formData: {
    customerId: string;
    type: 'PAWN' | 'PURCHASE';
    amountFinanced?: number;
    purchaseTradeValue?: number;
    periodicRate?: number;
    transactionDate?: string;
    maturityDate?: string;
    expirationDate?: string;
    items: InventoryItemDraft[];
  }) => Promise<void>;
  disabled?: boolean;
}

export default function PawnTicketForm({ onSubmit, disabled = false }: Props) {
  const [formData, setFormData] = useState({
    customerId: 'temp-customer',
    type: 'PAWN' as 'PAWN' | 'PURCHASE',
    periodicRate: '25',
    transactionDate: format(new Date(), 'yyyy-MM-dd'),
    maturityDate: format(addDays(new Date(), 30), 'yyyy-MM-dd'),
    expirationDate: format(addDays(new Date(), 60), 'yyyy-MM-dd'),
    items: [] as InventoryItemDraft[]
  });

  const [showItemModal, setShowItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItemDraft | null>(null);

  const categoryNameCache = useMemo(() => {
    const cache = new Map<string, string>();
    formData.items.forEach(item => {
      if (item.type && !cache.has(item.type)) {
        cache.set(item.type, item.type);
      }
    });
    return cache;
  }, [formData.items]);

  const getCategoryName = useCallback((id: string) => {
    return categoryNameCache.get(id) || id;
  }, [categoryNameCache]);

  const totalValue = formData.items.reduce((sum, item) => {
    const value = Number(item.amount) || 0;
    const quantity = Number(item.quantity) || 1;
    return sum + (value * quantity);
  }, 0);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.items.length === 0) {
      alert('Please add at least one item');
      return;
    }

    const submitData = {
      customerId: formData.customerId,
      type: formData.type,
      amountFinanced: formData.type === 'PAWN' ? totalValue : undefined,
      purchaseTradeValue: formData.type === 'PURCHASE' ? totalValue : undefined,
      periodicRate: Number(formData.periodicRate),
      transactionDate: formData.transactionDate,
      maturityDate: formData.maturityDate,
      expirationDate: formData.expirationDate,
      items: formData.items
    };

    await onSubmit(submitData);
  }, [formData, totalValue, onSubmit]);

  const handleSaveItem = useCallback((item: InventoryItemDraft) => {
    if (editingItem) {
      setFormData(prev => ({
        ...prev,
        items: prev.items.map(i => i.id === item.id ? item : i)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        items: [...prev.items, item]
      }));
    }

    setShowItemModal(false);
    setEditingItem(null);
  }, [editingItem]);

  const handleEditItem = useCallback((item: InventoryItemDraft) => {
    setEditingItem(item);
    setShowItemModal(true);
  }, []);

  const handleRemoveItem = useCallback((itemId: string) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter(i => i.id !== itemId)
    }));
  }, []);

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto">
      <form onSubmit={handleSubmit}>
        <TransactionDetails
          type={formData.type}
          periodicRate={formData.periodicRate}
          transactionDate={formData.transactionDate}
          maturityDate={formData.maturityDate}
          expirationDate={formData.expirationDate}
          totalValue={totalValue}
          onTypeChange={(value) => {
            setFormData(prev => ({ ...prev, type: value }));
          }}
          onPeriodicRateChange={(value) => setFormData(prev => ({ ...prev, periodicRate: value }))}
          onTransactionDateChange={(value) => setFormData(prev => ({ ...prev, transactionDate: value }))}
          onMaturityDateChange={(value) => setFormData(prev => ({ ...prev, maturityDate: value }))}
          onExpirationDateChange={(value) => setFormData(prev => ({ ...prev, expirationDate: value }))}
        />

        {/* Items Section */}
        <Card className="border-2">
          <CardHeader className="bg-slate-50 border-b flex flex-row items-center justify-between py-4">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <img src={packageIcon} alt="Items" className="w-5 h-5" /> Items <Badge variant="secondary">{formData.items.length}</Badge>
            </CardTitle>
            <Button
              type="button"
              onClick={() => setShowItemModal(true)}
              disabled={disabled}
              size="sm"
            >
              <img src={addIcon} alt="Add" className="w-4 h-4 mr-1 brightness-0 invert" /> Add Item
            </Button>
          </CardHeader>

          <CardContent className="p-0">
            <ScrollArea className="max-h-[400px]">
              {formData.items.length === 0 ? (
                <div className="py-10 text-center text-gray-500">
                  No items added yet. Click "Add Item" to get started.
                </div>
              ) : (
                <div>
                  {/* Table Header */}
                  <div className="px-5 py-3 bg-slate-100 border-b font-semibold text-sm grid grid-cols-[3fr_1fr_1.5fr_1.5fr_120px] gap-4 items-center">
                    <div>Item</div>
                    <div>Quantity</div>
                    <div>Value</div>
                    <div>Total</div>
                    <div className="text-center">Actions</div>
                  </div>
                  {/* Table Body */}
                  <div className="divide-y">
                    {formData.items.map((item) => (
                      <div key={item.id} className="px-5 py-4 grid grid-cols-[3fr_1fr_1.5fr_1.5fr_120px] gap-4 items-center hover:bg-slate-50">
                        <div>
                          <div className="font-semibold">{item.categoryName || item.type}</div>
                          {item.brandName && <div className="text-sm text-gray-600">Brand: {item.brandName}</div>}
                          {item.model && <div className="text-sm text-gray-600">Model: {item.model}</div>}
                        </div>
                        <div className="text-sm">{item.quantity || 1}</div>
                        <div className="text-sm">${Number(item.amount || 0).toFixed(2)}</div>
                        <div className="font-semibold">${(Number(item.amount || 0) * Number(item.quantity || 1)).toFixed(2)}</div>
                        <div className="flex gap-3 justify-center items-center">
                          <button
                            type="button"
                            onClick={() => handleEditItem(item)}
                            disabled={disabled}
                            className="cursor-pointer hover:opacity-70 disabled:opacity-30"
                          >
                            <img src={editIcon} alt="Edit" className="w-5 h-5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item.id!)}
                            disabled={disabled}
                            className="cursor-pointer hover:opacity-70 disabled:opacity-30"
                          >
                            <img src={deleteIcon} alt="Delete" className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        <div className="flex justify-center mt-6">
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
