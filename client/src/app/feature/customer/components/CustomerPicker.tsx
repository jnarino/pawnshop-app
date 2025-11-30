import { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import type { Customer as CustomerDto } from '../types';
import { recordToDto } from '../mappers';
import './CustomerPicker.css';
import { IdentityContactSection } from './sections/IdentityContactSection';
import { AddressSection } from './sections/AddressSection';
import { GovernmentIdSection } from './sections/GovernmentIdSection';
import { PhysicalTraitsSection } from './sections/PhysicalTraitsSection';
import { NotesSection } from './sections/NotesSection';
import { SearchResultsModal } from './SearchResultsModal';
import { CustomerIdScanModal } from './CustomerIdScanModal';
import { IdConflictModal } from './IdConflictModal';
import { useCustomerForm } from '../hooks/useCustomerForm';
import { useCustomerSearch } from '../hooks/useCustomerSearch';
import { useCustomerSave } from '../hooks/useCustomerSave';
import { useIdScanHandler } from '../hooks/useIdScanHandler';
import { EYE_COLORS, HAIR_COLORS, RACES, ID_TYPES } from '../constants/customerConstants';

interface Props {
  value?: CustomerDto | null;
  onChange?: (c: CustomerDto | null) => void;
  onCreateNew?(tempId: string): void;
  onSelected?(id: string): void;
  onCancelTransaction?(): void;
  onFormChange?: (data: import('../mappers').CustomerRecord) => void;
  onStateChange?(state: {
    editingNew: boolean;
    editingExisting: boolean;
    loading: boolean;
    saving: boolean;
    disableSearch: boolean;
  }): void;
}

export interface CustomerPickerRef {
  handleSearch: () => void;
  handleClearAll: () => void;
  handleAddNew: () => void;
  handleScanId: () => void;
  handleSaveNew: () => void;
  handleUpdateExisting: () => void;
  updateFormField: <K extends keyof import('../mappers').CustomerRecord>(field: K, value: import('../mappers').CustomerRecord[K]) => void;
  editingNew: boolean;
  editingExisting: boolean;
  loading: boolean;
  saving: boolean;
  disableSearch: boolean;
}

const CustomerPicker = forwardRef<CustomerPickerRef, Props>(({ value, onChange, onSelected, onCreateNew, onCancelTransaction, onStateChange, onFormChange }, ref) => {
  const [editingNew, setEditingNew] = useState(false);
  const [editingExisting, setEditingExisting] = useState(false);

  const customerForm = useCustomerForm(value);
  const customerSearch = useCustomerSearch();
  const customerSave = useCustomerSave();
  const idScanHandler = useIdScanHandler({
    onSelected,
    onChange,
    setForm: customerForm.setForm,
    setModalEmpty: customerSearch.setModalEmpty,
    setSearchFromScan: customerSearch.setSearchFromScan,
    setSearchModalOpen: customerSearch.setSearchModalOpen,
    setStatusMessage: customerSave.setStatusMessage,
    setError: () => {},
  });

  useEffect(() => {
    if (value) {
      customerForm.setForm(value as any);
      setEditingExisting(true);
    } else {
      setEditingExisting(false);
    }
  }, [value]);

  // Notify parent of form changes
  useEffect(() => {
    onFormChange?.(customerForm.form);
  }, [customerForm.form, onFormChange]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (customerSearch.searchModalOpen) {
          customerSearch.closeModal();
          e.stopPropagation();
          return;
        }
        if (idScanHandler.scanModalOpen) {
          idScanHandler.setScanModalOpen(false);
          e.stopPropagation();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [customerSearch.searchModalOpen, idScanHandler.scanModalOpen]);

  // Find button enabled only if at least one of: First Name, Last Name, or DOB has a value
  const disableSearch = !customerForm.form.firstName && !customerForm.form.lastName && 
                        !customerForm.form.dateOfBirth;

  // Notify parent of state changes
  useEffect(() => {
    onStateChange?.({
      editingNew,
      editingExisting,
      loading: customerSearch.loading,
      saving: customerSave.saving,
      disableSearch,
    });
  }, [editingNew, editingExisting, customerSearch.loading, customerSave.saving, disableSearch, onStateChange]);

  const handleFormSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    
    // If editing, save the customer
    if (editingNew) {
      await handleSaveNew();
    } else if (editingExisting) {
      await handleUpdateExisting();
    } else {
      // Otherwise, perform search
      await customerSearch.search({
        firstName: customerForm.form.firstName,
        lastName: customerForm.form.lastName,
        dateOfBirth: customerForm.form.dateOfBirth || undefined,
        idNumber: customerForm.form.idNumber || undefined,
      });
    }
  };

  const handleClearAll = () => {
    customerForm.clearForm();
    customerSearch.resetSearch();
    setEditingNew(false);
    setEditingExisting(false);
    customerSave.clearStatus();
    idScanHandler.clearScanData();
    onChange?.(null);
  };

  const handleAddNew = () => {
    customerForm.clearForm();
    setEditingNew(true);
    customerSearch.resetSearch();
    onChange?.(null);
    onCreateNew?.(crypto.randomUUID());
  };

  const handleSaveNew = async () => {
    const newId = await customerSave.saveNew(customerForm.form);
    if (newId) {
      setEditingNew(false);
      onSelected?.(newId);
      onChange?.(recordToDto(customerForm.form, newId));
    }
  };

  const handleUpdateExisting = async () => {
    if (!value?.id) return;
    const success = await customerSave.updateExisting(customerForm.form, value.id);
    if (success) {
      setEditingExisting(false);
      onChange?.(recordToDto(customerForm.form, value.id));
    }
  };

  const handleScanId = () => {
    idScanHandler.setScanModalOpen(true);
  };

  // Expose methods to parent via ref
  useImperativeHandle(ref, () => ({
    handleSearch: handleFormSubmit,
    handleClearAll,
    handleAddNew,
    handleScanId,
    handleSaveNew,
    handleUpdateExisting,
    updateFormField: customerForm.update,
    editingNew,
    editingExisting,
    loading: customerSearch.loading,
    saving: customerSave.saving,
    disableSearch,
  }));

  const handleSelectCustomer = (id: string, record: any) => {
    onSelected?.(id);
    customerForm.setForm(record);
    onChange?.(recordToDto(record, id));
    customerSearch.closeModal();
  };

  const canAddFromScan = !!idScanHandler.lastScanData && customerSearch.modalEmpty;
  const containerClass = 'customer-lookup' + (editingNew ? ' is-editing-new' : '');

  return (
    <div className={containerClass}>
      <form 
        id="customer-search-form" 
        onSubmit={handleFormSubmit} 
        aria-label="Customer search / create"
      >
        <div className="grid grid-cols-3 gap-3">
          <IdentityContactSection 
            form={customerForm.form} 
            update={customerForm.update} 
            editing={editingNew || editingExisting} 
          />
          
          <div className="col-span-2 flex flex-col gap-2">
            <AddressSection 
              form={customerForm.form} 
              update={customerForm.update} 
              editing={editingNew || editingExisting} 
              useIdAddr={customerForm.useIdAddr}
              setUseIdAddr={customerForm.setUseIdAddr}
            />
            <GovernmentIdSection 
              form={customerForm.form} 
              update={customerForm.update} 
              editing={editingNew || editingExisting}
              loading={customerSearch.loading}
            />
          </div>
          
          <div className="col-span-3 grid grid-cols-12 gap-4">
            <div className="col-span-7">
              <PhysicalTraitsSection 
                form={customerForm.form} 
                update={customerForm.update} 
                editing={editingNew || editingExisting}
                setHeight={customerForm.setHeight}
                heightFeet={customerForm.heightFeet}
                heightInches={customerForm.heightInches}
              />
            </div>
            <div className="col-span-5">
              <NotesSection 
                form={customerForm.form} 
                update={customerForm.update}
                editing={editingNew || editingExisting}
              />
            </div>
          </div>
        </div>

        {customerSave.saveError && <div className="error" role="alert">{customerSave.saveError}</div>}
        {customerSave.statusMessage && <div className="cp-status">{customerSave.statusMessage}</div>}

        <datalist id="eyeColors">{EYE_COLORS.map(c => <option key={c} value={c} />)}</datalist>
        <datalist id="hairColors">{HAIR_COLORS.map(c => <option key={c} value={c} />)}</datalist>
        <datalist id="races">{RACES.map(c => <option key={c} value={c} />)}</datalist>
        <datalist id="idTypes">{ID_TYPES.map(c => <option key={c} value={c} />)}</datalist>
      </form>

      <SearchResultsModal
        open={customerSearch.searchModalOpen}
        empty={customerSearch.modalEmpty}
        fromScan={customerSearch.searchFromScan}
        canAddFromScan={canAddFromScan}
        results={customerSearch.results}
        loading={customerSearch.loading}
        error={customerSearch.error}
        onSelect={handleSelectCustomer}
        onAddFromScan={() => idScanHandler.handleAddFromScan(setEditingNew)}
        onClose={customerSearch.closeModal}
      />

      <CustomerIdScanModal
        open={idScanHandler.scanModalOpen}
        onClose={() => idScanHandler.setScanModalOpen(false)}
        onScanned={idScanHandler.applyAamva}
      />

      <IdConflictModal
        open={idScanHandler.idConflictModalOpen}
        existingIdNumber={idScanHandler.idConflictData?.customer.idNumber || ''}
        scannedIdNumber={idScanHandler.idConflictData?.scannedIdNumber || ''}
        customerName={
          idScanHandler.idConflictData
            ? `${idScanHandler.idConflictData.customer.firstName} ${idScanHandler.idConflictData.customer.lastName}`
            : ''
        }
        onUpdateId={idScanHandler.handleUpdateId}
        onKeepExisting={idScanHandler.handleKeepExistingId}
        onCancel={() => idScanHandler.handleCancelIdConflict(handleClearAll)}
      />
    </div>
  );
});

CustomerPicker.displayName = 'CustomerPicker';

export default CustomerPicker;
