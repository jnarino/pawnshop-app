import { Pool } from 'pg';
import { Customer } from '../../../domains/customer/Customer';
import { CustomerRepository, FindCustomerCriteria } from '../../../domains/customer/CustomerRepository';
import { loadSql } from '../../db/sqlLoader';


const sqlCreate = loadSql('commands', 'customer/customer_create');
const sqlUpdate = loadSql('commands', 'customer/customer_update');
const sqlDelete = loadSql('commands', 'customer/customer_delete');

const sqlFindById = loadSql('queries', 'customer/customer_find_by_id');
const sqlFindByDob = loadSql('queries', 'customer/customer_find_by_dob');
const sqlFindByLastName = loadSql('queries', 'customer/customer_find_by_last_name');
const sqlFindByLastNameFirstName = loadSql(
    'queries',
    'customer/customer_find_by_last_name_first_name'
);
const sqlFindByDobLastName = loadSql(
    'queries',
    'customer/customer_find_by_dob_last_name'
);
const sqlFindByDobLastNameFirstName = loadSql(
    'queries',
    'customer/customer_find_by_dob_last_name_first_name'
);
const sqlFindByIdDocument = loadSql(
    'queries',
    'customer/customer_find_by_id_document'
);

function toPgDate(value: Date | null): string | null {
    if (!value) return null;
    // Take only the date portion so Postgres doesn't try to convert timezone
    return value.toISOString().slice(0, 10); // "YYYY-MM-DD"
}

export class PgCustomerRepository implements CustomerRepository {
    constructor(private readonly pool: Pool) { }

    async findById(id: string): Promise<Customer | null> {
        const result = await this.pool.query(sqlFindById, [id]);
        if (result.rowCount === 0) return null;
        return this.mapRow(result.rows[0]);
    }

    async create(customer: Customer): Promise<Customer> {
        const result = await this.pool.query(sqlCreate, [
            customer.oldCustomerPk,        // 1
            customer.oldCustomerId,        // 2
            customer.firstName,            // 3
            customer.middleName,           // 4
            customer.lastName,             // 5
            customer.streetAddress,        // 6
            customer.suiteNumber,          // 7
            customer.city,                 // 8
            customer.stateUs,              // 9
            customer.zipCode,              // 10
            customer.phoneNumber,          // 11
            customer.height,               // 12
            customer.weight,               // 13
            customer.hairColorId,          // 14
            customer.eyeColorId,           // 15
            customer.race,                 // 16
            customer.sex,                  // 17
            customer.marks,                // 18
            toPgDate(customer.dateOfBirth),          // 19
            customer.birthCity,            // 20
            customer.birthState,           // 21
            customer.birthCountry,         // 22
            customer.idType,               // 23
            customer.idNumber,             // 24
            toPgDate(customer.idExpiration),         // 25
            toPgDate(customer.idIssueDate),          // 26
            customer.ssNumber,             // 27
            customer.idAddress,            // 28
            customer.idSuiteNumber,        // 29
            customer.idCity,               // 30
            customer.idState,              // 31
            customer.idZip,                // 32
            customer.employerName,         // 33
            customer.employerAddress,      // 34
            customer.employerSuiteNumber,  // 35
            customer.employerCity,         // 36
            customer.employerState,        // 37
            customer.employerZip,          // 38
            customer.employerPhoneNumber,  // 39
            customer.description,          // 40
            customer.fflNumber,            // 41
            customer.locked,               // 42
            customer.taxId,                // 43
            customer.cellPhone,            // 44
            customer.email,                // 45
            customer.enteredAt,            // 46
            customer.military,             // 47
            toPgDate(customer.fflExpireDate),        // 48
            customer.taxExempt,            // 49
            customer.taxExemptCertificate  // 50
        ]);

        return this.mapRow(result.rows[0]);
    }

    async update(customer: Customer): Promise<Customer> {
        const result = await this.pool.query(sqlUpdate, [
            customer.id,                   // 1
            customer.oldCustomerPk,        // 2
            customer.oldCustomerId,        // 3
            customer.firstName,            // 4
            customer.middleName,           // 5
            customer.lastName,             // 6
            customer.streetAddress,        // 7
            customer.suiteNumber,          // 8
            customer.city,                 // 9
            customer.stateUs,              // 10
            customer.zipCode,              // 11
            customer.phoneNumber,          // 12
            customer.height,               // 13
            customer.weight,               // 14
            customer.hairColorId,          // 15
            customer.eyeColorId,           // 16
            customer.race,                 // 17
            customer.sex,                  // 18
            customer.marks,                // 19
            toPgDate(customer.dateOfBirth),          // 20
            customer.birthCity,            // 21
            customer.birthState,           // 22
            customer.birthCountry,         // 23
            customer.idType,               // 24
            customer.idNumber,             // 25
            toPgDate(customer.idExpiration),         // 26
            toPgDate(customer.idIssueDate),          // 27
            customer.ssNumber,             // 28
            customer.idAddress,            // 29
            customer.idSuiteNumber,        // 30
            customer.idCity,               // 31
            customer.idState,              // 32
            customer.idZip,                // 33
            customer.employerName,         // 34
            customer.employerAddress,      // 35
            customer.employerSuiteNumber,  // 36
            customer.employerCity,         // 37
            customer.employerState,        // 38
            customer.employerZip,          // 39
            customer.employerPhoneNumber,  // 40
            customer.description,          // 41
            customer.fflNumber,            // 42
            customer.locked,               // 43
            customer.taxId,                // 44
            customer.cellPhone,            // 45
            customer.email,                // 46
            customer.enteredAt,            // 47
            customer.military,             // 48
            toPgDate(customer.fflExpireDate),        // 49
            customer.taxExempt,            // 50
            customer.taxExemptCertificate  // 51
        ]);

        if (result.rowCount === 0) {
            throw new Error('Customer not found for update');
        }

        return this.mapRow(result.rows[0]);
    }

