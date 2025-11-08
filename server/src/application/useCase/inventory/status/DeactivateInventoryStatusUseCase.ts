import { InventoryStatusRepository } from '../../../../infrastructure/persistence/InventoryStatusRepository';
import { ValidationError } from '../../../errors';

export class DeactivateInventoryStatusUseCase {
  constructor(private repo: InventoryStatusRepository) {}
  async execute(code: string) {
    if (!code) throw new ValidationError('code required');
    const existing = await this.repo.find(code);
    if (!existing) throw new ValidationError('status not found');
    if (existing.isTerminal) {
      // Allow deactivation of terminal statuses? We'll allow but could restrict.
    }
    await this.repo.deactivate(code);
  }
}
