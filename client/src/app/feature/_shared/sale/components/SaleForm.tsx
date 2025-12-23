import { useState, useCallback } from 'react';
import { type InventoryItemDraft } from './InventoryItemModal/types';
import { SaleTransactionDetails } from './SaleTransactionDetails';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDownIcon } from 'lucide-react';
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
import type { PawnTicketData, CustomerData } from '@/app/feature/_shared/types/pawnTicket';
import packageIcon from '@/assets/icons/package.svg';
import editIcon from '@/assets/icons/edit.svg';
import deleteIcon from '@/assets/icons/delete.svg';
import visibilityIcon from '@/assets/icons/visibility.svg';
import printerIcon from '@/assets/icons/printer.svg';
import { usePawnPrint } from '@/app/feature/pawns/hooks/usePawnPrint';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { useFindAvailableItemByNumber } from '@/app/feature/sales/hooks/useFindAvailableItemByNumber';
import { InventoryItem } from '@/app/core/api/inventoryApi';


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
  readonly initialData?: {
    readonly customerId?: string;
    readonly inventoryNumber?: string;
    readonly inventoryItem?: InventoryItem;
    readonly quantity?: number;
    readonly description?: string;
    readonly priceEach?: number | string;
    readonly items?: InventoryItemDraft[];
  };
  readonly externalDraft?: SaleFormDraftState;
  readonly onDraftChange?: (draft: SaleFormDraftState) => void;
  readonly controlNumber?: string;
  readonly pawnTicket?: PawnTicketData;
  readonly customer?: CustomerData;
  readonly onSubmit?: (formData: {
    customerId: string;
    taxExemptUsed: boolean;
    items: InventoryItemDraft[];
  }) => Promise<void>;
  readonly disabled?: boolean;
  readonly taxExemptUsed?: boolean;
  readonly setTaxExemptUsed: (value: boolean) => void;
  readonly eatTax?: boolean;
  readonly setEatTax: (value: boolean) => void;
}

