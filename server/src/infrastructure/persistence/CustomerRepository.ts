// server/src/infrastructure/persistence/CustomerRepository.ts
// Updated for expanded customer schema.

import { pool } from '../db';
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
  city: 'city',
  stateUs: 'state_us',
  zipCode: 'zip_code',
  phoneNumber: 'phone_number',
  height: 'height',
  weight: 'weight',
  hairColor: 'hair_color',
  eyeColor: 'eye_color',
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
  idCity: 'id_city',
  idState: 'id_state',
  idZip: 'id_zip',
  employerName: 'employer_name',
  employerAddress: 'employer_address',
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
  taxExempt: 'tax_exempt'
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
    city: r.city ?? null,
    stateUs: r.state_us ?? null,
    zipCode: r.zip_code ?? null,
    phoneNumber: r.phone_number ?? null,
    height: r.height ?? null,
    weight: r.weight ?? null,
    hairColor: r.hair_color ?? null,
    eyeColor: r.eye_color ?? null,
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
    idCity: r.id_city ?? null,
    idState: r.id_state ?? null,
    idZip: r.id_zip ?? null,
    employerName: r.employer_name ?? null,
    employerAddress: r.employer_address ?? null,
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
  Object.entries(COL_MAP).forEach(([camel, snake]) => {
    const val = (dto as any)[camel];
    if (val !== undefined) {
      columns.push(snake);
      values.push(val);
      placeholders.push(`$${values.length}`);
    }
  });
  if (!columns.includes('first_name')) throw new Error('firstName required');
  if (!columns.includes('last_name')) throw new Error('lastName required');
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
    const conditions: string[] = [];
    const params: any[] = [];
    if (filters?.firstName) { params.push(filters.firstName + '%'); conditions.push(`first_name ILIKE $${params.length}`); }
    if (filters?.lastName) { params.push(filters.lastName + '%'); conditions.push(`last_name ILIKE $${params.length}`); }
    if (filters?.dateOfBirth) { params.push(filters.dateOfBirth); conditions.push(`date_of_birth = $${params.length}`); }
    let sql = `SELECT ${SELECT_COLUMNS} FROM customer`;
    if (conditions.length) sql += ` WHERE ${conditions.join(' AND ')}`;
    sql += ' ORDER BY last_name, first_name';
    if (typeof limit === 'number') { params.push(limit); sql += ` LIMIT $${params.length}`; }
    if (typeof offset === 'number') { params.push(offset); sql += ` OFFSET $${params.length}`; }
    const { rows } = await pool.query(sql, params);
    return rows.map(mapRow);
  }

  async findById(id: string): Promise<Customer | null> {
    const { rows } = await pool.query(`SELECT ${SELECT_COLUMNS} FROM customer WHERE id = $1`, [id]);
    return rows[0] ? mapRow(rows[0]) : null;
  }

  async findByDobAndIdNumber(dateOfBirth: string, idNumber: string): Promise<Customer | null> {
    const { rows } = await pool.query(
      `SELECT ${SELECT_COLUMNS} FROM customer WHERE date_of_birth = $1 AND id_number = $2 LIMIT 1`,
      [dateOfBirth, idNumber]
    );
    return rows[0] ? mapRow(rows[0]) : null;
  }

  async create(dto: Omit<Customer, 'id'>): Promise<string> {
    const { sql, values } = buildInsert(dto);
    const { rows } = await pool.query(sql, values);
    return rows[0].id;
  }

  async update(id: string, dto: Partial<Customer>): Promise<boolean> {
    const built = buildUpdate(id, dto);
    if (!built) return true; // nothing to update
    const res = await pool.query(built.sql, built.values);
    return res.rowCount === 1;
  }

  async delete(id: string): Promise<boolean> {
    const res = await pool.query('DELETE FROM customer WHERE id = $1', [id]);
    return res.rowCount === 1;
  }

  async list(opts?: { firstName?: string; lastName?: string; dateOfBirth?: string; limit?: number; offset?: number; }): Promise<Customer[]> {
    const params: any[] = [];
    const where: string[] = [];
    let sql = `
      SELECT 
        id, first_name, middle_name, last_name, street_address, suite_number,
        city, state_us, zip_code, phone_number, height, weight, hair_color,
        eye_color, race, sex, marks, date_of_birth, birth_city, birth_state,
        birth_country, id_type, id_number, id_expiration, id_issue_date,
        ss_number, id_address, id_suite_number, id_city, id_state, id_zip,
        employer_name, employer_address, employer_suite_number, employer_city,
        employer_state, employer_zip, employer_phone_number, description,
        ffl_number, locked, tax_id, cell_phone, email, entered_at, military,
        ffl_expire_date, tax_exempt, created_at, updated_at
      FROM customer
    `;

    if (opts?.firstName) {
      params.push(`%${opts.firstName}%`);
      where.push(`first_name ILIKE $${params.length}`);
    }
    if (opts?.lastName) {
      params.push(`%${opts.lastName}%`);
      where.push(`last_name ILIKE $${params.length}`);
    }
    if (opts?.dateOfBirth) {
      params.push(opts.dateOfBirth);
      where.push(`date_of_birth = $${params.length}`);
    }

    if (where.length > 0) {
      sql += ` WHERE ${where.join(' AND ')}`;
    }

    sql += ` ORDER BY last_name, first_name`;

    if (opts?.limit) {
      params.push(opts.limit);
      sql += ` LIMIT $${params.length}`;
    }
    if (opts?.offset) {
      params.push(opts.offset);
      sql += ` OFFSET $${params.length}`;
    }

    const { rows } = await pool.query(sql, params);
    return rows.map(this.mapRowToCustomer);
  }

  private mapRowToCustomer(row: any): Customer {
    return {
      id: row.id,
      firstName: row.first_name,
      middleName: row.middle_name,
      lastName: row.last_name,
      streetAddress: row.street_address,
      suiteNumber: row.id_suite_number,
      city: row.city,
      stateUs: row.state_us,
      zipCode: row.zip_code,
      phoneNumber: row.phone_number,
      height: row.height,
      weight: row.weight,
      hairColor: row.hair_color,
      eyeColor: row.eye_color,
      race: row.race,
      sex: row.sex,
      marks: row.marks,
      dateOfBirth: row.date_of_birth,
      birthCity: row.birth_city,
      birthState: row.birth_state,
      birthCountry: row.birth_country,
      idType: row.id_type,
      idNumber: row.id_number,
      idExpiration: row.id_expiration,
      idIssueDate: row.id_issue_date,
      ssNumber: row.ss_number,
      idAddress: row.id_address,
      idSuiteNumber: row.id_suite_number,
      idCity: row.id_city,
      idState: row.id_state,
      idZip: row.id_zip,
      employerName: row.employer_name,
      employerAddress: row.employer_address,
      employerSuiteNumber: row.employer_suite_number,
      employerCity: row.employer_city,
      employerState: row.employer_state,
      employerZip: row.employer_zip,
      employerPhoneNumber: row.employer_phone_number,
      description: row.description,
      fflNumber: row.ffl_number,
      locked: row.locked,
      taxId: row.tax_id,
      cellPhone: row.cell_phone,
      email: row.email,
      enteredAt: row.entered_at,
      military: row.military,
      fflExpireDate: row.ffl_expire_date,
      taxExempt: row.tax_exempt,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
