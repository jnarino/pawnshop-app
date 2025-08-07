import { ICustomerRepository } from '../../../domain/customer/ICustomerRepository';

export class UpdateCustomerUseCase {
    constructor(private repo: ICustomerRepository) { }
    async execute(id: string, dto: Partial<any>): Promise<void> {
        return this.repo.update(id, dto);
    }
}
