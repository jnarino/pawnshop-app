"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const cors_1 = __importDefault(require("cors"));
const customerRoute_1 = __importDefault(require("./route/customerRoute"));
const pawnTicketRoute_1 = __importDefault(require("./route/pawnTicketRoute"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = process.env.PORT || 3000;
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Routes
app.use('/api/customer', customerRoute_1.default);
app.use('/api/pawnTicket', pawnTicketRoute_1.default);
// Health check endpoint
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
