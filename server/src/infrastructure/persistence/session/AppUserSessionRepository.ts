import { Pool } from 'pg';
import { AppUserSession } from '../../../domains/auth/AppUserSession';
import { loadSql } from '../../db/sqlLoader';

const sqlCreate = loadSql('commands', 'session/session_create');
const sqlFindByRefreshHash = loadSql('queries', 'session/session_find_by_refresh_hash');
const sqlUpdate = loadSql('commands', 'session/session_update');
const sqlRevoke = loadSql('commands', 'session/session_revoke');

export class AppUserSessionRepository {
  constructor(private readonly pool: Pool) { }

  async create(session: AppUserSession): Promise<AppUserSession> {
    const result = await this.pool.query(sqlCreate, [
      session.id,
      session.userId,
      session.createdAt,
      session.lastSeenAt,
      session.revokedAt,
      session.refreshTokenHash
    ]);

    return this.mapRow(result.rows[0]);
  }

  async findByRefreshTokenHash(hash: string): Promise<AppUserSession | null> {
    const result = await this.pool.query(sqlFindByRefreshHash, [hash]);
    if (result.rowCount === 0) return null;
    return this.mapRow(result.rows[0]);
  }

  async update(session: AppUserSession): Promise<void> {
    await this.pool.query(sqlUpdate, [
      session.id,
      session.lastSeenAt,
      session.revokedAt
    ]);
  }

  async revokeById(id: string): Promise<void> {
    await this.pool.query(sqlRevoke, [id]);
  }

  private mapRow(row: any): AppUserSession {
    return new AppUserSession({
      id: row.id,
      userId: row.user_id,
      createdAt: row.created_at,
      lastSeenAt: row.last_seen_at,
      revokedAt: row.revoked_at,
      refreshTokenHash: row.refresh_token_hash
    });
  }
}
