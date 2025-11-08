import { PawnTicketRepository } from '../../../infrastructure/persistence/PawnTicketRepository';
import { ValidationError } from '../../errors';

export interface SearchPawnTicketsFilters {
  customerId?: string;
  type?: 'PAWN' | 'PURCHASE';
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

export class SearchPawnTicketsUseCase {
  constructor(private repo: PawnTicketRepository) {}
  async execute(filters: SearchPawnTicketsFilters) {
    if (filters.startDate && isNaN(Date.parse(filters.startDate))) throw new ValidationError('invalid startDate');
    if (filters.endDate && isNaN(Date.parse(filters.endDate))) throw new ValidationError('invalid endDate');
    if (filters.limit !== undefined && (filters.limit <= 0 || filters.limit > 200)) throw new ValidationError('invalid limit');
    if (filters.offset !== undefined && filters.offset < 0) throw new ValidationError('invalid offset');
    return this.repo.search(filters);
  }
}
