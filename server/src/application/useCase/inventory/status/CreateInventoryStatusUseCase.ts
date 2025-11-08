import { InventoryStatusRepository } from '../../../../infrastructure/persistence/InventoryStatusRepository';
import { ValidationError } from '../../../errors';

export interface CreateInventoryStatusDTO {
  code: string;
  description?: string;
  isTerminal?: boolean;
  sortOrder?: number;
}

export class CreateInventoryStatusUseCase {
  constructor(private repo: InventoryStatusRepository) {}
  async execute(dto: CreateInventoryStatusDTO) {
    if (!dto.code || !/^[a-z0-9_]+$/.test(dto.code)) throw new ValidationError('invalid code');
    dto.code = dto.code.toLowerCase();
    const existing = await this.repo.find(dto.code);
    if (existing) throw new ValidationError('status code already exists');
    await this.repo.insert({
      code: dto.code,
      description: dto.description,
      isTerminal: !!dto.isTerminal,
      sortOrder: dto.sortOrder ?? 100,
    });
  }
}
