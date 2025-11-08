import { PawnTicketRepository } from '../../../infrastructure/persistence/PawnTicketRepository';

export class GetPawnTicketUseCase {
  constructor(private repo: PawnTicketRepository) {}
  async execute(id: string) { return this.repo.findById(id); }
}
