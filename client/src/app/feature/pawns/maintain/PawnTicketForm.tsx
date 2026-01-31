import { useState, useCallback, useEffect } from 'react';
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
import { format, addDays } from 'date-fns';
import type { FormMode } from '../../_shared/pawn-ticket/types/types';
import type { PawnTicketData, CustomerData } from '@/app/feature/_shared/types/pawnTicket';
import { ViewMode } from '@/app/feature/_shared/types/viewMode';
import packageIcon from '@/assets/icons/package.svg';
import addIcon from '@/assets/icons/add.svg';
import printerIcon from '@/assets/icons/printer.svg';
import { usePawnPrint } from '@/app/feature/pawns/hooks/usePawnPrint';
import { PawnItemsTable } from '../components/PawnItemsTable';
import { AlertModal } from '@/app/shared/components/AlertModal';
import { formatDate } from '@/lib/utils';
import { VoidPawnModal } from '../../_shared/modal/VoidPawnModal';
import PaymentMethodModal, { TenderMethod } from '../../_shared/modal/PaymentMethodModal';
import { pawnTicketApi } from '@/app/core/api/pawnTicketApi';
import { DueDateCalculatorModal } from '../../payments/components/DueDateCalculatorModal';
import { PaymentHistoryModal } from '../../_shared/modal/PaymentHistoryModal';

export interface PawnFormDraftState {
  id: string;
  type: 'PAWN' | 'PURCHASE';
  periodicRate: string;
  transactionDate: string;
  maturityDate: string;
  expirationDate: string;
  forfeitDate: string;
  totalOfPayments: number;
  serviceCharge: number;
  redemptionAmount: number;
  amountFinanced: number;
  items: InventoryItemDraft[];
}

interface PawnTicketFormProps {
  readonly mode?: FormMode;
  readonly initialData?: {
    readonly id?: string;
    readonly customerId?: string;
    readonly clerkUsername?: string;
    readonly type?: 'PAWN' | 'PURCHASE';
    readonly periodicRate?: string;
    readonly transactionDate?: string;
    readonly maturityDate?: string;
    readonly expirationDate?: string;
    readonly forfeitDate?: string;
    readonly serviceCharge?: number;
    readonly redemptionAmount?: number;
    readonly totalOfPayments?: number;
    readonly amountFinanced?: number;
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
    forfeitDate?: string;
    totalOfPayments?: number;
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
  const { transformToPrintInformation, printTransactionForm, printLabels, buildPrintItems } = usePawnPrint();
  const [isPrinting, setIsPrinting] = useState(false);
  const [showLabelModal, setShowLabelModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [showReasonVoidModal, setShowReasonVoidModal] = useState(false);
  const [showVoidPawnModal, setShowVoidPawnModal] = useState(false);
  const [reasonData, setReasonData] = useState<string | null>(null);
  const [isDueDateModalOpen, setIsDueDateModalOpen] = useState(false);
  const [isPaymentHistoryModalOpen, setIsPaymentHistoryModalOpen] = useState(false);

  const handlePayHistory = useCallback(() => {
    setIsPaymentHistoryModalOpen(true);
  }, []);

  const handleDueDates = useCallback(() => {
    setIsDueDateModalOpen(true);
  }, []);

  const [localFormData, setLocalFormData] = useState({
    id: initialData?.id || '',
    customerId: initialData?.customerId || 'temp-customer',
    type: initialData?.type || 'PAWN' as const,
    periodicRate: initialData?.periodicRate || '25',
    transactionDate: initialData?.transactionDate || formatDate(new Date()),
    maturityDate: initialData?.maturityDate || formatDate(addDays(new Date(), 30)),
    expirationDate: initialData?.expirationDate || formatDate(addDays(new Date(), 60)),
    forfeitDate: initialData?.forfeitDate || formatDate(addDays(new Date(), 60)),
    items: initialData?.items || [] as InventoryItemDraft[],
    serviceCharge: initialData?.serviceCharge || 0,
    redemptionAmount: initialData?.redemptionAmount || 0,
    totalOfPayments: initialData?.totalOfPayments || 0,
    amountFinanced: initialData?.amountFinanced || 0,
  });

  // Keep local state in sync with initialData when it changes (e.g. after search)
  useEffect(() => {
    if (initialData) {
      setLocalFormData({
        id: initialData.id || '',
        customerId: initialData.customerId || 'temp-customer',
        type: initialData.type || 'PAWN',
        periodicRate: initialData.periodicRate || '25',
        transactionDate: initialData.transactionDate || formatDate(new Date()),
        maturityDate: initialData.maturityDate || formatDate(addDays(new Date(), 30)),
        expirationDate: initialData.expirationDate || formatDate(addDays(new Date(), 60)),
        forfeitDate: initialData.forfeitDate || formatDate(addDays(new Date(), 60)),
        items: initialData.items || [] as InventoryItemDraft[],
        serviceCharge: initialData.serviceCharge || 0,
        redemptionAmount: initialData.redemptionAmount || 0,
        totalOfPayments: initialData.totalOfPayments || 0,
        amountFinanced: initialData.amountFinanced || 0,
      });
    }
  }, [initialData]);

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
      setAlertMessage('Please add at least one item');
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
    if (!customer || !pawnTicket) return;

    setIsPrinting(true);
    try {
      const printInformation = transformToPrintInformation(pawnTicket as any, formData, customer);
      await printTransactionForm(printInformation);
    } finally {
      setIsPrinting(false);
    }
  }, [customer, pawnTicket, formData.items, printTransactionForm]);

