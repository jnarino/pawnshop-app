import { CustomerManager } from '@/app/feature/customer';
import type { Customer } from '@/app/feature/customer';
import { Button } from '@/components/ui/button';

interface CustomerInfoTabProps {
  customer: Customer | null;
  onCustomerChange: (customer: Customer | null) => void;
  onCustomerSelected: (id: string) => void;
  onCancelTransaction: () => void;
}

export default function CustomerInfoTab({
  customer,
  onCustomerChange,
  onCustomerSelected,
  onCancelTransaction
}: Readonly<CustomerInfoTabProps>) {
  return (
    <CustomerManager
      customer={customer}
      onCustomerChange={onCustomerChange}
      onCustomerSelected={onCustomerSelected}
      showAdditionalInfo={true}
      showAlertWhenEmpty={true}
      renderLeftActions={(state) => (
        !state.editingNew && (
          <Button 
            type="button" 
            variant="destructive" 
            onClick={onCancelTransaction}
          >
            Cancel Transaction
          </Button>
        )
      )}
    />
  );
}
