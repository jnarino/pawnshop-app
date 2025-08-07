import { ICustomerRepository } from '../../../domain/customer/ICustomerRepository';
import { Customer } from '../../../domain/customer/Customer';

export class ListCustomersUseCase {
    constructor(private repo: ICustomerRepository) { }
    async execute(): Promise<Customer[]> {
        return this.repo.findAll();
    }
}