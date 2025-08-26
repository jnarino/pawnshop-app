import { Customer } from './Customer';

export interface ICustomerRepository {
    findAll(limit?: number, offset?: number, filters?: { firstName?: string; lastName?: string; dateOfBirth?: string }): Promise<Customer[]>;
    findById(id: string): Promise<Customer | null>;
    create(dto: Omit<Customer, 'id'>): Promise<string>;
    update(id: string, dto: Partial<Customer>): Promise<boolean>;
    delete(id: string): Promise<boolean>;
    findByDobAndIdNumber(dateOfBirth: string, idNumber: string): Promise<Customer | null>;
}