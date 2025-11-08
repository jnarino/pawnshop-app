import { pool } from '../db';
import { getSQL } from '../db/sqlLoader';

export interface RatePlan {
  id: string;
  name: string;
  period_days: number;
  grace_days: number;
  periodic_rate: number;
  min_finance_charge: number;
  extend_on_interest_payment: boolean;
  extension_days_per_payment: number;
  max_extensions?: number;
  active: boolean;
}

export class RatePlanRepository {
  async findById(id: string): Promise<RatePlan | null> {
    const sql = getSQL('query', 'ratePlan', 'findActiveRatePlan');
    const { rows } = await pool.query(sql, [id]);
    return rows[0] ? this.mapRow(rows[0]) : null;
  }

  async findFirstActive(): Promise<RatePlan | null> {
    const sql = getSQL('query', 'ratePlan', 'findFirstActiveRatePlan');
    const { rows } = await pool.query(sql);
    return rows[0] ? this.mapRow(rows[0]) : null;
  }

  async findAll(): Promise<RatePlan[]> {
    const sql = getSQL('query', 'ratePlan', 'findAllRatePlans');
    const { rows } = await pool.query(sql);
    return rows.map(row => this.mapRow(row));
  }

  private mapRow(row: any): RatePlan {
    return {
      id: row.id,
      name: row.name,
      period_days: row.period_days,
      grace_days: row.grace_days,
      periodic_rate: Number(row.periodic_rate),
      min_finance_charge: Number(row.min_finance_charge),
      extend_on_interest_payment: row.extend_on_interest_payment,
      extension_days_per_payment: row.extension_days_per_payment,
      max_extensions: row.max_extensions,
      active: row.active
    };
  }
}
