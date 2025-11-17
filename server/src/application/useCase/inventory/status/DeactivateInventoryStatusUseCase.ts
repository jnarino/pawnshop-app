import type { IInventoryStatusRepository } from '../../../../infrastructure/persistence/InventoryStatusRepository';

export class DeactivateInventoryStatusUseCase {
  constructor(private readonly repo: IInventoryStatusRepository) {}

  async execute(code: string): Promise<boolean> {
    // ✅ Validate input
    if (!code || code.trim() === '') {
      throw new Error('Status code is required');
    }

    // ✅ Check if status exists (using findAll and filtering)
    const allStatuses = await this.repo.findAll();
    const existing = allStatuses.find(status => status.code === code);
    if (!existing) {
      return false; // Status doesn't exist
    }

    // ✅ Deactivate the status
    return await this.repo.deactivate(code);
  }
}
