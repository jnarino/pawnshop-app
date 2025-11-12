import { usePawnWorkflow } from '../../contexts/PawnWorkflowContext';
import CustomerPicker from './components/CustomerPicker';
import type { Customer } from './types';

export default function CustomerInfoTab() {
  const { customer, setCustomer, setActiveTab, openCancelModal } = usePawnWorkflow();

  const handleCustomerChange = (c: Customer | null) => {
    setCustomer(c);
  };

  const handleCustomerSelected = (id: string) => {
    // Cuando se selecciona un customer, avanzar al tab de New Pawn
    setActiveTab('newPawn');
  };

  return (
    <div className="h-full w-full">
      <CustomerPicker 
        value={customer}
        onChange={handleCustomerChange}
        onSelected={handleCustomerSelected}
        onCancelTransaction={openCancelModal}
      />
    </div>
  );
}
