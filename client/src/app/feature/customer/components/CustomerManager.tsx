import { useRef, useState, useEffect } from 'react';
import CustomerPicker from './CustomerPicker';
import type { Customer } from '../types';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { EmployerInfoSection } from './sections/EmployerInfoSection';
import { ComplianceSection } from './sections/ComplianceSection';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertTitle } from '@/components/ui/alert';
import { Info } from 'lucide-react';

export interface CustomerPickerRef {
  handleSearch: () => void;
  handleClearAll: () => void;
  handleAddNew: () => void;
  handleScanId: () => void;
  handleSaveNew: () => void;
  handleUpdateExisting: () => void;
  editingNew: boolean;
  editingExisting: boolean;
  loading: boolean;
  saving: boolean;
  disableSearch: boolean;
}

export interface CustomerManagerProps {
  // Estado
  customer: Customer | null;
  onCustomerChange: (customer: Customer | null) => void;
  
  // Callbacks opcionales
  onCustomerSelected?: (id: string) => void;
  onCustomerSaved?: (customer: Customer) => void;
  
  // Configuración UI
  showAdditionalInfo?: boolean;
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
  showAdditionalInfo = true,
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

  const [accordionValue, setAccordionValue] = useState<string[]>(defaultOpenSections);

  const handleCustomerChange = (c: Customer | null) => {
    onCustomerChange(c);
    
    // If clearing customer (Cancel button), close additional-info section
    if (!c) {
      setAccordionValue(prev => prev.filter(section => section !== 'additional-info'));
    }
  };

  const handleCustomerSelected = (id: string) => {
    onCustomerSelected?.(id);
  };

  const handleUpdate = <K extends keyof Customer>(field: K, value: Customer[K]) => {
    if (customer) {
      const updatedCustomer = { ...customer, [field]: value };
      onCustomerChange(updatedCustomer);
      onCustomerSaved?.(updatedCustomer);
    }
  };

  // Determine the mode for Additional Information section
  const isSearchMode = !pickerState.editingNew && !pickerState.editingExisting && !customer;
  const shouldDisableAdditionalInfo = isSearchMode;

  return (
    <div className={`h-full w-full flex flex-col ${className}`}>
      <div className="flex-1 overflow-y-auto min-h-0">
        {showAlertWhenEmpty && !customer && !pickerState.editingNew && (
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
                onSelected={handleCustomerSelected}
                onStateChange={setPickerState}
              />
            </AccordionContent>
          </AccordionItem>

          {showAdditionalInfo && (
            <AccordionItem value="additional-info">
              <AccordionTrigger 
                disabled={shouldDisableAdditionalInfo}
                className="px-4 text-base font-semibold"
              >
                Additional Information
              </AccordionTrigger>
              <AccordionContent className="px-4">
                <div className="grid grid-cols-2 gap-4">
                  <EmployerInfoSection 
                    customer={customer} 
                    onUpdate={handleUpdate}
                  />
                  
                  <ComplianceSection 
                    customer={customer} 
                    onUpdate={handleUpdate}
                  />
                </div>
              </AccordionContent>
            </AccordionItem>
          )}
        </Accordion>
      </div>

      {!hideDefaultActions && (
        <div className="border-t px-4 py-2 flex items-center justify-between gap-4 flex-shrink-0">
          <div className="flex-1">
            {renderLeftActions?.(pickerState)}
          </div>

          <div className="flex gap-2 items-center">
            {!pickerState.editingNew && !pickerState.editingExisting && (
              <>
                <Button 
                  type="button" 
                  variant="secondary" 
                  onClick={() => pickerRef.current?.handleAddNew()} 
                  disabled={pickerState.loading}
                >
                  Add New
                </Button>
                <Button 
                  type="button" 
                  variant="secondary" 
                  onClick={() => pickerRef.current?.handleScanId()}
                >
                  Scan ID
                </Button>
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
            {pickerState.editingNew && (
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
            {pickerState.editingExisting && (
              <>
                <Button 
                  type="submit" 
                  form="customer-search-form"
                  disabled={pickerState.saving}
                >
                  {pickerState.saving ? 'Saving…' : 'Save'}
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
          </div>
        </div>
      )}
    </div>
  );
}
