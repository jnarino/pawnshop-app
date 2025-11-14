import { useState } from 'react';
import { CustomerManager } from './index';
import type { Customer } from './types';

export default function CustomerPage() {
  const [customer, setCustomer] = useState<Customer | null>(null);

  return (
    <div className="h-screen flex flex-col">
      <div className="flex-1 overflow-hidden">
        <CustomerManager
          customer={customer}
          onCustomerChange={setCustomer}
          onCustomerSelected={(id) => console.log('Customer selected:', id)}
          showAdditionalInfo={true}
          showAlertWhenEmpty={true}
          className="h-full"
        />
      </div>
    </div>
  );
}
