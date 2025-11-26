import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { http } from '@/app/core/api/http';
import { useCategoryLookup } from '../hooks/useCategoryLookup';

interface Props {
  customerId: string;
  onSuccess?: (data: any) => void;
  disabled?: boolean;
}

function buildDescription(it: InventoryItemDraft): string {
  if (it.description) return it.description.substring(0, 200);
  const parts = [it.brand, it.model, it.color, it.style].filter(Boolean);
  return parts.join(' ').substring(0, 200);
}

// ✅ Single Responsibility: Pawn ticket form with inventory management
export default function PawnTicketForm({ customerId, onSuccess, disabled = false }: Props) {
  const navigate = useNavigate();
  const { getCategoryIdByPath } = useCategoryLookup();
  const [saving, setSaving] = useState(false);

  // ✅ Form state with proper initialization
  const [formData, setFormData] = useState({
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

    setSaving(true);
    try {
      // ✅ 1. Prepare Items
      const newInventoryItems = formData.items.map(it => {
        const categoryId = getCategoryIdByPath(it.type);
        
        // Note: In a real app, we should probably validate categoryId here
        // if (!categoryId) throw new Error(`Invalid category: ${it.type}`);

        return {
          categoryId: categoryId || it.type, // Fallback to type string if lookup fails (or handle error)
          brand: it.brand || undefined,
          model: it.model || undefined,
          serialNumber: it.serial || undefined,
          colorId: null, // Will be set when color lookup is implemented
          itemCondition: it.condition || 'Good',
          quantity: parseInt(it.quantity || '1') || 1,
          priceAmount: it.amount ? Number(it.amount) : undefined,
          resale: it.resale ? Number(it.resale) : undefined,
          minResale: undefined,
          itemReplace: it.replace ? Number(it.replace) : undefined,
          ownerMark: it.ownerNumber || undefined,
          itemDescription: buildDescription(it),
          attributes: {
            brand: it.brand,
            model: it.model,
            serial: it.serial,
            color: it.color,
            ownerNumber: it.ownerNumber,
            metal: it.metal,
            karat: it.karat,
            weight: it.weight,
            weightUnit: it.weightUnit,
            gender: it.gender,
            style: it.style,
            sizeLength: it.sizeLength,
            caliber: it.caliber,
            action: it.action,
            barrelLength: it.barrelLength,
            capacity: it.capacity
          },
          extra: {},
        };
      });

      // ✅ 2. Prepare Payload
      const body: any = {
        type: formData.type,
        customerId: customerId, // Use prop directly
        newInventoryItems,
        transactionDate: formData.transactionDate ? new Date(formData.transactionDate).toISOString() : new Date().toISOString(),
        maturityDate: formData.maturityDate ? new Date(formData.maturityDate).toISOString() : undefined,
        defaultDate: formData.expirationDate ? new Date(formData.expirationDate).toISOString() : undefined,
      };

      // ✅ 3. Business Logic (PAWN vs PURCHASE)
      if (formData.type === 'PAWN') {
        body.amountFinanced = Number(formData.amountFinanced);
        body.periodicRate = (Number(formData.periodicRate) || 0) / 100;
      } else if (formData.type === 'PURCHASE') {
        body.purchaseTradeValue = Number(formData.purchaseTradeValue);
      }

      console.log('[PawnTicket] Submitting:', body);

      // ✅ 4. API Call
      const data = await http('/api/pawnTicket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      console.log('[PawnTicket] Created:', data);
      
      if (onSuccess) {
        onSuccess(data);
      } else {
        alert('Transaction created successfully!');
        // navigate('/'); // Redirect if needed
      }

    } catch (error: any) {
      console.error('Submission failed:', error);
      alert(`Error: ${error.message || 'Failed to create transaction'}`);
    } finally {
      setSaving(false);
    }
  }, [formData, getCategoryIdByPath, onSuccess, customerId]);

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
          onTypeChange={(value) => setFormData(prev => ({ ...prev, type: value }))}
          onAmountFinancedChange={(value) => setFormData(prev => ({ ...prev, amountFinanced: value }))}
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

        {formData.type === 'PAWN' && formData.items.length > 0 && (
          <Card className="mt-4 border-2 border-slate-200 bg-slate-50 max-w-xs ml-auto">
            <CardContent className="p-4 flex justify-between items-center">
              <span className="font-semibold text-gray-700">Total Item Value:</span>
              <span className="text-xl font-bold text-slate-900">${totalValue.toFixed(2)}</span>
            </CardContent>
          </Card>
        )}

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
