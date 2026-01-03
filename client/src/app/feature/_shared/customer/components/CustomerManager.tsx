import { useRef, useState, useEffect, useCallback } from 'react';
import CustomerPicker, { type CustomerPickerRef } from './CustomerPicker';
import type { Customer } from '../types';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { EmployerInfoSection } from './sections/EmployerInfoSection';
import { ComplianceSection } from './sections/ComplianceSection';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertTitle } from '@/components/ui/alert';
import { Info } from 'lucide-react';
import { recordToDto } from '../mappers';
import { ScrollArea } from '@/components/ui/scroll-area';

export interface CustomerManagerProps {
  // Estado
  customer: Customer | null;
  onCustomerChange: (customer: Customer | null) => void;

  // Callbacks opcionales
  onCustomerSelected?: (id: string) => void;
  onCustomerSaved?: (customer: Customer) => void;
  onFindByTicket?: () => void;

  // Configuración UI
  workflowMode?: 'pawn' | 'payment';
  showAlertWhenEmpty?: boolean;

  // Acciones personalizadas (render prop para acciones customizadas)
  renderLeftActions?: (state: {
    editingNew: boolean;
    editingExisting: boolean;
    loading: boolean;
    saving: boolean;
  }) => React.ReactNode;

  // Ocultar acciones por defecto
  hideDefaultActions?: boolean;

  // Estilos
  className?: string;

  // Accordion config
  defaultOpenSections?: string[];
}

