import express from 'express';
import argon2 from 'argon2';
import jsonwebtoken from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { pool } from '../../db';
import { getSQL } from '../../db/sqlLoader';
import { jwt as jwtConfig } from '../../../config';
import { validateJwt, type AuthPayload } from '../middleware/auth';
import { logger } from '../../log/logger';

const router = express.Router();

// Login: validate credentials, return access + refresh tokens
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ error: 'bad_request', message: 'username and password required' });
        }

        // Temporary hardcoded SQL for debugging
        const sql = `
          SELECT 
            u.id, 
            u.username, 
            u.password_hash, 
            u.is_active,
            COALESCE(array_agg(r.name) FILTER (WHERE r.name IS NOT NULL), '{}') AS roles
          FROM app_user u
          LEFT JOIN app_user_role ur ON ur.user_id = u.id
          LEFT JOIN role r ON r.id = ur.role_id
          WHERE u.username = $1
          GROUP BY u.id, u.username, u.password_hash, u.is_active
        `;
        
        const result = await pool.query(sql, [username]);

        const user = result.rows[0];
        if (!user || !user.is_active) {
            return res.status(401).json({ error: 'unauthorized', message: 'Invalid credentials' });
        }

        const validPassword = await argon2.verify(user.password_hash, password);
        if (!validPassword) {
            return res.status(401).json({ error: 'unauthorized', message: 'Invalid credentials' });
        }

        // Create session in DB
        const sessionId = uuidv4();
        const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
        const createSessionSQL = getSQL('command', 'auth', 'createSession');
        await pool.query(createSessionSQL, [sessionId, user.id, expiresAt]);

        const payload: AuthPayload = {
            sub: user.id,
            username: user.username,
            roles: user.roles || []
        };

        const accessToken = jsonwebtoken.sign(
            payload,
            jwtConfig.accessSecret,
            { expiresIn: jwtConfig.accessExpiresIn } as jsonwebtoken.SignOptions
        );
        
        const refreshToken = jsonwebtoken.sign(
            { sub: user.id, sessionId },
            jwtConfig.refreshSecret,
            { expiresIn: jwtConfig.refreshExpiresIn } as jsonwebtoken.SignOptions
        );

        logger.info('auth_login_success', { userId: user.id, username: user.username });
        return res.json({ 
            access_token: accessToken, 
            refresh_token: refreshToken, 
            token_type: 'Bearer',
            expires_in: 900 // 15 minutes in seconds
        });
    } catch (error) {
        logger.error('auth_login_error', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : '' });
        return res.status(500).json({ error: 'internal_error', message: 'Login failed' });
    }
});

// Refresh: exchange refresh token for new access token
router.post('/refresh', async (req, res) => {
    try {
        const { refresh_token } = req.body;
        if (!refresh_token) return res.status(400).json({ error: 'bad_request', message: 'refresh_token required' });

        const decoded = jsonwebtoken.verify(refresh_token, jwtConfig.refreshSecret) as { sub: string; sessionId: string };
        
        // Verify session exists and is not expired
        const getSessionSQL = getSQL('query', 'auth', 'getSessionById');
        const sessionResult = await pool.query(getSessionSQL, [decoded.sessionId]);
        if (sessionResult.rows.length === 0) {
            return res.status(401).json({ error: 'unauthorized', message: 'Invalid session' });
        }

        // Get user with roles
        const sql = getSQL('query', 'auth', 'getUserById');
        const result = await pool.query(sql, [decoded.sub]);

        const user = result.rows[0];
        if (!user || !user.is_active) {
            return res.status(401).json({ error: 'unauthorized', message: 'User not found or inactive' });
        }

        // Update session activity and extend expiration (rolling window)
        const newExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        const updateSessionSQL = getSQL('command', 'auth', 'updateSessionActivity');
        await pool.query(updateSessionSQL, [decoded.sessionId, newExpiresAt]);

        const payload: AuthPayload = { sub: user.id, username: user.username, roles: user.roles || [] };
        const accessToken = jsonwebtoken.sign(
            payload,
            jwtConfig.accessSecret,
            { expiresIn: jwtConfig.accessExpiresIn } as jsonwebtoken.SignOptions
        );

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

// Me: return current user from JWT
router.get('/me', validateJwt, (req, res) => {
    const payload = (req as any).auth.payload as AuthPayload;
    return res.json({ sub: payload.sub, username: payload.username, roles: payload.roles });
});

// Logout: invalidate session
router.post('/logout', validateJwt, async (req, res) => {
    try {
        const { refresh_token } = req.body;
        if (refresh_token) {
            const decoded = jsonwebtoken.verify(refresh_token, jwtConfig.refreshSecret) as { sessionId: string };
            await pool.query('DELETE FROM session WHERE id = $1', [decoded.sessionId]);
        }
        return res.json({ message: 'Logged out successfully' });
    } catch (error) {
        return res.json({ message: 'Logged out' });
    }
});

export default router;
