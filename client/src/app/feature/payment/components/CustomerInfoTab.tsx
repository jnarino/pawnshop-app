import React from 'react';
import type { Customer as CustomerDto } from '../../customer/types';
import CustomerPicker from '../../customer/components/CustomerPicker';

interface Props {
  customer: CustomerDto | null;
  onCustomerChange: (customer: CustomerDto | null) => void;
  onCustomerSelected: (id: string) => void;
  onCreateNew: (tempId: string) => void;
}

export default function CustomerInfoTab({
  customer,
  onCustomerChange,
  onCustomerSelected,
  onCreateNew
}: Props) {
  return (
    <div className="payment-panel">
      <CustomerPicker
        value={customer}
        onChange={onCustomerChange}
        onSelected={onCustomerSelected}
        onCreateNew={onCreateNew}
      />
      <p className="hint">Select a customer to view their pawn tickets and make payments.</p>
    </div>
  );
}
