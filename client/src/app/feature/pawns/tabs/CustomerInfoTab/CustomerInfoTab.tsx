import { useRef, useState } from 'react';
import { usePawnWorkflow } from '../../contexts/PawnWorkflowContext';
import CustomerPicker from './components/CustomerPicker';
import type { Customer } from './types';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { EmployerInfoSection } from './components/sections/EmployerInfoSection';
import { ComplianceSection } from './components/sections/ComplianceSection';
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
  editingNew: boolean;
  loading: boolean;
  saving: boolean;
  disableSearch: boolean;
}

export default function CustomerInfoTab() {
  const { customer, setCustomer, setActiveTab, openCancelModal } = usePawnWorkflow();
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

  const handleCustomerChange = (c: Customer | null) => {
    setCustomer(c);
  };

  const handleCustomerSelected = (id: string) => {
    // Cuando se selecciona un customer, avanzar al tab de New Pawn
    setActiveTab('newPawn');
  };

  const handleUpdate = <K extends keyof Customer>(field: K, value: Customer[K]) => {
    if (customer) {
      setCustomer({ ...customer, [field]: value });
    }
  };

  // Additional info should be available when customer exists or when creating new
  const canShowAdditionalInfo = !!customer || pickerState.editingNew;

  return (
    <div className="h-full w-full flex flex-col">
      <div className="flex-1 overflow-y-auto">
        {!customer && !pickerState.editingNew && (
          <div className="px-4 pt-1">
            <Alert variant="info">
              <Info className="h-3.5 w-3.5" />
              <AlertTitle className="mb-0">Pick an existing customer or create a new one to continue.</AlertTitle>
            </Alert>
          </div>
        )}

        <Accordion type="multiple" defaultValue={["customer-info"]} className="w-full">
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
                onCancelTransaction={openCancelModal}
                onStateChange={setPickerState}
              />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="additional-info" disabled={!canShowAdditionalInfo}>
            <AccordionTrigger className="px-4 text-base font-semibold">
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
        </Accordion>
      </div>

      <div className="border-t p-4 flex items-center justify-between gap-4">
        <div className="flex-1">
          {!pickerState.editingNew && (
            <Button 
              type="button" 
              variant="destructive" 
              onClick={openCancelModal}
            >
              Cancel Transaction
            </Button>
          )}
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
                type="button" 
                onClick={() => pickerRef.current?.handleSearch()} 
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
                type="button" 
                onClick={() => pickerRef.current?.handleSaveNew()} 
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
                type="button" 
                onClick={() => pickerRef.current?.handleUpdateExisting()} 
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
    </div>
  );
}
