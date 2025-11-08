import { PawnTicketRepository } from '../../../infrastructure/persistence/PawnTicketRepository';
import { ValidationError } from '../../errors';

export class UpdatePawnTicketDatesUseCase {
  constructor(private repo: PawnTicketRepository) {}
  async execute(id: string, maturityDate?: string, defaultDate?: string): Promise<boolean> {
    if (!id) throw new ValidationError('id required');
    if (!maturityDate && !defaultDate) throw new ValidationError('no updates');
    if (maturityDate && isNaN(Date.parse(maturityDate))) throw new ValidationError('invalid maturityDate');
    if (defaultDate && isNaN(Date.parse(defaultDate))) throw new ValidationError('invalid defaultDate');
    return this.repo.updateDates(id, maturityDate, defaultDate);
  }
}
