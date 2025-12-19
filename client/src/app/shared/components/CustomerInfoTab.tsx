import { CustomerManager } from '@/app/feature/_shared/customer';
import type { Customer } from '@/app/feature/_shared/customer';

interface CustomerInfoTabProps {
  customer: Customer | null;
  onCustomerChange: (customer: Customer | null) => void;
  onCustomerSelected: (id: string) => void;
}

export default function CustomerInfoTab({
  customer,
  onCustomerChange,
  onCustomerSelected
}: Readonly<CustomerInfoTabProps>) {
  return (
    <CustomerManager
      customer={customer}
      onCustomerChange={onCustomerChange}
      onCustomerSelected={onCustomerSelected}
      workflowMode="pawn"
      showAlertWhenEmpty={true}
      className="h-full"
    />
  );
}
