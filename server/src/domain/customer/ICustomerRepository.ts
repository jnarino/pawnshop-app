import { Customer } from './Customer';

export interface ICustomerRepository {
    findAll(): Promise<Customer[]>;
    findById(id: string): Promise<Customer | null>;
    create(dto: Omit<Customer, 'id'>): Promise<string>;
    update(id: string, dto: Partial<Customer>): Promise<void>;
    delete(id: string): Promise<void>;
}