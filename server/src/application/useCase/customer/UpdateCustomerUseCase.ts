import { ICustomerRepository } from '../../../domain/customer/ICustomerRepository';
import type { Customer } from '../../../domain/customer/Customer';

export class UpdateCustomerUseCase {
    constructor(private repo: ICustomerRepository) { }
    async execute(id: string, partial: Partial<Customer>): Promise<boolean> {
        return this.repo.update(id, partial);
    }
}
