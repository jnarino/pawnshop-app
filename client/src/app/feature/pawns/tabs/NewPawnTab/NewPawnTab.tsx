import { useState } from 'react';
import { usePawnWorkflow } from '../../contexts/PawnWorkflowContext';
import NewPawnTabComponent from './components/NewPawnTab';
import { createInitialPawnDraft, type PawnDraft } from './types';
import type { Customer } from '@/app/feature/customer';

interface NewPawnTabWrapperProps {
  customerId: string | null;
  customer: Customer | null;
}

export default function NewPawnTabWrapper({ customerId, customer }: Readonly<NewPawnTabWrapperProps>) {
  const { setActiveTab } = usePawnWorkflow();
  const [pawnDraft, setPawnDraft] = useState<PawnDraft>(() => createInitialPawnDraft());

  if (!customerId) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        Please select a customer first
      </div>
    );
  }

  const handleBack = () => {
    setActiveTab('customer');
  };

  const handleGoPreviousItems = () => {
    setActiveTab('previousItems');
  };

  return (
    <NewPawnTabComponent 
      customerId={customerId}
      draft={pawnDraft}
      setDraft={setPawnDraft}
      onBack={handleBack}
      onGoPreviousItems={handleGoPreviousItems}
    />
  );
}
