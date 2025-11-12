import { useState, useEffect } from 'react';
import type { Customer as CustomerDto } from '../types';
import { recordToDto } from '../mappers';
import './CustomerPicker.css';
import { CustomerActionButtons } from './CustomerActionButtons';
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
}

export default function CustomerPicker({ value, onChange, onSelected, onCreateNew, onCancelTransaction }: Props) {
  const [editingNew, setEditingNew] = useState(false);

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
    }
  }, [value]);

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

  const disableSearch = !customerForm.form.firstName && !customerForm.form.lastName && 
                        !customerForm.form.dateOfBirth && !customerForm.form.idNumber;

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    await customerSearch.search({
      firstName: customerForm.form.firstName,
      lastName: customerForm.form.lastName,
      dateOfBirth: customerForm.form.dateOfBirth || undefined,
      idNumber: customerForm.form.idNumber || undefined,
    });
  };

  const handleClearAll = () => {
    customerForm.clearForm();
    customerSearch.resetSearch();
    setEditingNew(false);
    customerSave.clearStatus();
    idScanHandler.clearScanData();
  };

  const handleAddNew = () => {
    setEditingNew(true);
    customerSearch.resetSearch();
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
      <form onSubmit={handleSearch} aria-label="Customer search / create">
        <div className="grid grid-cols-3 gap-3">
          <IdentityContactSection 
            form={customerForm.form} 
            update={customerForm.update} 
            editing={editingNew} 
          />
          
          <div className="col-span-2 flex flex-col gap-2">
            <AddressSection 
              form={customerForm.form} 
              update={customerForm.update} 
              editing={editingNew} 
              useIdAddr={customerForm.useIdAddr}
              setUseIdAddr={customerForm.setUseIdAddr}
            />
            <GovernmentIdSection 
              form={customerForm.form} 
              update={customerForm.update} 
              editing={editingNew} 
            />
          </div>
          
          <div className="col-span-3 grid grid-cols-12 gap-4">
            <div className="col-span-7">
              <PhysicalTraitsSection 
                form={customerForm.form} 
                update={customerForm.update} 
                editing={editingNew}
                setHeight={customerForm.setHeight}
                heightFeet={customerForm.heightFeet}
                heightInches={customerForm.heightInches}
              />
            </div>
            <div className="col-span-3">
              <NotesSection 
                form={customerForm.form} 
                update={customerForm.update} 
              />
            </div>
            
            <CustomerActionButtons
              editingNew={editingNew}
              loading={customerSearch.loading}
              saving={customerSave.saving}
              disableSearch={disableSearch}
              onSearch={handleSearch}
              onClear={handleClearAll}
              onAddNew={handleAddNew}
              onScanId={() => idScanHandler.setScanModalOpen(true)}
              onSave={handleSaveNew}
              onCancel={handleClearAll}
              onCancelTransaction={onCancelTransaction}
            />
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
}
