import { useState, useCallback } from 'react';
import { InventoryItemModal, type InventoryItemDraft } from '@/app/feature/_shared/inventory-item';
import { PrintLabelsModal } from '../../_shared/pawn-ticket/components/PrintLabelsModal';
import { TransactionDetails } from '../../_shared/pawn-ticket/components/TransactionDetails';
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
import { format, addDays } from 'date-fns';
import type { FormMode } from '../../_shared/pawn-ticket/types/types';
import type { PawnTicketData, CustomerData } from '@/app/feature/_shared/types/pawnTicket';
import { ViewMode } from '@/app/feature/_shared/types/viewMode';
import packageIcon from '@/assets/icons/package.svg';
import addIcon from '@/assets/icons/add.svg';
import editIcon from '@/assets/icons/edit.svg';
import deleteIcon from '@/assets/icons/delete.svg';
import visibilityIcon from '@/assets/icons/visibility.svg';
import printerIcon from '@/assets/icons/printer.svg';
import { usePawnPrint } from '@/app/feature/pawns/hooks/usePawnPrint';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export interface PawnFormDraftState {
  type: 'PAWN' | 'PURCHASE';
  periodicRate: string;
  transactionDate: string;
  maturityDate: string;
  expirationDate: string;
  items: InventoryItemDraft[];
}

export interface PawnFormDraftState {
  type: 'PAWN' | 'PURCHASE';
  periodicRate: string;
  transactionDate: string;
  maturityDate: string;
  expirationDate: string;
  items: InventoryItemDraft[];
}

interface PawnTicketFormProps {
  readonly mode?: FormMode;
  readonly initialData?: {
    readonly customerId?: string;
    readonly type?: 'PAWN' | 'PURCHASE';
    readonly periodicRate?: string;
    readonly transactionDate?: string;
    readonly maturityDate?: string;
    readonly expirationDate?: string;
    readonly items?: InventoryItemDraft[];
  };
  readonly externalDraft?: PawnFormDraftState;
  readonly onDraftChange?: (draft: PawnFormDraftState) => void;
  readonly controlNumber?: string;
  readonly pawnTicket?: PawnTicketData;
  readonly customer?: CustomerData;
  readonly onSubmit?: (formData: {
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
  readonly disabled?: boolean;
}

export function PawnTicketForm({
  mode = 'CREATE',
  initialData,
  externalDraft,
  onDraftChange,
  controlNumber,
  pawnTicket,
  customer,
  onSubmit,
  disabled = false
}: PawnTicketFormProps) {
  const isViewMode = mode === 'VIEW';
  const isEditMode = mode === 'MODIFY';
  const isControlled = externalDraft !== undefined && onDraftChange !== undefined;
  const { printTransactionForm, printLabels } = usePawnPrint();
  const [isPrinting, setIsPrinting] = useState(false);
  const [showLabelModal, setShowLabelModal] = useState(false);

  const [localFormData, setLocalFormData] = useState({
    customerId: initialData?.customerId || 'temp-customer',
    type: initialData?.type || 'PAWN' as const,
    periodicRate: initialData?.periodicRate || '25',
    transactionDate: initialData?.transactionDate || format(new Date(), 'yyyy-MM-dd'),
    maturityDate: initialData?.maturityDate || format(addDays(new Date(), 30), 'yyyy-MM-dd'),
    expirationDate: initialData?.expirationDate || format(addDays(new Date(), 60), 'yyyy-MM-dd'),
    items: initialData?.items || [] as InventoryItemDraft[]
  });

  const formData = isControlled ? {
    customerId: initialData?.customerId || 'temp-customer',
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
  }, [formData, totalValue, onSubmit, isViewMode]);

  const handleSaveItem = useCallback((item: InventoryItemDraft) => {
    if (editingItem) {
      updateFormData({
        items: formData.items.map(i => i.id === item.id ? item : i)
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
          disabled={isViewMode}
          onTypeChange={(value) => {
            if (!isViewMode) updateFormData({ type: value });
          }}
          onPeriodicRateChange={(value) => {
            if (!isViewMode) updateFormData({ periodicRate: value });
          }}
          onTransactionDateChange={(value) => {
            if (!isViewMode) updateFormData({ transactionDate: value });
          }}
          onMaturityDateChange={(value) => {
            if (!isViewMode) updateFormData({ maturityDate: value });
          }}
          onExpirationDateChange={(value) => {
            if (!isViewMode) updateFormData({ expirationDate: value });
          }}
        />

        <Card className="border-2">
          <CardHeader className="bg-slate-50 border-b flex flex-row items-center justify-between py-4">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <img src={packageIcon} alt="Items" className="w-5 h-5" /> Items <Badge variant="secondary">{formData.items.length}</Badge>
            </CardTitle>
            {!isViewMode && (
              <Button
                type="button"
                onClick={() => setShowItemModal(true)}
                disabled={disabled}
                size="sm"
              >
                <img src={addIcon} alt="Add" className="w-4 h-4 mr-1 brightness-0 invert" /> Add Item
              </Button>
            )}
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
                    <TableHead sticky className="w-[300px] bg-white z-20">Item</TableHead>
                    <TableHead sticky className="bg-white z-20">Quantity</TableHead>
                    <TableHead sticky className="bg-white z-20">Value</TableHead>
                    <TableHead sticky className="bg-white z-20">Total</TableHead>
                    <TableHead sticky className="text-center bg-white z-20">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {formData.items.map((item) => (
                    <TableRow
                      key={item.id}
                    >
                      <TableCell><div>
                        <div className="font-semibold">{item.categoryName || item.type}</div>
                        {item.brandName && <div className="text-sm text-gray-600">Brand: {item.brandName}</div>}
                        {item.model && <div className="text-sm text-gray-600">Model: {item.model}</div>}
                      </div></TableCell>
                      <TableCell>{item.quantity || 1}</TableCell>
                      <TableCell>${Number(item.amount || 0).toFixed(2)}</TableCell>
                      <TableCell className="font-medium">${(Number(item.amount || 0) * Number(item.quantity || 1)).toFixed(2)}</TableCell>
                      <TableCell className="text-center">
                        <div className="flex gap-2 justify-center items-center">
                          {isViewMode ? (
                            <button
                              type="button"
                              onClick={() => handleViewItem(item)}
                              className="cursor-pointer hover:opacity-70"
                            >
                              <img
                                src={visibilityIcon}
                                alt="View"
                                className="w-5 h-5"
                                style={{ filter: 'brightness(0) saturate(100%)' }}
                              />
                            </button>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => handleEditItem(item)}
                                disabled={disabled}
                                className="cursor-pointer hover:opacity-70 disabled:opacity-30 !p-0"
                              >
                                <img src={editIcon} alt="Edit" className="w-6 h-6" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(item.id!)}
                                disabled={disabled}
                                className="cursor-pointer hover:opacity-70 disabled:opacity-30 !p-0"
                              >
                                <img src={deleteIcon} alt="Delete" className="w-6 h-6" />
                              </button>
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

        {(isViewMode || isEditMode) && controlNumber && (
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

        {mode === 'CREATE' && (
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
        )}
      </form>

      <InventoryItemModal
        mode={(() => {
          if (isViewMode) return ViewMode.VIEW;
          if (editingItem) return ViewMode.MODIFY;
          return ViewMode.CREATE;
        })()}
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
