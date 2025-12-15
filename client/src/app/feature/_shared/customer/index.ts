// Main component
export { default as CustomerManager } from './components/CustomerManager';
export type { CustomerManagerProps } from './components/CustomerManager';

// Individual components (for advanced use cases)
export { default as CustomerPicker } from './components/CustomerPicker';
export { SearchResultsModal } from './components/SearchResultsModal';
export { CustomerIdScanModal } from './components/CustomerIdScanModal';
export { IdConflictModal } from './components/IdConflictModal';

// Sections
export { IdentityContactSection } from './components/sections/IdentityContactSection';
export { AddressSection } from './components/sections/AddressSection';
export { GovernmentIdSection } from './components/sections/GovernmentIdSection';
export { PhysicalTraitsSection } from './components/sections/PhysicalTraitsSection';
export { NotesSection } from './components/sections/NotesSection';
export { EmployerInfoSection } from './components/sections/EmployerInfoSection';
export { ComplianceSection } from './components/sections/ComplianceSection';

// Types
export type { Customer, CustomerDTO } from './types';
export { CustomerDTOSchema, toCustomer, toCustomers } from './types';

// Mappers
export type { CustomerRecord } from './mappers';
export { dtoToRecord, recordToDto, apiToRecordLoose } from './mappers';

// Hooks (for advanced customization)
export { useCustomerForm } from './hooks/useCustomerForm';
export { useCustomerSearch } from './hooks/useCustomerSearch';
export { useCustomerSave } from './hooks/useCustomerSave';
export { useIdScanHandler } from './hooks/useIdScanHandler';

// Utils
export * from './utils/formatters';
