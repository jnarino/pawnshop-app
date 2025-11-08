import express from 'express';
import { pool } from '../../db';

const router = express.Router();

router.get('/', async (_req, res) => {
    try {
        await pool.query('SELECT 1');
        res.json({ ready: true });
    } catch {
        res.status(503).json({ ready: false });
    }
});

export default router;
