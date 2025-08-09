// server/src/route/authRoute.ts
import { Router } from 'express';
import argon2 from 'argon2';
import { pool } from '../infrastructure/db';

const router = Router();
const COOKIE = 'sid';

// helper to load user + roles by session id
async function getUserBySession(sid: string) {
    const { rows } = await pool.query(`
    SELECT u.id, u.username,
           ARRAY_REMOVE(ARRAY_AGG(r.name), NULL) AS roles
    FROM session s
    JOIN app_user u ON u.id = s.user_id
    LEFT JOIN app_user_role ur ON ur.user_id = u.id
    LEFT JOIN role r ON r.id = ur.role_id
    WHERE s.id = $1 AND s.expires_at > now()
    GROUP BY u.id, u.username
  `, [sid]);
    return rows[0] || null;
}

router.post('/login', async (req, res, next) => {
    try {
        const { username, password } = req.body ?? {};
        if (!username || !password) return res.status(400).json({ error: 'Missing credentials' });

        const { rows } = await pool.query('SELECT * FROM app_user WHERE username = $1 AND is_active = true', [username]);
        const user = rows[0];
        if (!user) return res.status(401).json({ error: 'Invalid username or password' });

        const ok = await argon2.verify(user.password_hash, password);
        if (!ok) return res.status(401).json({ error: 'Invalid username or password' });

        // create session 8 hours
        const { rows: sidRows } = await pool.query(`
      INSERT INTO session (user_id, expires_at)
      VALUES ($1, now() + interval '8 hours')
      RETURNING id
    `, [user.id]);
        const sid = sidRows[0].id;

        res.cookie(COOKIE, sid, {
            httpOnly: true,
            sameSite: 'lax',
            secure: false,          // set true in production with HTTPS
            maxAge: 8 * 60 * 60 * 1000,
            path: '/',
        });

        const me = await getUserBySession(sid);
        return res.json(me);
    } catch (e) { next(e); }
});

router.get('/me', async (req, res, next) => {
    try {
        const sid = req.cookies?.[COOKIE];
        if (!sid) return res.status(401).json({ error: 'Not authenticated' });

        // touch session
        await pool.query('UPDATE session SET last_seen_at = now() WHERE id = $1', [sid]);

        const me = await getUserBySession(sid);
        if (!me) return res.status(401).json({ error: 'Not authenticated' });
        res.json(me);
    } catch (e) { next(e); }
});

router.post('/logout', async (req, res, next) => {
    try {
        const sid = req.cookies?.[COOKIE];
        if (sid) await pool.query('DELETE FROM session WHERE id = $1', [sid]);
        res.clearCookie(COOKIE, { path: '/' });
        res.json({ ok: true });
    } catch (e) { next(e); }
});

export default router;
