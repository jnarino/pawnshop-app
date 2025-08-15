import { ICustomerRepository } from '../../../domain/customer/ICustomerRepository';
import { Customer } from '../../../domain/customer/Customer';
import { validateNewCustomer } from '../../validation/customerValidation';

export class CreateCustomerUseCase {
    constructor(private repo: ICustomerRepository) { }
    async execute(input: Omit<Customer, 'id'>): Promise<string> {
        const cleaned = validateNewCustomer(input);
        return this.repo.create(cleaned);
    }
}
