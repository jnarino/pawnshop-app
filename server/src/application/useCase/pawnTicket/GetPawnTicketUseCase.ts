import { PawnTicketRepository } from '../../../infrastructure/persistence/PawnTicketRepository';

export class GetPawnTicketUseCase {
  constructor(private repo: PawnTicketRepository) {}
  async execute(id: string) { return this.repo.findById(id); }
  // ✅ Add method to find by control number with payments
  async findByControlNumberWithPayments(controlNumber: string) {
    return this.repo.findByControlNumberWithPayments(controlNumber);
  }
}
