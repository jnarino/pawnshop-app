import type { Customer } from '../../../domain/customer/Customer';
import type { ICustomerRepository } from '../../../domain/customer/ICustomerRepository';

export class FindCustomerByDobAndIdUseCase {
    constructor(private repo: ICustomerRepository) { }

    async execute(dobISO: string, idNumber: string): Promise<Customer | null> {
        if (!dobISO || !idNumber) return null;
        return this.repo.findByDobAndIdNumber(dobISO, idNumber);
    }
}