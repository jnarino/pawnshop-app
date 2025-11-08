import { ICustomerRepository } from '../../../domain/customer/ICustomerRepository';
import { Customer } from '../../../domain/customer/Customer';
import { validateNewCustomer } from '../../validation/customerValidation';

export class CreateCustomerUseCase {
    constructor(private repo: ICustomerRepository) { }
    
    async execute(input: Omit<Customer, 'id'>): Promise<string> {
        const cleaned = validateNewCustomer(input);
        
        // TODO: If hairColorId/eyeColorId are provided as strings instead of UUIDs,
        // we could look them up from the color table here
        
        return this.repo.create(cleaned);
    }
}
