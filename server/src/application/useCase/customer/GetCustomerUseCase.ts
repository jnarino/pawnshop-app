import { ICustomerRepository } from '../../../domain/customer/ICustomerRepository';
import { Customer } from '../../../domain/customer/Customer';

export class GetCustomerUseCase {
    constructor(private repo: ICustomerRepository) { }
    async execute(id: string): Promise<Customer | null> {
        return this.repo.findById(id);
    }
}
