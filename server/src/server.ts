import express, { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import customerRoute from './route/customerRoute';
import pawnTicketRoute from './route/pawnTicketRoute';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/customer', customerRoute);
app.use('/api/pawnTicket', pawnTicketRoute);

// Health check endpoint
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
