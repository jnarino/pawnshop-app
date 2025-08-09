"use strict";
// server/src/infrastructure/persistence/CustomerRepository.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomerRepository = void 0;
const db_1 = require("../db");
const sqlLoader_1 = require("../db/sqlLoader");
// Maps a DB row to your domain Customer object
function mapRowToCustomer(r) {
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
class CustomerRepository {
    async findAll() {
        const sql = (0, sqlLoader_1.getSQL)('query', 'customer', 'findAllCustomers');
        const { rows } = await db_1.pool.query(sql);
        return rows.map(mapRowToCustomer);
    }
    async findById(id) {
        const sql = (0, sqlLoader_1.getSQL)('query', 'customer', 'findCustomerById');
        const { rows } = await db_1.pool.query(sql, [id]);
        return rows[0] ? mapRowToCustomer(rows[0]) : null;
    }
    async create(dto) {
        const sql = (0, sqlLoader_1.getSQL)('command', 'customer', 'createCustomer');
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
        const { rows } = await db_1.pool.query(sql, params);
        return rows[0].id; // requires RETURNING id in your createCustomer.sql
    }
    async update(id, dto) {
        const sql = (0, sqlLoader_1.getSQL)('command', 'customer', 'updateCustomer');
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
        await db_1.pool.query(sql, params);
    }
    async delete(id) {
        const sql = (0, sqlLoader_1.getSQL)('command', 'customer', 'deleteCustomer');
        await db_1.pool.query(sql, [id]);
    }
}
exports.CustomerRepository = CustomerRepository;
