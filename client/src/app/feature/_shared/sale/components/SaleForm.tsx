import { useState, useCallback } from 'react';
import { AlertModal } from '@/app/shared/components/AlertModal';
import type { InventoryItemDraft } from '@/app/feature/_shared/pawn-ticket';
import { SaleTransactionDetails } from './SaleTransactionDetails';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { FormMode } from '../types/types';
import type { CustomerData } from '@/app/feature/_shared/types/pawnTicket';
import packageIcon from '@/assets/icons/package.svg';
import editIcon from '@/assets/icons/edit.svg';
import deleteIcon from '@/assets/icons/delete.svg';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { useFindAvailableItemByNumber } from '@/app/feature/sales/hooks/useFindAvailableItemByNumber';
import { InventoryItem } from '@/app/core/api/inventoryApi';
import { PaymentDetailsModal } from '@/app/feature/_shared/modal/PaymentDetailsModal';
import { ReturnSaleModal } from '@/app/feature/_shared/modal/ReturnSaleModal';
import PaymentMethodModal, { TenderMethod } from '@/app/feature/_shared/modal/PaymentMethodModal';
import { salesApi } from '@/app/core/api/salesApi';
import { layawayApi } from '@/app/core/api/layawayApi';
import { PaymentHistoryModal } from '@/app/feature/_shared/modal/PaymentHistoryModal';

const TAX_RATE = 0.065;

export interface SaleFormDraftState {
  inventoryNumber: string;
  quantity: number;
  description: string;
  priceEach: number | string;
  items: InventoryItemDraft[];
}

interface SaleTicketFormProps {
  readonly mode?: FormMode;
  readonly isLayaway?: boolean;
  readonly initialData?: {
    readonly id?: string;
    readonly controlNumber?: string;
    readonly occurredAt?: string;
    readonly customerId?: string;
    readonly customer?: CustomerData;
    readonly inventoryNumber?: string;
    readonly inventoryItem?: InventoryItem;
    readonly quantity?: number;
    readonly description?: string;
    readonly priceEach?: number | string;
    readonly items?: InventoryItemDraft[];
    readonly taxExemptUsed?: boolean;
    readonly eatTax?: boolean;
    readonly amount?: number;
    readonly lineAmount?: number;
    readonly stateTax?: number;
    readonly tenderChange?: number;
    readonly tenders?: any[];
    readonly typeName?: string;
    readonly totalOfPayments?: number;
  };
  readonly externalDraft?: SaleFormDraftState;
  readonly onDraftChange?: (draft: SaleFormDraftState) => void;
  readonly customer?: CustomerData;
  readonly onSubmit?: (formData: {
    customerId: string;
    items: InventoryItemDraft[];
    taxExemptUsed: boolean;
    eatTax: boolean;
  }) => Promise<void>;
  readonly disabled?: boolean;
  readonly taxExemptUsed?: boolean;
  readonly setTaxExemptUsed?: (value: boolean) => void;
  readonly eatTax?: boolean;
  readonly setEatTax?: (value: boolean) => void;
}

