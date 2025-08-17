import { PawnTicketRepository } from '../../../infrastructure/persistence/PawnTicketRepository';
import { ValidationError } from '../../errors';

export class DeletePawnTicketUseCase {
  constructor(private repo: PawnTicketRepository) {}
  async execute(id: string): Promise<boolean> {
    if (!id) throw new ValidationError('id required');
    return this.repo.delete(id);
  }
}
