import { ICustomerRepository } from '../../../domain/customer/ICustomerRepository';
import { Customer } from '../../../domain/customer/Customer';
import { ValidationError } from '../../errors';
import { config } from '../../../config';

export interface ListCustomersParams { limit?: number; offset?: number; }

export class ListCustomersUseCase {
    constructor(private repo: ICustomerRepository) { }
    async execute(params: ListCustomersParams = {}): Promise<Customer[]> {
        const limit = params.limit ?? config.maxPageSize;
        const offset = params.offset ?? 0;
        if (limit < 1) throw new ValidationError('limit must be >=1');
        if (offset < 0) throw new ValidationError('offset must be >=0');
        if (limit > config.maxPageSize) throw new ValidationError(`limit must be <= ${config.maxPageSize}`);
        return this.repo.findAll(limit, offset);
    }
}