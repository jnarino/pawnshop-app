"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = require("../infrastructure/db");
const sqlLoader_1 = require("../infrastructure/db/sqlLoader");
const password_1 = require("../infrastructure/security/password");
const router = (0, express_1.Router)();
const COOKIE = 'sid';
// Preload SQL (optional, but avoids disk reads on every request)
const SQL = {
    getUserByUsername: (0, sqlLoader_1.getSQL)('query', 'auth', 'getUserByUsername'),
    getUserBySession: (0, sqlLoader_1.getSQL)('query', 'auth', 'getUserBySession'),
    createSession: (0, sqlLoader_1.getSQL)('command', 'auth', 'createSession'),
    touchSession: (0, sqlLoader_1.getSQL)('command', 'auth', 'touchSession'),
    deleteSession: (0, sqlLoader_1.getSQL)('command', 'auth', 'deleteSession'),
};
// POST /api/auth/login
router.post('/login', async (req, res, next) => {
    try {
        const { username, password } = req.body ?? {};
        if (!username || !password)
            return res.status(400).json({ error: 'Missing credentials' });
        const { rows } = await db_1.pool.query(SQL.getUserByUsername, [username]);
        const user = rows[0];
        console.log('[auth] login attempt', { username, found: !!user, is_active: user?.is_active });
        if (!user || user.is_active !== true) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }
        const ok = await (0, password_1.verifyPassword)(user.password_hash, password);
        if (!ok)
            return res.status(401).json({ error: 'Invalid username or password' });
        const sidRes = await db_1.pool.query(SQL.createSession, [user.id]);
        const sid = sidRes.rows[0].id;
        res.cookie(COOKIE, sid, {
            httpOnly: true,
            sameSite: 'lax',
            secure: false, // set true behind HTTPS in prod
            maxAge: 8 * 60 * 60 * 1000, // 8h
            path: '/',
        });
        const me = await db_1.pool.query(SQL.getUserBySession, [sid]);
        return res.json(me.rows[0] ?? null);
    }
    catch (e) {
        next(e);
    }
});
// GET /api/auth/me
router.get('/me', async (req, res, next) => {
    try {
        const sid = req.cookies?.[COOKIE];
        if (!sid)
            return res.status(401).json({ error: 'Not authenticated' });
        await db_1.pool.query(SQL.touchSession, [sid]);
        const me = await db_1.pool.query(SQL.getUserBySession, [sid]);
        const user = me.rows[0];
        if (!user)
            return res.status(401).json({ error: 'Not authenticated' });
        res.json(user);
    }
    catch (e) {
        next(e);
    }
});
// POST /api/auth/logout
router.post('/logout', async (req, res, next) => {
    try {
        const sid = req.cookies?.[COOKIE];
        if (sid)
            await db_1.pool.query(SQL.deleteSession, [sid]);
        res.clearCookie(COOKIE, { path: '/' });
        res.json({ ok: true });
    }
    catch (e) {
        next(e);
    }
});
exports.default = router;
