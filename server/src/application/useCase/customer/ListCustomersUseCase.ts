import { ICustomerRepository } from '../../../domain/customer/ICustomerRepository';
import { Customer } from '../../../domain/customer/Customer';
import { validatePagination, PaginationInput } from '../../validation/pagination';

export interface CustomerSearchFilters {
    firstName?: string; lastName?: string; dateOfBirth?: string;
}

export interface ListCustomersParams extends PaginationInput, CustomerSearchFilters {}

export class ListCustomersUseCase {
    constructor(private repo: ICustomerRepository) { }
    async execute(params: ListCustomersParams = {}): Promise<Customer[]> {
        const { limit, offset } = validatePagination(params);
        const filters: CustomerSearchFilters = {};
        if (params.firstName) filters.firstName = params.firstName.trim();
        if (params.lastName) filters.lastName = params.lastName.trim();
        if (params.dateOfBirth) filters.dateOfBirth = params.dateOfBirth.trim();
        return this.repo.findAll(limit, offset, filters);
    }
}