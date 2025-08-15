import { Customer } from './Customer';

export interface ICustomerRepository {
    findAll(limit?: number, offset?: number): Promise<Customer[]>;
    findById(id: string): Promise<Customer | null>;
    create(dto: Omit<Customer, 'id'>): Promise<string>;
    /** Returns true if a record was updated */
    update(id: string, dto: Partial<Customer>): Promise<boolean>;
    /** Returns true if a record was deleted */
    delete(id: string): Promise<boolean>;
}