    async delete(id: string): Promise<void> {
        await this.pool.query(sqlDelete, [id]);
    }

    async findCustomer(criteria: FindCustomerCriteria): Promise<Customer[]> {
        const hasDob = !!criteria.dateOfBirth;
        const hasLast = !!criteria.lastName;
        const hasFirst = !!criteria.firstName;

        const hasIdNumber = !!criteria.idNumber;
        const hasIdType = !!criteria.idType;
        const hasIdState = !!criteria.idState;

        let sql: string;
        let params: any[];

        if (hasIdNumber && hasIdType && hasIdState) {
            sql = sqlFindByIdDocument;
            params = [criteria.idType, criteria.idNumber, criteria.idState];
        } else if (hasDob && !hasLast && !hasFirst) {
            // date_of_birth only
            sql = sqlFindByDob;
            params = [toPgDate(criteria.dateOfBirth ?? null)];
        } else if (hasDob && hasLast && !hasFirst) {
            // date_of_birth + last_name
            sql = sqlFindByDobLastName;
            params = [toPgDate(criteria.dateOfBirth ?? null), criteria.lastName];
        } else if (!hasDob && hasLast && !hasFirst) {
            // last_name only
            sql = sqlFindByLastName;
            params = [criteria.lastName];
        } else if (!hasDob && hasLast && hasFirst) {
            // last_name + first_name
            sql = sqlFindByLastNameFirstName;
            params = [criteria.lastName, criteria.firstName];
        } else if (hasDob && hasLast && hasFirst) {
            // date_of_birth + last_name + first_name
            sql = sqlFindByDobLastNameFirstName;
            params = [toPgDate(criteria.dateOfBirth ?? null), criteria.lastName, criteria.firstName];
        } else {
            throw new Error('Invalid findCustomer criteria combination');
        }

        const result = await this.pool.query(sql, params);
        return result.rows.map((row) => this.mapRow(row));
    }

    private mapRow(row: any): Customer {
        return new Customer({
            id: row.id,

            oldCustomerPk: row.old_customer_pk ?? null,
            oldCustomerId: row.old_customer_id ?? null,

            firstName: row.first_name,
            middleName: row.middle_name ?? null,
            lastName: row.last_name,

            streetAddress: row.street_address ?? null,
            suiteNumber: row.suite_number ?? null,
            city: row.city ?? null,
            stateUs: row.state_us ?? null,
            zipCode: row.zip_code ?? null,
            phoneNumber: row.phone_number ?? null,
            height: row.height ?? null,
            weight: row.weight ?? null,
            hairColorId: row.hair_color_id ?? null,
            eyeColorId: row.eye_color_id ?? null,
            race: row.race ?? null,
            sex: row.sex ?? null,
            marks: row.marks ?? null,
            dateOfBirth: row.date_of_birth ? new Date(row.date_of_birth) : null,
            birthCity: row.birth_city ?? null,
            birthState: row.birth_state ?? null,
            birthCountry: row.birth_country ?? null,

            idType: row.id_type ?? null,
            idNumber: row.id_number ?? null,
            idExpiration: row.id_expiration ? new Date(row.id_expiration) : null,
            idIssueDate: row.id_issue_date ? new Date(row.id_issue_date) : null,
            ssNumber: row.ss_number ?? null,
            idAddress: row.id_address ?? null,
            idSuiteNumber: row.id_suite_number ?? null,
            idCity: row.id_city ?? null,
            idState: row.id_state ?? null,
            idZip: row.id_zip ?? null,

            employerName: row.employer_name ?? null,
            employerAddress: row.employer_address ?? null,
            employerSuiteNumber: row.employer_suite_number ?? null,
            employerCity: row.employer_city ?? null,
            employerState: row.employer_state ?? null,
            employerZip: row.employer_zip ?? null,
            employerPhoneNumber: row.employer_phone_number ?? null,

            description: row.description ?? null,
            fflNumber: row.ffl_number ?? null,
            locked: row.locked ?? false,
            taxId: row.tax_id ?? null,
            cellPhone: row.cell_phone ?? null,
            email: row.email ?? null,
            enteredAt: row.entered_at ? new Date(row.entered_at) : null,
            military: row.military ?? false,
            fflExpireDate: row.ffl_expire_date ? new Date(row.ffl_expire_date) : null,
            taxExempt: row.tax_exempt ?? false,
            taxExemptCertificate: row.tax_exempt_certificate ?? null,

            createdAt: row.created_at ? new Date(row.created_at) : new Date(),
            updatedAt: row.updated_at ? new Date(row.updated_at) : new Date()
        });
    }
}