export function SaleForm({
  mode = 'CREATE',
  initialData,
  isLayaway,
  externalDraft,
  onDraftChange,
  customer,
  onSubmit,
  disabled = false
}: SaleTicketFormProps) {
  console.log({ initialData })
  const isViewMode = mode === 'VIEW';
  const { findAvailableItemByNumber } = useFindAvailableItemByNumber();
  const isControlled = externalDraft !== undefined && onDraftChange !== undefined;

  const [showPaymentInfo, setShowPaymentInfo] = useState(false);
  const [showPaymentHistory, setShowPaymentHistory] = useState(false);
  const [showMakePayment, setShowMakePayment] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [showRefundPaymentModal, setShowRefundPaymentModal] = useState(false);
  const [refundData, setRefundData] = useState<{ items: any[], reason: string, total: number } | null>(null);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  const [editingRowId, setEditingRowId] = useState<string | null>(null);

  const [localFormData, setLocalFormData] = useState({
    customerId: initialData?.customerId || initialData?.customer?.id || customer?.id || '',
    inventoryNumber: initialData?.controlNumber || '',
    occurredAt: initialData?.occurredAt,
    inventoryItem: initialData?.inventoryItem,
    description: initialData?.description || '',
    priceEach: initialData?.priceEach || '',
    quantity: initialData?.quantity,
    items: initialData?.items || [] as any[], // TODO: any
    taxExemptUsed: initialData?.taxExemptUsed || false,
    eatTax: initialData?.eatTax || false,
    status: initialData?.typeName
  });

  const formData = {
    ...localFormData,
    // If controlled, use external items, otherwise local items
    items: (isControlled && externalDraft?.items) ? externalDraft.items : localFormData.items
  };

  const updateFormData = useCallback((updates: Partial<typeof localFormData>) => {
    // Always update local state for transient fields (inputs)
    setLocalFormData(prev => ({ ...prev, ...updates }));

    // If controlled and items are changing, notify parent
    if (isControlled && onDraftChange && updates.items) {
      onDraftChange({ ...externalDraft, items: updates.items } as SaleFormDraftState);
    }
  }, [isControlled, onDraftChange, externalDraft]);

  // Calculate totals
  const subtotalSum = formData.items.reduce((sum, item) => {
    const price = Number(item.priceEach) || 0;
    const qty = Number(item.quantity) || 1;
    return sum + (price * qty);
  }, 0);

  let subtotal, taxAmount, totalAmount, totalDebt;

  if (isViewMode && initialData?.amount !== undefined) {
    subtotal = initialData.amount;
    taxAmount = initialData.stateTax || 0;
    totalAmount = subtotal + taxAmount;
  } else if (formData.taxExemptUsed) {
    subtotal = subtotalSum;
    taxAmount = 0;
    totalAmount = subtotalSum;
  } else if (formData.eatTax) {
    totalAmount = subtotalSum;
    subtotal = totalAmount / 1.065;
    taxAmount = totalAmount - subtotal;
  } else {
    subtotal = subtotalSum;
    taxAmount = subtotal * TAX_RATE;
    totalAmount = subtotal + taxAmount;
  }

  if (isLayaway) {
    totalDebt = totalAmount - (initialData?.totalOfPayments || 0);
  }

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    if (isViewMode || !onSubmit) {
      return;
    }

    if (formData.items.length === 0) {
      setAlertMessage('Please add at least one item');
      return;
    }

    const submitData = {
      customerId: formData.customerId || '',
      inventoryNumber: formData.inventoryNumber,
      inventoryItem: formData.inventoryItem!,
      quantity: formData.quantity!,
      items: formData.items,
      taxExemptUsed: formData.taxExemptUsed,
      eatTax: formData.eatTax
    };

    await onSubmit(submitData);
  }, [formData, onSubmit, isViewMode]);

  const handleSaveItem = useCallback((item: any) => { // TODO: any
    // Ensure numeric values are numbers
    const processedItem = {
      ...item,
      // Keep existing ID if editing, otherwise allow item to provide ID or generate new
      id: editingRowId || item.inventoryItem?.id || item.id || `manual-${Date.now()}`,
      priceEach: Number(item.priceEach),
      amount: Number(item.priceEach) // Map priceEach to amount for the backend
    };

    if (editingRowId) {
      // Update existing item
      updateFormData({
        items: formData.items.map(i => i.id === editingRowId ? processedItem : i),
        inventoryNumber: '',
        inventoryItem: undefined,
        description: '',
        priceEach: '',
        quantity: undefined
      });
      setEditingRowId(null);
    } else {
      // Add new item
      updateFormData({
        items: [...formData.items, processedItem],
        inventoryNumber: '',
        inventoryItem: undefined,
        description: '',
        priceEach: '',
        quantity: undefined
      });
    }

    setEditingRowId(null);
  }, [editingRowId, formData.items, updateFormData]);

  const handleEditItem = useCallback((item: InventoryItemDraft) => {
    setEditingRowId(item.id || null);
    updateFormData({
      inventoryNumber: item.inventoryItem?.inventoryNumber || item.inventoryNumber || '',
      inventoryItem: item.inventoryItem,
      description: item.description,
      quantity: typeof item.quantity === 'number' ? item.quantity : Number(item.quantity),
      priceEach: typeof item.priceEach === 'number' ? item.priceEach : Number(item.priceEach),
      // Do NOT remove item from list
    });
  }, [updateFormData]);

  const handleCancelEdit = useCallback(() => {
    setEditingRowId(null);
    updateFormData({
      inventoryNumber: '',
      inventoryItem: undefined,
      description: '',
      priceEach: '',
      quantity: undefined
    });
  }, [updateFormData]);

  const handleRemoveItem = useCallback((itemId: string) => {
    if (itemId === editingRowId) {
      handleCancelEdit();
    }
    updateFormData({
      items: formData.items.filter(i => i.id !== itemId)
    });
  }, [formData.items, updateFormData, editingRowId, handleCancelEdit]);

  const handleOnSearchInventoryItem = useCallback(async (inventoryItem: string) => {
    try {
      const item = await findAvailableItemByNumber(inventoryItem);
      if (item) {
        updateFormData({
          inventoryItem: item,
          description: item.itemDescription || item.description || '',
          quantity: 1,
          priceEach: item.resale || 0
        });
      }
    } catch (e) {
      setAlertMessage(e instanceof Error ? e.message : String(e));
    }
  }, [updateFormData, findAvailableItemByNumber]);

  const handleFieldByKey = useCallback((key: string, value: any) => {
    updateFormData({ [key]: value });
  }, [updateFormData]);

  const handleReturnClick = () => {
    setShowReturnModal(true);
  };

  const handleReturnConfirm = (selectedItems: any[], reason: string) => {
    const total = selectedItems.reduce((sum, i) => sum + Number(i.lineAmount) || 0, 0);

    setRefundData({ items: selectedItems, reason, total });
    setShowReturnModal(false);
    setShowRefundPaymentModal(true);
  };

  const handleRefundPaymentDone = async (tenders: TenderMethod[]) => {
    if (!refundData || !initialData?.id) return;

    try {
      const payload = {
        controlNumber: initialData.controlNumber,
        items: refundData.items.map(item => ({
          inventoryItemId: item.inventoryItem?.id || (item as any).inventoryItemId,
          price: Number(item.lineAmount)
        })),
        tenders: tenders.map(t => ({
          tenderTypeId: t.tenderTypeId,
          amount: Number(t.amount)
        }))
      };

      if (isLayaway) {
        await layawayApi.voidLayaway(initialData.id, payload);
        setAlertMessage('Layaway voided/returned successfully');
      } else {
        await salesApi.voidSale(initialData.id, payload);
        setAlertMessage('Sale voided/returned successfully');
      }
      setShowRefundPaymentModal(false);
      window.location.reload();
    } catch (error) {
      console.error(`Failed to void ${isLayaway ? 'layaway' : 'sale'}`, error);
      setAlertMessage(`Failed to void ${isLayaway ? 'layaway' : 'sale'}`);
    }
  };

  const handleMakePaymentDone = async (tenders: TenderMethod[]) => {
    if (!initialData?.id) return;
    try {
      const payload = {
        ticketnum: initialData.controlNumber,
        tenders: tenders.map(t => ({
          tenderTypeId: t.tenderTypeId,
          amount: Number(t.amount)
        }))
      };
      await layawayApi.makePayment(payload);
      setAlertMessage('Payment made successfully');
      setShowMakePayment(false);
      window.location.reload();
    } catch (error) {
      console.error(`Failed to make payment`, error);
      setAlertMessage(`Failed to make payment`);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto">
      <form onSubmit={handleSubmit}>
        <SaleTransactionDetails
          inventoryNumber={formData.inventoryNumber}
          inventoryItem={formData.inventoryItem}
          onSearchInventoryItem={handleOnSearchInventoryItem}
          quantity={formData.quantity}
          description={formData.description}
          priceEach={formData.priceEach}
          handleSaveItem={handleSaveItem}
          occurredAt={formData.occurredAt}
          handleFieldByKey={handleFieldByKey}
          disabled={isViewMode}
          isViewMode={isViewMode}
          status={formData.status}
          customer={customer}
          taxExemptUsed={formData.taxExemptUsed}
          setTaxExemptUsed={(value) => updateFormData({ taxExemptUsed: value })}
          isEditing={!!editingRowId}
          onCancelEdit={handleCancelEdit}
        />
        {isViewMode && (
          <div className="flex items-center justify-end my-2 gap-2 items-end">
            <Button
              type="button"
              size="sm"
              onClick={handleReturnClick}
              disabled={!initialData?.id || initialData.items?.some(i => i.status === 'V')} // Disable if already voided (status check simplified)
            >
              Return
            </Button>
            {isLayaway ? (
              <>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => setShowPaymentHistory(true)}
                >
                  Payment history
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => setShowMakePayment(true)}
                >
                  Make payment
                </Button>
              </>
            ) : (
              <Button
                type="button"
                size="sm"
                onClick={() => setShowPaymentInfo(true)}
              >
                Payment information
              </Button>
            )}
            <Button
              type="button"
              size="sm"
              onClick={() => { }}
            >
              Print ticket
            </Button>
          </div>
        )
        }
        <Card className="border-2">
          <CardHeader className="bg-slate-50 border-b flex flex-row items-center justify-between py-4">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <img src={packageIcon} alt="Items" className="w-5 h-5" /> Items <Badge variant="secondary">{formData.items.length}</Badge>
            </CardTitle>
          </CardHeader>

          <CardContent className="p-0">
            {formData.items.length === 0 ? (
              <div className="py-10 text-center text-gray-500">
                No items added yet. Click "Add Item" to get started.
              </div>
            ) : (
              <Table stickyHeader>
                <TableHeader>
                  <TableRow>
                    <TableHead sticky className="bg-white z-20">Inventory #</TableHead>
                    <TableHead sticky className="w-[300px] bg-white z-20">Item description</TableHead>
                    <TableHead sticky className="bg-white z-20">Quantity</TableHead>
                    <TableHead sticky className="bg-white z-20">Price each</TableHead>
                    <TableHead sticky className="bg-white z-20">Ext. price</TableHead>
                    <TableHead sticky className="text-center bg-white z-20">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {formData.items.map((item) => (
                    <TableRow
                      key={item.id || item.inventoryItem?.id}
                      className={item.id === editingRowId ? "bg-amber-50 border-l-4 border-amber-500" : ""}
                    >
                      <TableCell>
                        {item.inventoryItem?.inventoryNumber || item.inventoryNumber || item.controlNumber}
                      </TableCell>
                      <TableCell>{item.description || ''}</TableCell>
                      <TableCell>{item.quantity || 1}</TableCell>
                      <TableCell>${Number(item.priceEach || item.lineAmount || 0).toFixed(2)}</TableCell>
                      <TableCell className="font-medium">${(Number(item.priceEach || item.lineAmount || 0) * Number(item.quantity || 1)).toFixed(2)}</TableCell>
                      <TableCell className="text-center">
                        <div className="flex gap-2 justify-center items-center">
                          <Button className='!p-0'
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditItem(item)}
                            disabled={disabled || !!editingRowId}
                          >
                            <img src={editIcon} alt="Edit" className="w-4 h-4" />
                          </Button>
                          <Button className='!p-0'
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveItem(item.id!)}
                            disabled={disabled}
                          >
                            <img src={deleteIcon} alt="Delete" className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end mt-2 gap-2 items-end">
          {!isViewMode && (
            <Button
              type="submit"
              disabled={disabled || formData.items.length === 0}
              size="lg"
              className="px-8"
            >
              Save {isLayaway ? 'layaway' : 'sale'}
            </Button>
          )}

          <div>
            <Label>Subtotal</Label>
            <Input
              type="number"
              step="0.01"
              value={subtotal.toFixed(2)}
              readOnly
              disabled={true}
              className="bg-slate-100"
            />
          </div>
          <div>
            <Label>Tax</Label>
            <Input
              type="number"
              step="0.01"
              value={taxAmount.toFixed(2)}
              readOnly
              disabled={true}
              className="bg-slate-100"
            />
          </div>
          <div>
            <Label>Total</Label>
            <Input
              type="number"
              step="0.01"
              value={totalAmount.toFixed(2)}
              readOnly
              disabled={true}
              className="bg-slate-100"
            />
          </div>
          {!isViewMode && (
            <div className="flex gap-2 items-center pb-2">
              <Checkbox
                id="eatTax"
                checked={formData.eatTax}
                onCheckedChange={(checked) => updateFormData({ eatTax: checked === true })}
                disabled={disabled}
              />
              <Label htmlFor="eatTax" className="mb-0">Eat tax?</Label>
            </div>
          )}
        </div>
      </form>
      {initialData && (
        <>
          <PaymentDetailsModal
            open={showPaymentInfo}
            onClose={() => setShowPaymentInfo(false)}
            data={{
              totalAmount: (initialData.amount || 0) + (initialData.stateTax || 0),
              tenderChange: initialData.tenderChange || 0,
              tenders: initialData.tenders || []
            }}
          />
          <ReturnSaleModal
            open={showReturnModal}
            isLayaway={isLayaway}
            items={initialData.items || []}
            onCancel={() => setShowReturnModal(false)}
            onConfirm={handleReturnConfirm}
          />
          {showMakePayment && (
            <PaymentMethodModal
              open={showMakePayment}
              totalAmount={totalDebt || totalAmount}
              allowedTenderTypes={[1, 2, 3, 4, 5]} // TODO: Pass allowed types dynamically if needed
              onCancel={() => setShowMakePayment(false)}
              onDone={handleMakePaymentDone}
              history={{
                tenders: initialData.tenders || [],
                change: initialData.tenderChange || 0
              }}
            />
          )
          }
          {refundData && (
            <PaymentMethodModal
              open={showRefundPaymentModal}
              totalAmount={refundData.total * (formData.taxExemptUsed ? 1 : 1.065)}
              allowedTenderTypes={[1, 2, 3, 4, 5]} // TODO: Pass allowed types dynamically if needed
              onCancel={() => setShowRefundPaymentModal(false)}
              onDone={handleRefundPaymentDone}
              history={{
                tenders: initialData.tenders || [],
                change: initialData.tenderChange || 0
              }}
            />
          )}
          <PaymentHistoryModal
            open={showPaymentHistory}
            onClose={() => setShowPaymentHistory(false)}
            controlNumber={initialData.controlNumber || ''}
            customerId={formData.customerId}
          />
        </>
      )}
      <AlertModal
        open={!!alertMessage}
        onOpenChange={(open) => !open && setAlertMessage(null)}
        message={alertMessage}
      />
    </div>
  );
}
