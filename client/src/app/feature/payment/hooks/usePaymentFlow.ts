import { useState } from 'react';
import type { Customer as CustomerDto } from '@/app/feature/_shared/customer/types';
import type { PawnTicketData } from '@/app/feature/_shared/types/pawnTicket';

export type TabKey = 'customer' | 'additional' | 'viewPawn' | 'locatePawns' | 'makePayment';

export interface SelectedPawnTicket extends PawnTicketData {
  totalOfPayments?: number;
  payments?: any[];
}

export interface PawnTicketRow {
  id: string;
  controlNumber: string;
  dateIn: string;
  dateOut: string;
  pawnAmount: number;
  currentCharges: number;
  redemption: number;
  otherPayment: boolean;
  selected: boolean;
  otherPaymentAmount?: number;
  periodsBehind?: number;
  periodicRate?: number;
}

export function usePaymentFlow() {
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>('customer');
  const [customer, setCustomer] = useState<CustomerDto | null>(null);
  const [selectedPawn, setSelectedPawn] = useState<SelectedPawnTicket | null>(null);
  const [tickets, setTickets] = useState<PawnTicketRow[]>([]);

  const resetFlow = () => {
    setCustomerId(null);
    setCustomer(null);
    setSelectedPawn(null);
    setTickets([]);
    setActiveTab('customer');
  };

  return {
    customerId,
    setCustomerId,
    customer,
    setCustomer,
    selectedPawn,
    setSelectedPawn,
    tickets,
    setTickets,
    activeTab,
    setActiveTab,
    resetFlow
  };
}
