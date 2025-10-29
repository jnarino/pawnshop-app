// src/app/feature/customer/hooks/useCustomerLookup.ts
import { useState } from 'react';
import { http } from '@/app/core/api/http';

export function useCustomerLookup() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lookupCustomer = async (params: CustomerSearchParams) => {
    setLoading(true);
    setError(null);

    try {
      const query = new URLSearchParams();
      if (params.firstName) query.set('firstName', params.firstName);
      if (params.lastName) query.set('lastName', params.lastName);
      if (params.dateOfBirth) query.set('dateOfBirth', params.dateOfBirth);
      query.set('limit', '100');
      
      const customers = await http<Customer[]>(`/api/customer?${query.toString()}`);
      return customers;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to lookup customer');
      return [];
    } finally {
      setLoading(false);
    }
  };

  return { lookupCustomer, loading, error };
}