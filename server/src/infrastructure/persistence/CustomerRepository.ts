// server/src/infrastructure/persistence/CustomerRepository.ts
// Updated for expanded customer schema.

import { pool } from '../db';
import { getSQL } from '../db/sqlLoader';
import { Customer } from '../../domain/customer/Customer';
import { ICustomerRepository } from '../../domain/customer/ICustomerRepository';

// Map camelCase -> snake_case DB columns
const COL_MAP: Record<string, string> = {
  oldCustomerPk: 'old_customer_pk',
  oldCustomerId: 'old_customer_id',
  firstName: 'first_name',
  middleName: 'middle_name',
  lastName: 'last_name',
  streetAddress: 'street_address',
  suiteNumber: 'suite_number',
  city: 'city',
  stateUs: 'state_us',
  zipCode: 'zip_code',
  phoneNumber: 'phone_number',
  height: 'height',
  weight: 'weight',
  hairColorId: 'hair_color_id',
  eyeColorId: 'eye_color_id',
  race: 'race',
  sex: 'sex',
  marks: 'marks',
  dateOfBirth: 'date_of_birth',
  birthCity: 'birth_city',
  birthState: 'birth_state',
  birthCountry: 'birth_country',
  idType: 'id_type',
  idNumber: 'id_number',
  idExpiration: 'id_expiration',
  idIssueDate: 'id_issue_date',
  ssNumber: 'ss_number',
  idAddress: 'id_address',
  idSuiteNumber: 'id_suite_number',
  idCity: 'id_city',
  idState: 'id_state',
  idZip: 'id_zip',
  employerName: 'employer_name',
  employerAddress: 'employer_address',
  employerSuiteNumber: 'employer_suite_number',
  employerCity: 'employer_city',
  employerState: 'employer_state',
  employerZip: 'employer_zip',
  employerPhoneNumber: 'employer_phone_number',
  description: 'description',
  fflNumber: 'ffl_number',
  locked: 'locked',
  taxId: 'tax_id',
  cellPhone: 'cell_phone',
  email: 'email',
  enteredAt: 'entered_at',
  military: 'military',
  fflExpireDate: 'ffl_expire_date',
  taxExempt: 'tax_exempt',
  taxExemptCertificate: 'tax_exempt_certificate'
};

const SELECT_COLUMNS = [
  'id',
  ...Object.values(COL_MAP),
  'created_at',
  'updated_at'
].join(', ');

function mapRow(r: any): Customer {
  if (!r) return r;
  return {
    id: r.id,
    oldCustomerPk: r.old_customer_pk ?? null,
    oldCustomerId: r.old_customer_id ?? null,
    firstName: r.first_name,
    middleName: r.middle_name ?? null,
    lastName: r.last_name,
    streetAddress: r.street_address ?? null,
    suiteNumber: r.suite_number ?? null,
    city: r.city ?? null,
    stateUs: r.state_us ?? null,
    zipCode: r.zip_code ?? null,
    phoneNumber: r.phone_number ?? null,
    height: r.height ?? null,
    weight: r.weight ?? null,
    hairColorId: r.hair_color_id ?? null,
    eyeColorId: r.eye_color_id ?? null,
    race: r.race ?? null,
    sex: r.sex ?? null,
    marks: r.marks ?? null,
    dateOfBirth: r.date_of_birth ? r.date_of_birth.toISOString?.().substring(0, 10) : null,
    birthCity: r.birth_city ?? null,
    birthState: r.birth_state ?? null,
    birthCountry: r.birth_country ?? null,
    idType: r.id_type ?? null,
    idNumber: r.id_number ?? null,
    idExpiration: r.id_expiration ? r.id_expiration.toISOString?.().substring(0, 10) : null,
    idIssueDate: r.id_issue_date ? r.id_issue_date.toISOString?.().substring(0, 10) : null,
    ssNumber: r.ss_number ?? null,
    idAddress: r.id_address ?? null,
    idSuiteNumber: r.id_suite_number ?? null,
    idCity: r.id_city ?? null,
    idState: r.id_state ?? null,
    idZip: r.id_zip ?? null,
    employerName: r.employer_name ?? null,
    employerAddress: r.employer_address ?? null,
    employerSuiteNumber: r.employer_suite_number ?? null,
    employerCity: r.employer_city ?? null,
    employerState: r.employer_state ?? null,
    employerZip: r.employer_zip ?? null,
    employerPhoneNumber: r.employer_phone_number ?? null,
    description: r.description ?? null,
    fflNumber: r.ffl_number ?? null,
    locked: r.locked ?? null,
    taxId: r.tax_id ?? null,
    cellPhone: r.cell_phone ?? null,
    email: r.email ?? null,
    enteredAt: r.entered_at ? r.entered_at.toISOString?.() : null,
    military: r.military ?? null,
    fflExpireDate: r.ffl_expire_date ? r.ffl_expire_date.toISOString?.().substring(0, 10) : null,
    taxExempt: r.tax_exempt ?? null,
    taxExemptCertificate: r.tax_exempt_certificate ?? null,
    createdAt: r.created_at ? r.created_at.toISOString?.() : undefined,
    updatedAt: r.updated_at ? r.updated_at.toISOString?.() : undefined,
  };
}

