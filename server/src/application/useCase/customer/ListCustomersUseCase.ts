import { ICustomerRepository } from '../../../domain/customer/ICustomerRepository';
import { Customer } from '../../../domain/customer/Customer';
import { validatePagination, PaginationInput } from '../../validation/pagination';

export interface ListCustomersParams extends PaginationInput {}

export class ListCustomersUseCase {
    constructor(private repo: ICustomerRepository) { }
    async execute(params: ListCustomersParams = {}): Promise<Customer[]> {
    const { limit, offset } = validatePagination(params);
    return this.repo.findAll(limit, offset);
    }
}