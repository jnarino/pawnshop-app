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
        ssNumber: r.ssNumber ?? undefined,
        expirationDate: r.expirationDate,
        issueDate: r.issueDate,
        issuingState: r.issuingState,
        phone: r.phone,
        email: r.email,
        hairColor: r.hairColor,
        weight: r.weight,
        race: r.race,
        country: r.country,
    };
}

export class CustomerRepository implements ICustomerRepository {
    async findByDobAndIdNumber(dateOfBirth: string, idNumber: string): Promise<Customer | null> {
        const sql = getSQL('query', 'customer', 'findCustomerByDobAndIdNumber');
        const { rows } = await pool.query(sql, [dateOfBirth, idNumber]);
        return rows[0] ? mapRowToCustomer(rows[0]) : null;
    }

    async findAll(limit?: number, offset?: number, filters?: { firstName?: string; lastName?: string; dateOfBirth?: string }): Promise<Customer[]> {
        const baseRaw = getSQL('query', 'customer', 'findAllCustomers'); // may end with semicolon
        const base = baseRaw.replace(/;\s*$/, '');
        const where: string[] = [];
        const params: any[] = [];
        if (filters?.firstName) { params.push(filters.firstName + '%'); where.push(`first_name ILIKE $${params.length}`); }
        if (filters?.lastName) { params.push(filters.lastName + '%'); where.push(`last_name ILIKE $${params.length}`); }
        if (filters?.dateOfBirth) { params.push(filters.dateOfBirth); where.push(`date_of_birth = $${params.length}`); }
        let sql = base;
        if (where.length) {
            // Insert WHERE before ORDER BY (base query ends with ORDER BY last_name, first_name)
            const idx = sql.toUpperCase().lastIndexOf('ORDER BY');
            if (idx !== -1) {
                const before = sql.substring(0, idx).trimEnd();
                const order = sql.substring(idx);
                sql = `${before} WHERE ${where.join(' AND ')}\n${order}`;
            } else {
                sql = `${sql} WHERE ${where.join(' AND ')}`;
            }
        }
        // Pagination
        if (typeof limit === 'number') { params.push(limit); sql += `\nLIMIT $${params.length}`; }
        if (typeof offset === 'number') { params.push(offset); sql += `\nOFFSET $${params.length}`; }
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
            dto.ssNumber,
            dto.expirationDate,
            dto.issueDate,
            dto.issuingState,
            dto.phone,
            dto.email,
            (dto as any).hairColor,
            (dto as any).weight,
            (dto as any).race,
            (dto as any).country,
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
            dto.ssNumber,
            dto.expirationDate,
            dto.issueDate,
            dto.issuingState,
            dto.phone,
            dto.email,
            (dto as any).hairColor,
            (dto as any).weight,
            (dto as any).race,
            (dto as any).country,
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
