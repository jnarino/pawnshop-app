"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const assert_1 = __importDefault(require("assert"));
const node_http_1 = __importDefault(require("node:http"));
const express_1 = __importDefault(require("express"));
const testHarness_1 = require("../testHarness");
const inventoryStatusRoute_1 = require("../../route/inventoryStatusRoute");
const errors_1 = require("../../application/errors");
function httpRequest(port, method, path, body) {
    return new Promise((resolve, reject) => {
        const data = body ? JSON.stringify(body) : undefined;
        const req = node_http_1.default.request({ hostname: '127.0.0.1', port, path, method, headers: { 'Content-Type': 'application/json', 'Content-Length': data ? Buffer.byteLength(data) : 0 } }, res => {
            let buf = '';
            res.on('data', c => buf += c);
            res.on('end', () => { let json; try {
                json = buf ? JSON.parse(buf) : undefined;
            }
            catch { } resolve({ status: res.statusCode || 0, json }); });
        });
        req.on('error', reject);
        if (data)
            req.write(data);
        req.end();
    });
}
function makeApp(controller) {
    const app = (0, express_1.default)();
    app.use(express_1.default.json());
    app.use('/api/inventory-status', (0, inventoryStatusRoute_1.buildInventoryStatusRoute)(controller));
    app.use((err, _req, res, _next) => {
        if (err instanceof errors_1.ValidationError)
            return res.status(400).json({ error: { code: err.code, message: err.message } });
        res.status(500).json({ error: { code: 'INTERNAL', message: 'internal' } });
    });
    return app;
}
(0, testHarness_1.test)('route/inventory-status: CRUD basic flow', async () => {
    const controller = {
        list: (_req, res) => res.json([{ code: 'in_inventory' }]),
        create: (_req, res) => res.sendStatus(201),
        remove: (_req, res) => res.sendStatus(204),
    };
    const app = makeApp(controller);
    const server = app.listen(0);
    const port = server.address().port;
    const listRes = await httpRequest(port, 'GET', '/api/inventory-status');
    assert_1.default.strictEqual(listRes.status, 200);
    assert_1.default.deepStrictEqual(listRes.json, [{ code: 'in_inventory' }]);
    const createRes = await httpRequest(port, 'POST', '/api/inventory-status', { code: 'new_code' });
    assert_1.default.strictEqual(createRes.status, 201);
    const deleteRes = await httpRequest(port, 'DELETE', '/api/inventory-status/obsolete');
    assert_1.default.strictEqual(deleteRes.status, 204);
    server.close();
});
