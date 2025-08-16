"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const assert_1 = __importDefault(require("assert"));
const node_http_1 = __importDefault(require("node:http"));
const express_1 = __importDefault(require("express"));
const testHarness_1 = require("../testHarness");
const inventoryRoute_1 = require("../../route/inventoryRoute");
const errors_1 = require("../../application/errors");
function httpRequest(port, method, path, body) {
    return new Promise((resolve, reject) => {
        const data = body ? JSON.stringify(body) : undefined;
        const req = node_http_1.default.request({ hostname: '127.0.0.1', port, path, method, headers: { 'Content-Type': 'application/json', 'Content-Length': data ? Buffer.byteLength(data) : 0 } }, res => {
            let buf = '';
            res.on('data', c => buf += c);
            res.on('end', () => {
                let json = undefined;
                try {
                    json = buf ? JSON.parse(buf) : undefined;
                }
                catch { }
                resolve({ status: res.statusCode || 0, json });
            });
        });
        req.on('error', reject);
        if (data)
            req.write(data);
        req.end();
    });
}
function makeApp(fake) {
    const app = (0, express_1.default)();
    app.use(express_1.default.json());
    app.use('/api/inventory', (0, inventoryRoute_1.buildInventoryRoute)(fake));
    // simple error handler mimicking real one minimal subset
    app.use((err, _req, res, _next) => {
        if (err instanceof errors_1.ValidationError)
            return res.status(400).json({ error: { code: err.code, message: err.message } });
        if (err instanceof errors_1.NotFoundError)
            return res.status(404).json({ error: { code: err.code, message: err.message } });
        res.status(500).json({ error: { code: 'INTERNAL', message: 'internal' } });
    });
    return app;
}
(0, testHarness_1.test)('route/inventory: list returns injected data', async () => {
    const fake = { list: async (_req, _res, _n) => { }, get: async () => { }, create: async () => { }, update: async () => { }, delete: async () => { } }; // placeholder to satisfy types
    const controller = {
        list: (_req, res) => res.json([{ id: '1' }]),
        get: (_req, res, next) => next(new errors_1.NotFoundError('missing')), // to test error path separately
        create: (_req, res, next) => next(new errors_1.ValidationError('invalid firearm attributes')),
        update: (_req, res) => res.sendStatus(204),
        delete: (_req, res) => res.sendStatus(204),
    };
    const app = makeApp(controller);
    const server = app.listen(0);
    const port = server.address().port;
    const listRes = await httpRequest(port, 'GET', '/api/inventory');
    assert_1.default.strictEqual(listRes.status, 200);
    assert_1.default.deepStrictEqual(listRes.json, [{ id: '1' }]);
    const createRes = await httpRequest(port, 'POST', '/api/inventory', { type: 'FIREARM' });
    assert_1.default.strictEqual(createRes.status, 400);
    const getRes = await httpRequest(port, 'GET', '/api/inventory/abc');
    assert_1.default.strictEqual(getRes.status, 404);
    server.close();
});
