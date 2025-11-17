import express from 'express';
import argon2 from 'argon2';
import jsonwebtoken from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { pool } from '../../db';
import { jwt as jwtConfig } from '../../../config';
import { validateJwt, type AuthPayload } from '../middleware/auth';
import { logger } from '../../log/logger';
import { authCache } from '../../cache/AuthCacheService';
import * as fs from 'fs';
import * as path from 'path';

const router = express.Router();

// ✅ Load SQL queries from files
const findUserByUsernameSql = fs.readFileSync(
    path.join(__dirname, '../../../infrastructure/db/query/auth/findUserByUsername.sql'),
    'utf8'
);

// Initialize Redis connection
authCache.connect().catch(err => {
  logger.error('[AuthRoutes] Failed to connect to Redis', { error: err instanceof Error ? err.message : String(err) });
});

// Login: create permanent session in Redis
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'bad_request', message: 'username and password required' });
    }

    // ✅ Use SQL from file instead of inline
    const result = await pool.query(findUserByUsernameSql, [username]);
    const user = result.rows[0];

    if (!user || !user.is_active) {
      logger.warn('auth_login_failed_invalid_credentials', { username });
      return res.status(401).json({ error: 'unauthorized', message: 'Invalid credentials' });
    }

    const validPassword = await argon2.verify(user.password_hash, password);
    if (!validPassword) {
      logger.warn('auth_login_failed_wrong_password', { username });
      return res.status(401).json({ error: 'unauthorized', message: 'Invalid credentials' });
    }

    // ✅ Delete any existing sessions for this user (force single session)
    await authCache.deleteAllUserSessions(user.id);

    // ✅ Create NEW PERMANENT session in Redis
    const sessionId = uuidv4();
    await authCache.createSession(sessionId, user.id, user.username, user.roles || []);

    const payload: AuthPayload = {
      sub: user.id,
      username: user.username,
      roles: user.roles || []
    };

    const accessToken = jsonwebtoken.sign(
      payload,
      jwtConfig.accessSecret,
      { expiresIn: '15m' } as jsonwebtoken.SignOptions
    );
    
    const refreshToken = jsonwebtoken.sign(
      { sub: user.id, sessionId },
      jwtConfig.refreshSecret,
      { expiresIn: '100y' } as jsonwebtoken.SignOptions
    );

    logger.info('auth_login_success', { userId: user.id, username: user.username, sessionId });
    
    return res.json({ 
      access_token: accessToken, 
      refresh_token: refreshToken, 
      token_type: 'Bearer',
      expires_in: 900 // Access token expires in 15 minutes
    });
  } catch (error) {
    logger.error('auth_login_error', { error: error instanceof Error ? error.message : String(error) });
    return res.status(500).json({ error: 'internal_error', message: 'Login failed' });
  }
});

// Refresh: get new access token (session never expires unless manually deleted)
router.post('/refresh', async (req, res) => {
  try {
    const { refresh_token } = req.body;
    if (!refresh_token) {
      return res.status(400).json({ error: 'bad_request', message: 'refresh_token required' });
    }

    const decoded = jsonwebtoken.verify(refresh_token, jwtConfig.refreshSecret) as { sub: string; sessionId: string };
    
    // ✅ Verify session exists in Redis (no expiration check - sessions last forever)
    const sessionData = await authCache.getSession(decoded.sessionId);
    if (!sessionData) {
      return res.status(401).json({ error: 'unauthorized', message: 'Session not found - please login again' });
    }

    // ✅ Update last activity (no expiration)
    await authCache.updateSessionActivity(decoded.sessionId);

    const payload: AuthPayload = {
      sub: sessionData.userId,
      username: sessionData.username,
      roles: sessionData.roles
    };

    const accessToken = jsonwebtoken.sign(
      payload,
      jwtConfig.accessSecret,
      { expiresIn: '15m' } as jsonwebtoken.SignOptions
    );

    logger.info('auth_refresh_success', { userId: sessionData.userId, sessionId: decoded.sessionId });

    return res.json({ 
      access_token: accessToken, 
      token_type: 'Bearer',
      expires_in: 900
    });
  } catch (error) {
    logger.error('auth_refresh_error', { error: error instanceof Error ? error.message : String(error) });
    return res.status(401).json({ error: 'unauthorized', message: 'Invalid refresh token' });
  }
});

// Me: return current user
router.get('/me', validateJwt, (req, res) => {
  const payload = (req as any).auth.payload as AuthPayload;
  return res.json({ sub: payload.sub, username: payload.username, roles: payload.roles });
});

// Logout: delete session from Redis
router.post('/logout', async (req, res) => {
  try {
    const { refresh_token } = req.body;
    if (refresh_token) {
      try {
        const decoded = jsonwebtoken.verify(refresh_token, jwtConfig.refreshSecret) as { sessionId: string; sub: string };
        await authCache.deleteSession(decoded.sessionId);
        logger.info('auth_logout_success', { sessionId: decoded.sessionId, userId: decoded.sub });
      } catch (jwtError) {
        logger.warn('auth_logout_invalid_token', { error: jwtError instanceof Error ? jwtError.message : String(jwtError) });
        // ✅ Still return success - token was invalid anyway
      }
    }
    return res.json({ message: 'Logged out successfully' });
  } catch (error) {
    logger.error('auth_logout_error', { error: error instanceof Error ? error.message : String(error) });
    // ✅ Still return success - client should clear tokens anyway
    return res.json({ message: 'Logged out' });
  }
});

// Admin: Get all active sessions
router.get('/sessions', validateJwt, async (req, res) => {
  try {
    const payload = (req as any).auth.payload as AuthPayload;
    const sessions = await authCache.getUserActiveSessions(payload.sub);
    return res.json({ sessions });
  } catch (error) {
    logger.error('auth_sessions_error', { error: error instanceof Error ? error.message : String(error) });
    return res.status(500).json({ error: 'internal_error' });
  }
});

// Admin: Logout all sessions
router.post('/logout-all', validateJwt, async (req, res) => {
  try {
    const payload = (req as any).auth.payload as AuthPayload;
    await authCache.deleteAllUserSessions(payload.sub);
    logger.info('auth_logout_all_success', { userId: payload.sub });
    return res.json({ message: 'All sessions terminated' });
  } catch (error) {
    logger.error('auth_logout_all_error', { error: error instanceof Error ? error.message : String(error) });
    return res.status(500).json({ error: 'internal_error' });
  }
});

export default router;

// Export for graceful shutdown
export async function shutdownAuthCache() {
  await authCache.disconnect();
}
