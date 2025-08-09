// server/src/infrastructure/persistence/CustomerRepository.ts

import { pool } from '../db';
import { getSQL } from '../db/sqlLoader';
import { Customer } from '../../domain/customer/Customer';
import { ICustomerRepository } from '../../domain/customer/ICustomerRepository';

// Maps a DB row to your domain Customer object
function mapRowToCustomer(r: any): Customer {
    return {
        id: r.id,
        firstName: r.first_name,
        middleName: r.middle_name,
        lastName: r.last_name,
        suffix: r.suffix,
        dateOfBirth: r.date_of_birth,
        sex: r.sex,
        eyeColor: r.eye_color,
        height: r.height,
        streetAddress: r.streetaddress,
        city: r.city,
        stateUs: r.us_state,
        zipcode: r.zipcode,
        idNumber: r.id_number,
        expirationDate: r.id_expiration,
        issueDate: r.id_issue_date,
        issuingState: r.issuing_state,
        phone: r.phone_number,
        email: r.email,
    };
}

export class CustomerRepository implements ICustomerRepository {
    async findAll(): Promise<Customer[]> {
        const sql = getSQL('query', 'customer', 'findAllCustomers');
        const { rows } = await pool.query(sql);
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
            dto.expirationDate, // make sure matches column order in SQL
            dto.issueDate,
            dto.issuingState,
            dto.phone,
            dto.email,
        ];
        const { rows } = await pool.query(sql, params);
        return rows[0].id; // requires RETURNING id in your createCustomer.sql
    }

    async update(id: string, dto: Partial<Customer>): Promise<void> {
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
            dto.expirationDate,
            dto.issueDate,
            dto.issuingState,
            dto.phone,
            dto.email,
            id,
        ];
        await pool.query(sql, params);
    }

    async delete(id: string): Promise<void> {
        const sql = getSQL('command', 'customer', 'deleteCustomer');
        await pool.query(sql, [id]);
    }
}
