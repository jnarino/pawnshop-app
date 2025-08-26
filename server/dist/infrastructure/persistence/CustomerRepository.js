"use strict";
// server/src/infrastructure/persistence/CustomerRepository.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomerRepository = void 0;
exports.mapRowToCustomer = mapRowToCustomer;
const db_1 = require("../db");
const sqlLoader_1 = require("../db/sqlLoader");
// Rows are already aliased to camelCase in the SELECT queries.
function mapRowToCustomer(r) {
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
class CustomerRepository {
    async findByDobAndIdNumber(dateOfBirth, idNumber) {
        const sql = (0, sqlLoader_1.getSQL)('query', 'customer', 'findCustomerByDobAndIdNumber');
        const { rows } = await db_1.pool.query(sql, [dateOfBirth, idNumber]);
        return rows[0] ? mapRowToCustomer(rows[0]) : null;
    }
    async findAll(limit, offset, filters) {
        const baseRaw = (0, sqlLoader_1.getSQL)('query', 'customer', 'findAllCustomers'); // may end with semicolon
        const base = baseRaw.replace(/;\s*$/, '');
        const where = [];
        const params = [];
        if (filters?.firstName) {
            params.push(filters.firstName + '%');
            where.push(`first_name ILIKE $${params.length}`);
        }
        if (filters?.lastName) {
            params.push(filters.lastName + '%');
            where.push(`last_name ILIKE $${params.length}`);
        }
        if (filters?.dateOfBirth) {
            params.push(filters.dateOfBirth);
            where.push(`date_of_birth = $${params.length}`);
        }
        let sql = base;
        if (where.length) {
            // Insert WHERE before ORDER BY (base query ends with ORDER BY last_name, first_name)
            const idx = sql.toUpperCase().lastIndexOf('ORDER BY');
            if (idx !== -1) {
                const before = sql.substring(0, idx).trimEnd();
                const order = sql.substring(idx);
                sql = `${before} WHERE ${where.join(' AND ')}\n${order}`;
            }
            else {
                sql = `${sql} WHERE ${where.join(' AND ')}`;
            }
        }
        // Pagination
        if (typeof limit === 'number') {
            params.push(limit);
            sql += `\nLIMIT $${params.length}`;
        }
        if (typeof offset === 'number') {
            params.push(offset);
            sql += `\nOFFSET $${params.length}`;
        }
        const { rows } = await db_1.pool.query(sql, params);
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
            dto.ssNumber,
            dto.expirationDate,
            dto.issueDate,
            dto.issuingState,
            dto.phone,
            dto.email,
            dto.hairColor,
            dto.weight,
            dto.race,
            dto.country,
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
            dto.ssNumber,
            dto.expirationDate,
            dto.issueDate,
            dto.issuingState,
            dto.phone,
            dto.email,
            dto.hairColor,
            dto.weight,
            dto.race,
            dto.country,
            id,
        ];
        const res = await db_1.pool.query(sql, params);
        return res.rowCount === 1;
    }
    async delete(id) {
        const sql = (0, sqlLoader_1.getSQL)('command', 'customer', 'deleteCustomer');
        const res = await db_1.pool.query(sql, [id]);
        return res.rowCount === 1;
    }
}
exports.CustomerRepository = CustomerRepository;
