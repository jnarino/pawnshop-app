import { ICustomerRepository } from '../../domain/customer/ICustomerRepository';
import { Customer } from '../../domain/customer/Customer';
import { pool, sql } from '../db';

export class CustomerRepository implements ICustomerRepository {
    async findAll(): Promise<Customer[]> {
        const { rows } = await pool.query(sql.query.findAllCustomers);
        return rows;
    }

    async findById(id: string): Promise<Customer | null> {
        const { rows } = await pool.query(sql.query.findCustomerById, [id]);
        return rows[0] ?? null;
    }

    async create(dto: Omit<Customer, 'id'>): Promise<string> {
        const params = [
            dto.firstName, dto.middleName, dto.lastName, dto.suffix,
            dto.dateOfBirth, dto.sex, dto.eyeColor, dto.height, dto.streetAddress,
            dto.city, dto.stateUs, dto.zipcode, dto.idNumber,
            dto.issueDate, dto.expirationDate, dto.issuingState,
            dto.phone, dto.email
        ];
        const { rows } = await pool.query(sql.command.createCustomer, params);
        return rows[0].id;
    }

    async update(id: string, dto: Partial<Customer>): Promise<void> {
        // For brevity, assume full dto; in practice use dynamic SET clause or specific SQL file
        const params = [
            dto.firstName, dto.middleName, /* ... */ dto.email, id
        ];
        await pool.query(sql.command.updateCustomer, params);
    }

    async delete(id: string): Promise<void> {
        await pool.query(sql.command.deleteCustomer, [id]);
    }
}