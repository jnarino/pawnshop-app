import { Pool } from 'pg';
import { AppUser } from '../../../domains/appUser/AppUser';
import { AppUserRepository } from '../../../domains/appUser/AppUserRepository';
import { loadSql } from '../../db/sqlLoader';

const sqlFindByUsername = loadSql('queries', 'appUser/app_user_find_by_username');
const sqlFindById = loadSql('queries', 'appUser/app_user_find_by_id');
const sqlListAll = loadSql('queries', 'appUser/app_user_list_all');
const sqlCreate = loadSql('commands', 'appUser/app_user_create');
const sqlUpdate = loadSql('commands', 'appUser/app_user_update');
const sqlDelete = loadSql('commands', 'appUser/app_user_delete');
export class PgAppUserRepository implements AppUserRepository {
  constructor(private readonly pool: Pool) { }

  async findByUsername(username: string): Promise<AppUser | null> {
    const result = await this.pool.query(sqlFindByUsername, [username]);
    if (result.rowCount === 0) return null;
    return this.mapRow(result.rows[0]);
  }

  async findById(id: string): Promise<AppUser | null> {
    const result = await this.pool.query(sqlFindById, [id]);
    if (result.rowCount === 0) return null;
    return this.mapRow(result.rows[0]);
  }

  async listAll(): Promise<AppUser[]> {
    const result = await this.pool.query(sqlListAll);
    return result.rows.map((row) => this.mapRow(row));
  }

  async create(user: AppUser): Promise<AppUser> {
    const result = await this.pool.query(sqlCreate, [
      user.username,
      user.passwordHash,
      user.firstName,
      user.middleName,
      user.lastName,
      user.streetAddress,
      user.suiteNumber,
      user.city,
      user.stateUs,
      user.zipCode,
      user.phoneNumber,
      user.ssNumber,
      user.birthDate,
      user.startingDate,
      user.terminatedDate,
      user.isActive,
      user.roleId
    ]);

    return this.mapRow(result.rows[0]);
  }

  async update(user: AppUser): Promise<AppUser> {
    const result = await this.pool.query(sqlUpdate, [
      user.id,
      user.username,
      user.firstName,
      user.middleName,
      user.lastName,
      user.streetAddress,
      user.suiteNumber,
      user.city,
      user.stateUs,
      user.zipCode,
      user.phoneNumber,
      user.ssNumber,
      user.birthDate,
      user.startingDate,
      user.terminatedDate,
      user.isActive,
      user.roleId
    ]);

    return this.mapRow(result.rows[0]);
  }

  async delete(id: string): Promise<void> {
    await this.pool.query(sqlDelete, [id]);
  }

  private mapRow(row: any): AppUser {
    return new AppUser({
      id: row.id,
      username: row.username,
      passwordHash: row.password_hash,
      firstName: row.first_name,
      middleName: row.middle_name,
      lastName: row.last_name,
      streetAddress: row.street_address,
      suiteNumber: row.suite_number,
      city: row.city,
      stateUs: row.state_us,
      zipCode: row.zip_code,
      phoneNumber: row.phone_number,
      ssNumber: row.ss_number,
      birthDate: row.birth_date,
      startingDate: row.starting_date,
      terminatedDate: row.terminated_date,
      isActive: row.is_active,
      roleId: row.role_id,
      roleName: row.role_name,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    });
  }
}