// Test helper (back-compat with earlier tests importing mapRowToCustomer)
export function mapRowToCustomer(r: any): Customer { return mapRow(r); }

function buildInsert(dto: Omit<Customer, 'id'>) {
  const columns: string[] = [];
  const placeholders: string[] = [];
  const values: any[] = [];
  
  // Required fields
  if (!dto.firstName) throw new Error('firstName required');
  if (!dto.lastName) throw new Error('lastName required');
  
  Object.entries(COL_MAP).forEach(([camel, snake]) => {
    const val = (dto as any)[camel];
    if (val !== undefined) {
      columns.push(snake);
      values.push(val);
      placeholders.push(`$${values.length}`);
    }
  });
  
  const sql = `INSERT INTO customer (${columns.join(', ')}) VALUES (${placeholders.join(', ')}) RETURNING id`;
  return { sql, values };
}

function buildUpdate(id: string, dto: Partial<Customer>) {
  const sets: string[] = [];
  const values: any[] = [];
  Object.entries(COL_MAP).forEach(([camel, snake]) => {
    if ((dto as any)[camel] !== undefined) {
      values.push((dto as any)[camel]);
      sets.push(`${snake} = $${values.length}`);
    }
  });
  if (!sets.length) return null;
  values.push(id);
  const sql = `UPDATE customer SET ${sets.join(', ')}, updated_at = now() WHERE id = $${values.length}`;
  return { sql, values };
}

export class CustomerRepository implements ICustomerRepository {
  async findAll(limit?: number, offset?: number, filters?: { firstName?: string; lastName?: string; dateOfBirth?: string }): Promise<Customer[]> {
    const sql = getSQL('query', 'customer', 'findAllCustomers');
    const conditions: string[] = [];
    const params: any[] = [];
    
    if (filters?.firstName) { 
      params.push(filters.firstName + '%'); 
      conditions.push(`first_name ILIKE $${params.length}`); 
    }
    if (filters?.lastName) { 
      params.push(filters.lastName + '%'); 
      conditions.push(`last_name ILIKE $${params.length}`); 
    }
    if (filters?.dateOfBirth) { 
      params.push(filters.dateOfBirth); 
      conditions.push(`date_of_birth = $${params.length}`); 
    }
    
    let finalSql = sql;
    if (conditions.length) {
      // ✅ Fix: Insert WHERE clause before ORDER BY properly
      const orderByIndex = finalSql.toUpperCase().indexOf('ORDER BY');
      if (orderByIndex !== -1) {
        const beforeOrderBy = finalSql.substring(0, orderByIndex).trim();
        const orderByClause = finalSql.substring(orderByIndex);
        finalSql = `${beforeOrderBy} WHERE ${conditions.join(' AND ')} ${orderByClause}`;
      } else {
        finalSql = `${sql} WHERE ${conditions.join(' AND ')}`;
      }
    }
    
    if (typeof limit === 'number') { 
      params.push(limit); 
      finalSql += ` LIMIT $${params.length}`; 
    }
    if (typeof offset === 'number') { 
      params.push(offset); 
      finalSql += ` OFFSET $${params.length}`; 
    }
    
    const { rows } = await pool.query(finalSql, params);
    return rows.map(mapRow);
  }

  async findById(id: string): Promise<Customer | null> {
    const sql = getSQL('query', 'customer', 'findCustomerById');
    const { rows } = await pool.query(sql, [id]);
    return rows[0] ? mapRow(rows[0]) : null;
  }

  async findByDobAndIdNumber(dateOfBirth: string, idNumber: string): Promise<Customer | null> {
    const sql = getSQL('query', 'customer', 'findCustomerByDobAndId');
    const { rows } = await pool.query(sql, [dateOfBirth, idNumber]);
    return rows[0] ? mapRow(rows[0]) : null;
  }

  async create(dto: Omit<Customer, 'id'>): Promise<string> {
    const { sql, values } = buildInsert(dto);
    const { rows } = await pool.query(sql, values);
    return rows[0].id;
  }

  async update(id: string, dto: Partial<Customer>): Promise<boolean> {
    const built = buildUpdate(id, dto);
    if (!built) return true;
    const res = await pool.query(built.sql, built.values);
    return res.rowCount === 1;
  }

  async delete(id: string): Promise<boolean> {
    const sql = getSQL('command', 'customer', 'deleteCustomer');
    const res = await pool.query(sql, [id]);
    return res.rowCount === 1;
  }

  async list(opts?: { firstName?: string; lastName?: string; dateOfBirth?: string; limit?: number; offset?: number; }): Promise<Customer[]> {
    return this.findAll(opts?.limit, opts?.offset, {
      firstName: opts?.firstName,
      lastName: opts?.lastName,
      dateOfBirth: opts?.dateOfBirth
    });
  }

  private mapRowToCustomer(row: any): Customer {
    return mapRow(row);
  }

  async lockCustomer(id: string): Promise<Customer | null> {
    const sql = getSQL('command', 'customer', 'lockCustomer');
    const { rows } = await pool.query(sql, [id]);
    return rows[0] ? mapRow(rows[0]) : null;
  }

  async unlockCustomer(id: string): Promise<void> {
    const sql = getSQL('command', 'customer', 'unlockCustomer');
    await pool.query(sql, [id]);
  }
}
