import { useState, useRef } from 'react';
import { http } from '@/app/core/api/http';
import { CustomerRecord, apiToRecordLoose } from '../mappers';

interface SearchParams {
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  idNumber?: string;
}

export function useCustomerSearch() {
  const [results, setResults] = useState<CustomerRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [modalEmpty, setModalEmpty] = useState(false);
  const [searchFromScan, setSearchFromScan] = useState(false);

  async function search(params: SearchParams) {
    const { firstName, lastName, dateOfBirth, idNumber } = params;
    
    if (!firstName && !lastName && !dateOfBirth && !idNumber) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const searchParams = new URLSearchParams();
      if (firstName) searchParams.append('firstName', firstName);
      if (lastName) searchParams.append('lastName', lastName);
      if (dateOfBirth) searchParams.append('dateOfBirth', dateOfBirth);
      if (idNumber) searchParams.append('idNumber', idNumber);
      searchParams.append('limit', import.meta.env.VITE_CUSTOMER_SEARCH_LIMIT);

      const payload = await http(`/api/customer?${searchParams.toString()}`);
      const searchResults = (Array.isArray(payload) ? payload : []).map(apiToRecordLoose);

      setResults(searchResults);
      setModalEmpty(searchResults.length === 0);
      setSearchFromScan(false);
      setSearchModalOpen(true);
    } catch (err: any) {
      setError(err.message || 'Search failed');
      setModalEmpty(true);
      setSearchFromScan(false);
      setSearchModalOpen(true);
    } finally {
      setLoading(false);
    }
  }

  function closeModal() {
    setSearchModalOpen(false);
  }

  function resetSearch() {
    setResults([]);
    setError(null);
    setModalEmpty(false);
  }

  return {
    results,
    loading,
    error,
    searchModalOpen,
    modalEmpty,
    searchFromScan,
    search,
    closeModal,
    resetSearch,
    setSearchModalOpen,
    setModalEmpty,
    setSearchFromScan,
  };
}
