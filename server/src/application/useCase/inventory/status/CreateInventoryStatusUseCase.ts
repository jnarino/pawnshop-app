import type { IInventoryStatusRepository } from '../../../../infrastructure/persistence/InventoryStatusRepository';
import type { InventoryStatus } from '../../../../domain/inventory/InventoryStatus';

export interface CreateInventoryStatusInput {
  code: string;
  description?: string;
  isTerminal?: boolean;
}

export class CreateInventoryStatusUseCase {
  constructor(private readonly repo: IInventoryStatusRepository) {}

  async execute(dto: CreateInventoryStatusInput): Promise<InventoryStatus> {
    // ✅ Validate input
    if (!dto.code || dto.code.trim() === '') {
      throw new Error('Status code is required');
    }

    // ✅ Check if status already exists (using findAll and filtering)
    const allStatuses = await this.repo.findAll();
    const existing = allStatuses.find(status => status.code === dto.code);
    if (existing) {
      throw new Error(`Status code '${dto.code}' already exists`);
    }

    // ✅ Create new status
    return await this.repo.create({
      code: dto.code.toUpperCase(), // Normalize to uppercase
      description: dto.description,
      isTerminal: dto.isTerminal || false
    });
  }
}
