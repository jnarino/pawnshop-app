// server/src/infrastructure/persistence/CustomerRepository.ts

import { pool } from '../db';
import { getSQL } from '../db/sqlLoader';
import { Customer } from '../../domain/customer/Customer';
import { ICustomerRepository } from '../../domain/customer/ICustomerRepository';

// Rows are already aliased to camelCase in the SELECT queries.
export function mapRowToCustomer(r: any): Customer { // exported for tests
    return {
        id: r.id,
        firstName: r.firstName,
        middleName: r.middleName ?? undefined,
        lastName: r.lastName,
        suffix: r.suffix ?? undefined,
        dateOfBirth: r.dateOfBirth,
        sex: r.sex,
        eyeColor: r.eyeColor,
        height: r.height,
        streetAddress: r.streetAddress,
        city: r.city,
        stateUs: r.stateUs,
        zipcode: r.zipcode,
        idNumber: r.idNumber,
        expirationDate: r.expirationDate,
        issueDate: r.issueDate,
        issuingState: r.issuingState,
        phone: r.phone,
        email: r.email,
    };
}

export class CustomerRepository implements ICustomerRepository {
    async findAll(limit?: number, offset?: number): Promise<Customer[]> {
        const base = getSQL('query', 'customer', 'findAllCustomers');
        const clauses: string[] = [];
        const params: any[] = [];
        if (typeof limit === 'number') { params.push(limit); clauses.push(`LIMIT $${params.length}`); }
        if (typeof offset === 'number') { params.push(offset); clauses.push(`OFFSET $${params.length}`); }
        const sql = `${base} ${clauses.join(' ')}`.trim();
        const { rows } = await pool.query(sql, params);
        return rows.map(mapRowToCustomer);
    }

    async findById(id: string): Promise<Customer | null> {
        const sql = getSQL('query', 'customer', 'findCustomerById');
        const { rows } = await pool.query(sql, [id]);
        return rows[0] ? mapRowToCustomer(rows[0]) : null;
    }

    async create(dto: Omit<Customer, 'id'>): Promise<string> {
        const sql = getSQL('command', 'customer', 'createCustomer');
        const params = [
            dto.firstName,
            dto.middleName,
            dto.lastName,
            dto.suffix,
            dto.dateOfBirth,
            dto.sex,
            dto.eyeColor,
            dto.height,
            dto.streetAddress,
            dto.city,
            dto.stateUs,
            dto.zipcode,
            dto.idNumber,
            dto.expirationDate, // id_expiration
            dto.issueDate,      // id_issue_date
            dto.issuingState,
            dto.phone,
            dto.email,
        ];
        const { rows } = await pool.query(sql, params);
        return rows[0].id; // requires RETURNING id in your createCustomer.sql
    }

    async update(id: string, dto: Partial<Customer>): Promise<boolean> {
        const sql = getSQL('command', 'customer', 'updateCustomer');
        const params = [
            dto.firstName,
            dto.middleName,
            dto.lastName,
            dto.suffix,
            dto.dateOfBirth,
            dto.sex,
            dto.eyeColor,
            dto.height,
            dto.streetAddress,
            dto.city,
            dto.stateUs,
            dto.zipcode,
            dto.idNumber,
            dto.expirationDate, // id_expiration
            dto.issueDate,      // id_issue_date
            dto.issuingState,
            dto.phone,
            dto.email,
            id,
        ];
        const res = await pool.query(sql, params);
        return res.rowCount === 1;
    }

    async delete(id: string): Promise<boolean> {
        const sql = getSQL('command', 'customer', 'deleteCustomer');
        const res = await pool.query(sql, [id]);
        return res.rowCount === 1;
    }
}
