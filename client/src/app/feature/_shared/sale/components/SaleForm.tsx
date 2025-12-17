import { useState, useCallback } from 'react';
import { type InventoryItemDraft } from './InventoryItemModal';
import { PrintLabelsModal } from './PrintLabelsModal';
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
import { ScrollArea } from '@/components/ui/scroll-area';
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
import { Label } from '@radix-ui/react-dropdown-menu';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { useFindAvailableItemByNumber } from '@/app/feature/sales/hooks/useFindAvailableItemByNumber';
import { InventoryItem } from '@/app/core/api/inventoryApi';


export interface SaleFormDraftState {
  inventoryNumber: string;
  quantity: number;
  description: string;
  priceEach: number;
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
    readonly priceEach?: number;
    readonly items?: InventoryItemDraft[];
  };
  readonly externalDraft?: SaleFormDraftState;
  readonly onDraftChange?: (draft: SaleFormDraftState) => void;
  readonly controlNumber?: string;
  readonly pawnTicket?: PawnTicketData;
  readonly customer?: CustomerData;
  readonly onSubmit?: (formData: {
    customerId: string;
    inventoryNumber: string;
    inventoryItem: InventoryItem;
    quantity: number;
    items: InventoryItemDraft[];
  }) => Promise<void>;
  readonly disabled?: boolean;
}

export function SaleForm({
  mode = 'CREATE',
  initialData,
  externalDraft,
  onDraftChange,
  controlNumber,
  pawnTicket,
  customer,
  onSubmit,
  disabled = false
}: SaleTicketFormProps) {
  const isViewMode = mode === 'VIEW';
  const { findAvailableItemByNumber, isLoading, error, success } = useFindAvailableItemByNumber();
  const isControlled = externalDraft !== undefined && onDraftChange !== undefined;
  const { printTransactionForm, printLabels } = usePawnPrint();
  const [isPrinting, setIsPrinting] = useState(false);
  const [showLabelModal, setShowLabelModal] = useState(false);

  const [localFormData, setLocalFormData] = useState({
    customerId: initialData?.customerId || 'temp-customer',
    inventoryNumber: initialData?.inventoryNumber || '',
    inventoryItem: initialData?.inventoryItem,
    description: initialData?.description || '',
    priceEach: initialData?.priceEach,
    quantity: initialData?.quantity,
    items: initialData?.items || [] as any[] // TODO: any
  });

  const formData = isControlled ? {
    customerId: initialData?.customerId || 'temp-customer',
    inventoryItem: initialData?.inventoryItem,
    ...externalDraft
  } : localFormData;

  const updateFormData = useCallback((updates: Partial<typeof localFormData>) => {
    if (isControlled && onDraftChange) {
      const { customerId, ...draftUpdates } = updates;
      onDraftChange({ ...externalDraft, ...draftUpdates });
    } else {
      setLocalFormData(prev => ({ ...prev, ...updates }));
    }
  }, [isControlled, onDraftChange, externalDraft]);

  const [showItemModal, setShowItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItemDraft | null>(null);


  const totalValue = formData.items.reduce((sum, item) => {
    const value = Number(item.amount) || 0;
    const quantity = Number(item.quantity) || 1;
    return sum + (value * quantity);
  }, 0);

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
      customerId: formData.customerId,
      items: formData.items
    };

    await onSubmit(submitData);
  }, [formData, totalValue, onSubmit, isViewMode]);

  const handleSaveItem = useCallback((item: any) => { // TODO: any
    if (editingItem) {
      updateFormData({
        items: formData.items.map(i => i.inventoryItem.id === item.inventoryItem.id ? item : i)
      });
    } else {
      updateFormData({
        items: [...formData.items, item]
      });
    }

    setShowItemModal(false);
    setEditingItem(null);
  }, [editingItem, formData.items, updateFormData]);

  const handleEditItem = useCallback((item: InventoryItemDraft) => {
    setEditingItem(item);
    setShowItemModal(true);
  }, []);

  const handleViewItem = useCallback((item: InventoryItemDraft) => {
    setEditingItem(item);
    setShowItemModal(true);
  }, []);

  const handleRemoveItem = useCallback((itemId: string) => {
    updateFormData({
      items: formData.items.filter(i => i.id !== itemId)
    });
  }, [formData.items, updateFormData]);

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
    const item = await findAvailableItemByNumber(inventoryItem);
    updateFormData({
      inventoryItem: item,
      description: item.itemDescription || item.description || '',
      quantity: 1,
      priceEach: item.resale || 0
    });
  }, [updateFormData, findAvailableItemByNumber]);

  const handleQuantityChange = useCallback((quantity: number) => {
    updateFormData({ quantity });
  }, [updateFormData]);


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
        />

        <Card className="border-2">
          <CardHeader className="bg-slate-50 border-b flex flex-row items-center justify-between py-4">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <img src={packageIcon} alt="Items" className="w-5 h-5" /> Items <Badge variant="secondary">{formData.items.length}</Badge>
            </CardTitle>
          </CardHeader>

          <CardContent className="p-0">
            <ScrollArea className="max-h-[400px]">
              {formData.items.length === 0 ? (
                <div className="py-10 text-center text-gray-500">
                  No items added yet. Click "Add Item" to get started.
                </div>
              ) : (
                <div>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Inventory #</TableHead>
                          <TableHead className="w-[300px]">Item description</TableHead>
                          <TableHead>Quantity</TableHead>
                          <TableHead>Price each</TableHead>
                          <TableHead>Ext. price</TableHead>
                          <TableHead>Exempt</TableHead>
                          <TableHead className="text-center">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {formData.items.map((item) => (
                          <TableRow key={item.inventoryItem.id}>
                            <TableCell>
                              {item.inventoryItem.inventoryNumber}
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
                                      disabled={disabled}
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
                  </div>
                </div>
              )}
            </ScrollArea>
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

        <PrintLabelsModal
          open={showLabelModal}
          controlNumber={controlNumber || ''}
          items={formData.items.map(item => ({
            id: item.id || '',
            inventoryNumber: item.ownerNumber || '',
            description: item.description || `${item.brandName || ''} ${item.model || ''}`.trim(),
            amount: item.amount || '0',
            quantity: Number(item.quantity) || 1
          }))}
          onPrint={handleConfirmPrintLabels}
          onCancel={() => setShowLabelModal(false)}
        />

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
                value={0}
                onChange={(e) => { }}
                disabled={disabled}
              />
            </div>
            <div>
              <Label>Tax</Label>
              <Input
                type="number"
                step="0.01"
                value={0}
                onChange={(e) => { }}
                disabled={disabled}
              />
            </div>
            <div>
              <Label>Total</Label>
              <Input
                type="number"
                step="0.01"
                value={0}
                onChange={(e) => { }}
                disabled={disabled}
              />
            </div>
            <div className="flex gap-2">
              <Checkbox></Checkbox>
              <Label>Eat tax?</Label>
            </div>
          </div>
        )}
      </form>

    </div>
  );
}