export function SaleForm({
  mode = 'CREATE',
  initialData,
  externalDraft,
  onDraftChange,
  controlNumber,
  pawnTicket,
  customer,
  taxExemptUsed,
  setTaxExemptUsed,
  eatTax,
  setEatTax,
  onSubmit,
  disabled = false
}: SaleTicketFormProps) {
  const isViewMode = mode === 'VIEW';
  const { findAvailableItemByNumber, isLoading, error, success } = useFindAvailableItemByNumber();
  const isControlled = externalDraft !== undefined && onDraftChange !== undefined;
  const { printTransactionForm, printLabels } = usePawnPrint();
  const [isPrinting, setIsPrinting] = useState(false);
  const [showLabelModal, setShowLabelModal] = useState(false);

  const [editingRowId, setEditingRowId] = useState<string | null>(null);

  const [localFormData, setLocalFormData] = useState({
    customerId: initialData?.customerId,
    inventoryNumber: initialData?.inventoryNumber || '',
    inventoryItem: initialData?.inventoryItem,
    description: initialData?.description || '',
    priceEach: initialData?.priceEach || '',
    quantity: initialData?.quantity,
    taxExempt: false,
    items: initialData?.items || [] as any[] // TODO: any
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

  const [showItemModal, setShowItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItemDraft | null>(null);


  // Calculate totals
  const subtotalSum = formData.items.reduce((sum, item) => {
    const price = Number(item.priceEach) || 0;
    const qty = Number(item.quantity) || 1;
    return sum + (price * qty);
  }, 0);

  let subtotal, taxAmount, totalAmount;
  if (taxExemptUsed) {
    subtotal = subtotalSum;
    taxAmount = 0;
    totalAmount = subtotalSum;
  } else if (eatTax) {
    totalAmount = subtotalSum;
    subtotal = totalAmount / 1.065;
    taxAmount = totalAmount - subtotal;
  } else {
    subtotal = subtotalSum;
    taxAmount = subtotal * TAX_RATE;
    totalAmount = subtotal + taxAmount;
  }

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    if (isViewMode || !onSubmit) {
      return;
    }

    if (formData.items.length === 0) {
      alert('Please add at least one item');
      return;
    }

    const submitData = {
      customerId: formData.customerId || '',
      taxExemptUsed: taxExemptUsed || false,
      items: formData.items
    };

    await onSubmit(submitData);
  }, [formData, onSubmit, isViewMode]);

  const handleSaveItem = useCallback((item: any) => { // TODO: any
    // Ensure numeric values are numbers
    const processedItem = {
      ...item,
      id: editingRowId || item.inventoryItem?.id || item.id || `manual-${Date.now()}`,
      priceEach: Number(item.priceEach),
      amount: Number(item.priceEach) // Map priceEach to amount for the backend
    };

    if (editingRowId) {
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
      updateFormData({
        items: [...formData.items, processedItem],
        inventoryNumber: '',
        inventoryItem: undefined,
        description: '',
        priceEach: '',
        quantity: undefined
      });
    }

    setShowItemModal(false);
    setEditingItem(null);
  }, [editingRowId, formData.items, updateFormData]);

  const handleEditItem = useCallback((item: InventoryItemDraft) => {
    setEditingRowId(item.id || null);
    updateFormData({
      inventoryNumber: item.inventoryItem?.inventoryNumber || item.inventoryNumber || '',
      inventoryItem: item.inventoryItem,
      description: item.description,
      quantity: typeof item.quantity === 'number' ? item.quantity : Number(item.quantity),
      priceEach: typeof item.priceEach === 'number' ? item.priceEach : Number(item.priceEach),
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

  const handleViewItem = useCallback((item: InventoryItemDraft) => {
    setEditingItem(item);
    setShowItemModal(true);
  }, []);

  const handleRemoveItem = useCallback((itemId: string) => {
    if (itemId === editingRowId) {
      handleCancelEdit();
    }
    updateFormData({
      items: formData.items.filter(i => i.id !== itemId)
    });
  }, [formData.items, updateFormData, editingRowId, handleCancelEdit]);

  const handlePrintTicket = useCallback(async () => {
    if (!controlNumber || !customer || !pawnTicket) return;

    setIsPrinting(true);
    try {
      const customerData = {
        id: customer.id,
        firstName: customer.firstName,
        middleName: customer.middleName || '',
        lastName: customer.lastName,
        secondLastName: customer.secondLastName || '',
        idType: customer.idType || '',
        idNumber: customer.idNumber || '',
        phoneNumber: customer.phoneNumber || '',
        address: customer.streetAddress || '',
        city: customer.city || '',
        zipCode: customer.zipCode || ''
      };

      const items = formData.items.map(item => ({
        type: item.type,
        brand: item.brandName,
        model: item.model,
        serial: item.serial,
        description: item.description,
        amount: item.amount,
        quantity: item.quantity,
        ownerNumber: item.ownerNumber
      }));

      await printTransactionForm({ ticket: pawnTicket, customer: customerData, items });
    } finally {
      setIsPrinting(false);
    }
  }, [controlNumber, customer, pawnTicket, formData.items, printTransactionForm]);

  const handlePrintLabels = useCallback(() => {
    setShowLabelModal(true);
  }, []);

  const handleConfirmPrintLabels = useCallback(async (labelCounts: Record<string, number>) => {
    if (!controlNumber) return;

    await printLabels(
      controlNumber,
      formData.items.map(item => ({
        id: item.id || '',
        inventoryNumber: item.ownerNumber || '',
        description: item.description || `${item.brandName || ''} ${item.model || ''}`.trim(),
        amount: item.amount || '0',
        quantity: Number(item.quantity) || 1
      })),
      labelCounts
    );
    setShowLabelModal(false);
  }, [controlNumber, formData.items, printLabels]);

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
      console.error("Item not found", e);
      // Optional: Clear inventoryItem if search fails to allow manual entry?
      // updateFormData({ inventoryItem: undefined });
      // Actually, if it fails, we assume manual entry. 
      // We don't want to clear the inventoryNumber they typed.
    }
  }, [updateFormData, findAvailableItemByNumber]);

  const handleFieldByKey = useCallback((key: string, value: any) => {
    updateFormData({ [key]: value });
  }, [updateFormData]);

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
          handleFieldByKey={handleFieldByKey}
          disabled={isViewMode}
          customer={customer}
          taxExemptUsed={taxExemptUsed}
          setTaxExemptUsed={setTaxExemptUsed}
          isEditing={!!editingRowId}
          onCancelEdit={handleCancelEdit}
        />

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
                    <TableHead sticky className="bg-white z-20">Exempt</TableHead>
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
                        {item.inventoryItem?.inventoryNumber || item.inventoryNumber}
                      </TableCell>
                      <TableCell>{item.description || ''}</TableCell>
                      <TableCell>{item.quantity || 1}</TableCell>
                      <TableCell>${Number(item.priceEach || 0).toFixed(2)}</TableCell>
                      <TableCell className="font-medium">${(Number(item.priceEach || 0) * Number(item.quantity || 1)).toFixed(2)}</TableCell>
                      <TableCell>
                        {item.taxExempt ? 'Yes' : 'No'}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex gap-2 justify-center items-center">
                          {isViewMode ? (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleViewItem(item)}
                            >
                              <img
                                src={visibilityIcon}
                                alt="View"
                                className="w-4 h-4"
                                style={{ filter: 'brightness(0) saturate(100%)' }}
                              />
                            </Button>
                          ) : (
                            <>
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
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {isViewMode && controlNumber && (
          <div className="flex justify-center mt-6">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="secondary"
                  size="lg"
                  disabled={isPrinting}
                  className="px-8 flex items-center gap-2"
                >
                  <img src={printerIcon} alt="Print" className="w-5 h-5 brightness-0" />
                  {isPrinting ? 'Printing...' : 'Print'}
                  <ChevronDownIcon className="h-4 w-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuGroup>
                  <DropdownMenuItem onClick={handlePrintTicket} disabled={isPrinting}>
                    {' '}Print Ticket
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handlePrintLabels}>
                    {' '}Print Labels
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        {!isViewMode && (
          <div className="flex justify-end mt-2 gap-2 items-end">
            <Button
              type="submit"
              disabled={disabled || formData.items.length === 0}
              size="lg"
              className="px-8"
            >
              {disabled ? 'Processing...' : `Save sale`}
            </Button>
            <div>
              <Label>Subtotal</Label>
              <Input
                type="number"
                step="0.01"
                value={subtotal.toFixed(2)}
                readOnly
                disabled={true} // Always disabled/read-only to user
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
            <div className="flex gap-2 items-center pb-2">
              <Checkbox
                id="eatTax"
                checked={eatTax}
                onCheckedChange={(checked) => setEatTax(checked === true)}
                disabled={disabled}
              />
              <Label htmlFor="eatTax" className="mb-0">Eat tax?</Label>
            </div>
          </div>
        )}
      </form>

    </div>
  );
}
