import { useState, useCallback, useEffect } from 'react';
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
import overviewIcon from '@/assets/icons/overview.svg';

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

// ✅ Single Responsibility: Pawn ticket form with inventory management
export default function PawnTicketForm({ onSubmit, disabled = false }: Props) {
  // ✅ Form state with proper initialization
  const [formData, setFormData] = useState({
    customerId: 'temp-customer', // ✅ Temporary - remove customer selection for now
    type: 'PAWN' as 'PAWN' | 'PURCHASE',
    amountFinanced: '',
    purchaseTradeValue: '',
    periodicRate: '25',
    transactionDate: format(new Date(), 'yyyy-MM-dd'),
    maturityDate: format(addDays(new Date(), 30), 'yyyy-MM-dd'),
    expirationDate: format(addDays(new Date(), 60), 'yyyy-MM-dd'),
    items: [] as InventoryItemDraft[]
  });

  const [showItemModal, setShowItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItemDraft | null>(null);
  const [manualAmountOverride, setManualAmountOverride] = useState(false);

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
      transactionDate: formData.transactionDate,
      maturityDate: formData.maturityDate,
      expirationDate: formData.expirationDate,
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

  // ✅ Auto-update amount financed when items change (unless manually overridden)
  useEffect(() => {
    if (!manualAmountOverride && formData.items.length > 0) {
      if (formData.type === 'PAWN') {
        setFormData(prev => ({
          ...prev,
          amountFinanced: totalValue.toString()
        }));
      } else if (formData.type === 'PURCHASE') {
        setFormData(prev => ({
          ...prev,
          purchaseTradeValue: totalValue.toString()
        }));
      }
    }
  }, [formData.items, formData.type, totalValue, manualAmountOverride]);

  // ✅ Handle manual amount change
  const handleAmountFinancedChange = useCallback((value: string) => {
    setManualAmountOverride(true);
    setFormData(prev => ({ ...prev, amountFinanced: value }));
  }, []);

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto">
      <form onSubmit={handleSubmit}>
        {/* Transaction Details Card */}
        <TransactionDetails
          type={formData.type}
          amountFinanced={formData.amountFinanced}
          periodicRate={formData.periodicRate}
          transactionDate={formData.transactionDate}
          maturityDate={formData.maturityDate}
          expirationDate={formData.expirationDate}
          totalValue={totalValue}
          onTypeChange={(value) => {
            setManualAmountOverride(false); // Reset override when type changes
            setFormData(prev => ({ ...prev, type: value }));
          }}
          onAmountFinancedChange={handleAmountFinancedChange}
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
                          <div className="font-semibold">{item.type}</div>
                          {item.brand && <div className="text-sm text-gray-600">Brand: {item.brand}</div>}
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
