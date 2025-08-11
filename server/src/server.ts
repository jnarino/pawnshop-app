// server/src/server.ts
import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import customerRoute from './route/customerRoute';
import pawnTicketRoute from './route/pawnTicketRoute';
import { runMigrations } from './infrastructure/db/migrations/runMigrations';
import authRoute from './route/authRoute';

async function bootstrap() {
    // 1) Run DB migrations BEFORE starting the server
    await runMigrations();

    // 2) Create app
    const app = express();
    const port = process.env.PORT || 3000;

    // Middleware
    app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
    app.use(require('cookie-parser')());
    app.use(express.json());

    // Routes
    app.use('/api/auth', authRoute);
    app.use('/api/customer', customerRoute);
    app.use('/api/pawnTicket', pawnTicketRoute);

    // Health check
    app.get('/api/health', (req: Request, res: Response) => {
        res.json({ status: 'ok' });
    });

    // Global error handler
    app.use((err: any, req: Request, res: Response, next: NextFunction) => {
        console.error(err);
        res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
    });

    // Start server
    app.listen(port, () => {
        console.log(`Server listening on http://localhost:${port}`);
    });
}

bootstrap().catch(err => {
    console.error('Fatal startup error:', err);
    process.exit(1);
});
