"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const db_1 = require("./infrastructure/persistence/db");
// Import category routes FIRST before using
const categoryRoutes_1 = __importStar(require("./infrastructure/http/routes/categoryRoutes"));
const app = (0, express_1.default)();
// Middleware
app.use((0, cors_1.default)({
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true
}));
app.use(express_1.default.json());
// Health check (this works, so we know Express is running)
app.get('/api/health', (req, res) => {
    res.json({ ok: true });
});
// Register category routes - THIS IS THE CRITICAL LINE
console.log('[Server] About to register category routes...');
app.use('/api/categories', categoryRoutes_1.default);
console.log('[Server] Category routes registered');
// List all registered routes for debugging
app._router.stack.forEach((middleware) => {
    if (middleware.route) {
        console.log('[Server] Route:', middleware.route.path);
    }
    else if (middleware.name === 'router') {
        console.log('[Server] Router middleware at:', middleware.regexp);
    }
});
// Start server
async function startServer() {
    try {
        console.log('[Server] Warming up category cache...');
        await categoryRoutes_1.categoryCache.refreshCache();
        console.log('[Server] Category cache ready');
        const PORT = process.env.PORT || 3000;
        const server = app.listen(PORT, () => {
            console.log(`[Server] ✓ Running on http://localhost:${PORT}`);
        });
        // Graceful shutdown
        const handleShutdown = async (signal) => {
            console.log(`\n[Server] ${signal} received`);
            try {
                await categoryRoutes_1.categoryCache.disconnect();
                await (0, db_1.closePool)();
            }
            catch (err) {
                console.error('[Server] Shutdown error:', err);
            }
            server.close(() => process.exit(0));
        };
        process.on('SIGTERM', () => handleShutdown('SIGTERM'));
        process.on('SIGINT', () => handleShutdown('SIGINT'));
    }
    catch (error) {
        console.error('[Server] Failed to start:', error);
        process.exit(1);
    }
}
startServer();
