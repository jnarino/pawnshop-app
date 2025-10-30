import { createClient, RedisClientType } from 'redis';
import { logger } from '../log/logger';

interface SessionData {
  userId: string;
  username: string;
  roles: string[];
  createdAt: string;
  lastActivityAt: string;
}

export class AuthCacheService {
  private client: RedisClientType | null = null;
  private readonly SESSION_PREFIX = 'auth_session:';
  private readonly USER_SESSIONS_PREFIX = 'user_sessions:';

  async connect(): Promise<void> {
    if (this.client) return;

    try {
      this.client = createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379',
      });

      this.client.on('error', (err) => {
        logger.error('[AuthCache] Redis error', { error: err instanceof Error ? err.message : String(err) }); // ✅ Fixed
      });

      await this.client.connect();
      logger.info('[AuthCache] Connected to Redis');
    } catch (error) {
      logger.error('[AuthCache] Failed to connect to Redis', { error: error instanceof Error ? error.message : String(error) }); // ✅ Fixed
      throw error;
    }
  }

  async createSession(sessionId: string, userId: string, username: string, roles: string[]): Promise<void> {
    if (!this.client) await this.connect();

    const sessionData: SessionData = {
      userId,
      username,
      roles,
      createdAt: new Date().toISOString(),
      lastActivityAt: new Date().toISOString(),
    };

    const sessionKey = `${this.SESSION_PREFIX}${sessionId}`;
    const userSessionsKey = `${this.USER_SESSIONS_PREFIX}${userId}`;

    // ✅ NO EXPIRATION - Sessions last forever
    await this.client!.set(sessionKey, JSON.stringify(sessionData));
    await this.client!.sAdd(userSessionsKey, sessionId);

    logger.info('[AuthCache] Session created (no expiration)', { sessionId, userId });
  }

  async getSession(sessionId: string): Promise<SessionData | null> {
    if (!this.client) await this.connect();

    const sessionKey = `${this.SESSION_PREFIX}${sessionId}`;
    const data = await this.client!.get(sessionKey);

    if (!data) {
      logger.warn('[AuthCache] Session not found', { sessionId });
      return null;
    }

    return JSON.parse(data) as SessionData;
  }

  async updateSessionActivity(sessionId: string): Promise<boolean> {
    if (!this.client) await this.connect();

    const sessionKey = `${this.SESSION_PREFIX}${sessionId}`;
    const data = await this.client!.get(sessionKey);

    if (!data) return false;

    const sessionData: SessionData = JSON.parse(data);
    sessionData.lastActivityAt = new Date().toISOString();

    // ✅ Update without expiration
    await this.client!.set(sessionKey, JSON.stringify(sessionData));
    logger.debug('[AuthCache] Session activity updated', { sessionId });

    return true;
  }

  async deleteSession(sessionId: string): Promise<void> {
    if (!this.client) await this.connect();

    const sessionKey = `${this.SESSION_PREFIX}${sessionId}`;
    const data = await this.client!.get(sessionKey);

    if (data) {
      const sessionData: SessionData = JSON.parse(data);
      const userSessionsKey = `${this.USER_SESSIONS_PREFIX}${sessionData.userId}`;
      await this.client!.sRem(userSessionsKey, sessionId);
    }

    await this.client!.del(sessionKey);
    logger.info('[AuthCache] Session deleted', { sessionId });
  }

  async deleteAllUserSessions(userId: string): Promise<void> {
    if (!this.client) await this.connect();

    const userSessionsKey = `${this.USER_SESSIONS_PREFIX}${userId}`;
    const sessionIds = await this.client!.sMembers(userSessionsKey);

    for (const sessionId of sessionIds) {
      await this.client!.del(`${this.SESSION_PREFIX}${sessionId}`);
    }

    await this.client!.del(userSessionsKey);
    logger.info('[AuthCache] All user sessions deleted', { userId, count: sessionIds.length });
  }

  async getUserActiveSessions(userId: string): Promise<SessionData[]> {
    if (!this.client) await this.connect();

    const userSessionsKey = `${this.USER_SESSIONS_PREFIX}${userId}`;
    const sessionIds = await this.client!.sMembers(userSessionsKey);

    const sessions: SessionData[] = [];
    for (const sessionId of sessionIds) {
      const sessionData = await this.getSession(sessionId);
      if (sessionData) {
        sessions.push(sessionData);
      }
    }

    return sessions;
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      this.client = null;
      logger.info('[AuthCache] Disconnected from Redis');
    }
  }
}

// Singleton instance
export const authCache = new AuthCacheService();
