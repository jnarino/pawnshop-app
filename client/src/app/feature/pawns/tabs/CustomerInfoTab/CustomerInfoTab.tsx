import { CustomerManager } from '@/app/feature/customer';
import type { Customer } from '@/app/feature/customer';

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
      showAdditionalInfo={true}
      showAlertWhenEmpty={true}
      className="h-full"
    />
  );
}
