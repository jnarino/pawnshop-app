import { useState } from 'react';
import type { Customer as CustomerDto } from '@/app/feature/_shared/customer/types';

export type TabKey = 'customer' | 'additional' | 'viewPawn' | 'locatePawns' | 'makePayment';

export interface SelectedPawnTicket {
  id: string;
  controlNumber: string;
  type: 'PAWN' | 'PURCHASE';
  amountFinanced?: number;
  totalOfPayments?: number;
  maturityDate: string;
  defaultDate: string;
  pawnStatus: string;
  items: any[];
  payments?: any[];
}

export function usePaymentFlow() {
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>('customer');
  const [customer, setCustomer] = useState<CustomerDto | null>(null);
  const [selectedPawn, setSelectedPawn] = useState<SelectedPawnTicket | null>(null);

  const resetFlow = () => {
    setCustomerId(null);
    setCustomer(null);
    setSelectedPawn(null);
    setActiveTab('customer');
  };

  return {
    customerId,
    setCustomerId,
    customer,
    setCustomer,
    selectedPawn,
    setSelectedPawn,
    activeTab,
    setActiveTab,
    resetFlow
  };
}
