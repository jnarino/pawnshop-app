"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomerRepository = void 0;
const db_1 = require("../db");
class CustomerRepository {
    async findAll() {
        const { rows } = await db_1.pool.query(db_1.sql.query.findAllCustomers);
        return rows;
    }
    async findById(id) {
        const { rows } = await db_1.pool.query(db_1.sql.query.findCustomerById, [id]);
        return rows[0] ?? null;
    }
    async create(dto) {
        const params = [
            dto.firstName, dto.middleName, dto.lastName, dto.suffix,
            dto.dateOfBirth, dto.sex, dto.eyeColor, dto.height, dto.streetAddress,
            dto.city, dto.stateUs, dto.zipcode, dto.idNumber,
            dto.issueDate, dto.expirationDate, dto.issuingState,
            dto.phone, dto.email
        ];
        const { rows } = await db_1.pool.query(db_1.sql.command.createCustomer, params);
        return rows[0].id;
    }
    async update(id, dto) {
        // For brevity, assume full dto; in practice use dynamic SET clause or specific SQL file
        const params = [
            dto.firstName, dto.middleName, /* ... */ dto.email, id
        ];
        await db_1.pool.query(db_1.sql.command.updateCustomer, params);
    }
    async delete(id) {
        await db_1.pool.query(db_1.sql.command.deleteCustomer, [id]);
    }
}
exports.CustomerRepository = CustomerRepository;
