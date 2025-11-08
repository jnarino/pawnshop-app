import { ICustomerRepository } from '../../../domain/customer/ICustomerRepository';

export class DeleteCustomerUseCase {
    constructor(private repo: ICustomerRepository) { }
    async execute(id: string): Promise<boolean> { return this.repo.delete(id); }
}