  const handlePrintLabels = useCallback(() => {
    setShowLabelModal(true);
  }, []);

  const handleConfirmPrintLabels = useCallback(async (labelCounts: Record<string, number>) => {
    if (!pawnTicket || !customer) return;

    const items = formData.items.map(item => ({
      type: item.type,
      brand: item.brandName,
      model: item.model,
      serial: item.serial,
      description: item.description,
      amount: item.amount,
      quantity: item.quantity,
      ownerNumber: item.ownerNumber,
      categoryName: item.categoryName,
      subcategoryName: item.subcategoryName,
      id: item.id,
      inventoryNumber: item.ownerNumber || (item as any).inventoryNumber
    }));

    const printItems = buildPrintItems(pawnTicket as any, items as any);

    await printLabels(
      pawnTicket as any,
      customer as any,
      printItems,
      labelCounts
    );
    setShowLabelModal(false);
  }, [pawnTicket, customer, formData.items, printLabels, buildPrintItems]);

  const handleVoidPawn = useCallback(async (reason: string) => {
    setReasonData(reason)
    setShowReasonVoidModal(false)
    setShowVoidPawnModal(true)
  }, []);

  const handleVoidPawnPaymentDone = async (tenders: TenderMethod[]) => {
    if (!reasonData || !controlNumber) return;

    try {
      const payload = {
        controlNumber,
        customerId: formData.customerId,
        tenders: tenders.map(t => ({
          tenderTypeId: t.tenderTypeId,
          amount: Number(t.amount)
        }))
      };

      await pawnTicketApi.voidPawn(payload);
      setAlertMessage('Pawn voided successfully');
      setShowVoidPawnModal(false);
      window.location.reload();
    } catch (error) {
      console.error(`Failed to void pawn`, error);
      setAlertMessage(`Failed to void pawn`);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto">
      <form onSubmit={handleSubmit}>
        <TransactionDetails
          isViewMode={isViewMode || isEditMode}
          type={formData.type}
          periodicRate={formData.periodicRate}
          transactionDate={formData.transactionDate}
          maturityDate={formData.maturityDate}
          expirationDate={formData.expirationDate}
          forfeitDate={formData.forfeitDate}
          controlNumber={controlNumber}
          clerkUsername={initialData?.clerkUsername}
          totalValue={totalValue}
          serviceCharge={(formData.redemptionAmount - totalValue).toFixed(2)}
          redemptionAmount={formData.redemptionAmount.toFixed(2)}
          totalOfPayments={formData.totalOfPayments.toFixed(2)}
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
          onForfeitDateChange={(value) => {
            if (!isViewMode) updateFormData({ forfeitDate: value });
          }}
        />

        {(isViewMode || isEditMode) && controlNumber && (
          <div className="flex items-center justify-end my-2 gap-2 items-end">
            <Button
              type="button"
              size="sm"
              onClick={() => setShowReasonVoidModal(true)}
            >
              Void
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handlePayHistory}
            >
              Payment history
            </Button>
            {formData.type === 'PAWN' && (
              <>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => { }}
                >
                  Undo pay
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleDueDates}
                >
                  Due dates
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => { }}
                >
                  Increase
                </Button>
              </>
            )}


          </div>
        )}

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
              <PawnItemsTable
                items={formData.items}
                isViewMode={isViewMode}
                isEditMode={isEditMode}
                disabled={disabled}
                onView={handleViewItem}
                onEdit={handleEditItem}
                onRemove={handleRemoveItem}
              />
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

      {isEditMode && (
        <VoidPawnModal
          open={showReasonVoidModal}
          onCancel={() => setShowReasonVoidModal(false)}
          onConfirm={handleVoidPawn}
        />
      )}

      {showVoidPawnModal && (
        <PaymentMethodModal
          open={showVoidPawnModal}
          totalAmount={totalValue}
          allowedTenderTypes={[1, 2, 3, 4, 5]} // TODO: Pass allowed types dynamically if needed
          onCancel={() => setShowVoidPawnModal(false)}
          onDone={handleVoidPawnPaymentDone}
        />
      )}

      {showItemModal && (
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
      )}

      <DueDateCalculatorModal
        open={isDueDateModalOpen}
        onClose={() => setIsDueDateModalOpen(false)}
        pawnAmount={formData.amountFinanced || 0}
        transactionDate={formData.transactionDate}
        periodicRate={parseFloat(formData.periodicRate)}
      />

      <PaymentHistoryModal
        open={isPaymentHistoryModalOpen}
        onClose={() => setIsPaymentHistoryModalOpen(false)}
        controlNumber={controlNumber || ''}
        id={formData.id || ''}
        customerId={formData.customerId || ''}
        featureName={"PAWN"}
      />

      <AlertModal
        open={!!alertMessage}
        onOpenChange={(open) => !open && setAlertMessage(null)}
        message={alertMessage}
      />
    </div>
  );
}
