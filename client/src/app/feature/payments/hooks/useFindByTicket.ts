import { useState, useCallback } from 'react';
import { pawnTicketApi } from '@/app/core/api/pawnTicketApi';
import { http } from '@/app/core/api/http';
import type { Customer } from '@/app/feature/_shared/customer/types';
import { apiToRecordLoose } from '@/app/feature/_shared/customer/mappers';

interface UseFindByTicketResult {
  loading: boolean;
  error: string | null;
  findByTicket: (controlNumber: string) => Promise<Customer | null>;
}

export function useFindByTicket(): UseFindByTicketResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const findByTicket = useCallback(async (controlNumber: string): Promise<Customer | null> => {
    if (!controlNumber.trim()) {
      setError('Please enter a ticket number');
      return null;
    }

    try {
      setLoading(true);
      setError(null);

      const tickets = await pawnTicketApi.findByControlNumber(controlNumber.trim());

      if (!tickets || tickets.length === 0) {
        setError('No ticket found with that number');
        return null;
      }

      const ticket = tickets[0];
      const customerDto = await http(`/api/customer/${ticket.customerId}`);

      if (!customerDto) {
        setError('Customer not found for this ticket');
        return null;
      }

      const customerRecord = apiToRecordLoose(customerDto);
      
      if (!customerRecord.id) {
        setError('Customer data is invalid');
        return null;
      }

      return customerRecord as Customer;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to find ticket';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    findByTicket,
  };
}