export default function CustomerManager({
  customer,
  onCustomerChange,
  onCustomerSelected,
  onCustomerSaved,
  onFindByTicket,
  workflowMode = 'pawn',
  showAlertWhenEmpty = true,
  renderLeftActions,
  hideDefaultActions = false,
  className = '',
  defaultOpenSections = ['customer-info'],
}: Readonly<CustomerManagerProps>) {
  const pickerRef = useRef<CustomerPickerRef>(null);
  const [pickerState, setPickerState] = useState<{
    editingNew: boolean;
    editingExisting: boolean;
    loading: boolean;
    saving: boolean;
    disableSearch: boolean;
  }>({
    editingNew: false,
    editingExisting: false,
    loading: false,
    saving: false,
    disableSearch: true,
  });

  const [draftCustomer, setDraftCustomer] = useState<Customer | null>(null);
  const [accordionValue, setAccordionValue] = useState<string[]>(defaultOpenSections);

  const editMode = pickerState.editingNew ? 'create' : (pickerState.editingExisting ? 'update' : 'search');

  // Keep a ref to customer to avoid recreating handleUpdate on every change
  const customerRef = useRef(customer);
  useEffect(() => { customerRef.current = customer; }, [customer]);

  useEffect(() => {
    if (editMode === 'search') {
      setAccordionValue(prev => prev.filter(section => section !== 'additional-info'));
    }
  }, [editMode]);

  const handleCustomerChange = useCallback((c: Customer | null) => {
    onCustomerChange(c);

    // If clearing customer (Cancel button), close additional-info section
    if (!c) {
      setAccordionValue(prev => prev.filter(section => section !== 'additional-info'));
      setDraftCustomer(null);
    }
  }, [onCustomerChange]);

  const handleFormChange = useCallback((data: import('../mappers').CustomerRecord) => {
    if (pickerState.editingNew) {
      setDraftCustomer(recordToDto(data, ''));
    }
  }, [pickerState.editingNew]);

  const handleCustomerSelected = useCallback((id: string) => {
    onCustomerSelected?.(id);
  }, [onCustomerSelected]);

  const handleUpdate = useCallback(<K extends keyof Customer>(field: K, value: Customer[K]) => {
    if (customerRef.current) {
      const updatedCustomer = { ...customerRef.current, [field]: value };
      onCustomerChange(updatedCustomer);
      onCustomerSaved?.(updatedCustomer);
    } else if (pickerRef.current) {
      pickerRef.current.updateFormField(field as any, value as any);
    }
  }, [onCustomerChange, onCustomerSaved]);

  const displayCustomer = customer || (editMode === 'create' ? draftCustomer : null);

  return (
    <div className={`h-[calc(100vh-100px)] w-full flex flex-col ${className}`}>
      <ScrollArea className="flex-1 max-h-[calc(100vh-200px)]">
        {showAlertWhenEmpty && editMode === 'search' && (
          <div className="px-4 pt-1">
            <Alert variant="info">
              <Info className="h-3.5 w-3.5" />
              <AlertTitle className="mb-0">Pick an existing customer or create a new one to continue.</AlertTitle>
            </Alert>
          </div>
        )}

        <Accordion type="multiple" value={accordionValue} onValueChange={setAccordionValue} className="w-full">
          <AccordionItem value="customer-info">
            <AccordionTrigger className="px-4 text-base font-semibold">
              Customer Information
            </AccordionTrigger>
            <AccordionContent className="px-4">
              <CustomerPicker
                ref={pickerRef}
                value={customer}
                onChange={handleCustomerChange}
                onFormChange={handleFormChange}
                onSelected={handleCustomerSelected}
                onStateChange={setPickerState}
              />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="additional-info">
            <AccordionTrigger
              disabled={editMode === 'search'}
              className="px-4 text-base font-semibold"
            >
              Additional Information
            </AccordionTrigger>
            <AccordionContent className="px-4">
              <div className="grid grid-cols-2 gap-4">
                <EmployerInfoSection
                  employerName={displayCustomer?.employerName}
                  employerAddress={displayCustomer?.employerAddress}
                  employerCity={displayCustomer?.employerCity}
                  employerState={displayCustomer?.employerState}
                  employerZip={displayCustomer?.employerZip}
                  employerPhoneNumber={displayCustomer?.employerPhoneNumber}
                  onUpdate={handleUpdate}
                />

                <ComplianceSection
                  fflNumber={displayCustomer?.fflNumber}
                  fflExpireDate={displayCustomer?.fflExpireDate}
                  taxId={displayCustomer?.taxId}
                  military={displayCustomer?.military}
                  locked={displayCustomer?.locked}
                  taxExempt={displayCustomer?.taxExempt}
                  onUpdate={handleUpdate}
                />
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {!hideDefaultActions && (
          <div className="border-t px-4 py-2 flex items-center justify-between gap-4 flex-shrink-0">
            <div className="flex-1">
              {renderLeftActions?.(pickerState)}
            </div>

            <div className="flex gap-2 items-center">
              {editMode === 'search' && (
                <>
                  {workflowMode === 'pawn' && (
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => pickerRef.current?.handleAddNew()}
                      disabled={pickerState.loading}
                    >
                      Add New
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => pickerRef.current?.handleScanId()}
                  >
                    Scan ID
                  </Button>
                  {workflowMode === 'payment' && onFindByTicket && (
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={onFindByTicket}
                    >
                      Find by Ticket
                    </Button>
                  )}
                  <Separator orientation="vertical" className="h-8" />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => pickerRef.current?.handleClearAll()}
                    disabled={pickerState.loading}
                  >
                    Clear
                  </Button>
                  <Button
                    type="submit"
                    form="customer-search-form"
                    disabled={pickerState.disableSearch || pickerState.loading}
                    className="w-24"
                  >
                    {pickerState.loading ? 'Searching…' : 'Find'}
                  </Button>
                </>
              )}
              {editMode === 'create' && (
                <>
                  <Button
                    type="submit"
                    form="customer-search-form"
                    disabled={pickerState.saving}
                  >
                    {pickerState.saving ? 'Saving…' : 'Save Customer'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => pickerRef.current?.handleClearAll()}
                    disabled={pickerState.saving}
                  >
                    Cancel
                  </Button>
                </>
              )}
              {editMode === 'update' && (
                <>
                  <Button
                    type="submit"
                    form="customer-search-form"
                    disabled={pickerState.saving}
                  >
                    {pickerState.saving ? 'Updating…' : 'Update Customer'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => pickerRef.current?.handleClearAll()}
                    disabled={pickerState.saving}
                  >
                    Change Customer
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
