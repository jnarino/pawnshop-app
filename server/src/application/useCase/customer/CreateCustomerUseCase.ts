import { ICustomerRepository } from '../../../domain/customer/ICustomerRepository';
import { Customer } from '../../../domain/customer/Customer';

export class CreateCustomerUseCase {
    constructor(private repo: ICustomerRepository) { }
    async execute(dto: Omit<Customer, 'id'>): Promise<string> {
        return this.repo.create(dto);
    }
}
