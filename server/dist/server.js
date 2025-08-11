"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// server/src/server.ts
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const customerRoute_1 = __importDefault(require("./route/customerRoute"));
const pawnTicketRoute_1 = __importDefault(require("./route/pawnTicketRoute"));
const runMigrations_1 = require("./infrastructure/db/migrations/runMigrations");
const authRoute_1 = __importDefault(require("./route/authRoute"));
async function bootstrap() {
    // 1) Run DB migrations BEFORE starting the server
    await (0, runMigrations_1.runMigrations)();
    // 2) Create app
    const app = (0, express_1.default)();
    const port = process.env.PORT || 3000;
    // Middleware
    app.use((0, cors_1.default)({ origin: 'http://localhost:5173', credentials: true }));
    app.use(require('cookie-parser')());
    app.use(express_1.default.json());
    // Routes
    app.use('/api/auth', authRoute_1.default);
    app.use('/api/customer', customerRoute_1.default);
    app.use('/api/pawnTicket', pawnTicketRoute_1.default);
    // Health check
    app.get('/api/health', (req, res) => {
        res.json({ status: 'ok' });
    });
    // Global error handler
    app.use((err, req, res, next) => {
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
