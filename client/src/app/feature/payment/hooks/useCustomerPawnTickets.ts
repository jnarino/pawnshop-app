import { useState, useEffect, useCallback, useMemo } from 'react';
import { pawnTicketApi, CustomerActivePawnTicket } from '@/app/core/api/pawnTicketApi';

interface UseCustomerPawnTicketsResult {
  tickets: CustomerActivePawnTicket[];
  filteredTickets: CustomerActivePawnTicket[];
  loading: boolean;
  error: string | null;
  selectedTicket: CustomerActivePawnTicket | null;
  selectedTicketId: string | null;
  filterText: string;
  selectTicket: (ticketId: string | null) => void;
  setFilterText: (text: string) => void;
  applyFilter: () => void;
  clearFilter: () => void;
  reload: () => Promise<void>;
}

export function useCustomerPawnTickets(customerId: string): UseCustomerPawnTicketsResult {
  const [tickets, setTickets] = useState<CustomerActivePawnTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [filterText, setFilterText] = useState('');
  const [appliedFilter, setAppliedFilter] = useState('');

  const loadTickets = useCallback(async () => {
    if (!customerId) return;

    try {
      setLoading(true);
      setError(null);
      const data = await pawnTicketApi.getActiveByCustomer(customerId);

      // Fetch current charges for each ticket in parallel
      const ticketsWithCharges = await Promise.all((data || []).map(async (ticket) => {
        try {
          const charges = await pawnTicketApi.getCurrentCharges(ticket.controlNumber);
          return { ...ticket, ...charges };
        } catch (err) {
          console.error(`Failed to load charges for ticket ${ticket.controlNumber}:`, err);
          return ticket;
        }
      }));

      setTickets(ticketsWithCharges);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load pawn tickets');
      setTickets([]);
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  const filteredTickets = useMemo(() => {
    if (!appliedFilter.trim()) {
      return tickets;
    }
    const searchTerm = appliedFilter.toLowerCase().trim();
    return tickets.filter(ticket =>
      ticket.controlNumber?.toLowerCase().includes(searchTerm)
    );
  }, [tickets, appliedFilter]);

  const applyFilter = useCallback(() => {
    setAppliedFilter(filterText);
    setSelectedTicketId(null);
  }, [filterText]);

  const clearFilter = useCallback(() => {
    setFilterText('');
    setAppliedFilter('');
    setSelectedTicketId(null);
  }, []);

  const selectTicket = useCallback((ticketId: string | null) => {
    setSelectedTicketId(ticketId);
  }, []);

  const selectedTicket = selectedTicketId
    ? filteredTickets.find(t => t.id === selectedTicketId) || null
    : null;

  return {
    tickets,
    filteredTickets,
    loading,
    error,
    selectedTicket,
    selectedTicketId,
    filterText,
    selectTicket,
    setFilterText,
    applyFilter,
    clearFilter,
    reload: loadTickets,
  };
}
