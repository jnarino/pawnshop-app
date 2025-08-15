"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const assert_1 = __importDefault(require("assert"));
const node_http_1 = __importDefault(require("node:http"));
const server_1 = require("../../server");
const testHarness_1 = require("../testHarness");
// NOTE: For a deeper route test you'd mock DB; here we just ensure health route present.
(0, testHarness_1.test)('route: health endpoint returns ok', async () => {
    const app = (0, server_1.createApp)();
    const server = app.listen(0);
    const port = server.address().port;
    const body = await new Promise((resolve, reject) => {
        node_http_1.default.get({ hostname: '127.0.0.1', port, path: '/api/health' }, res => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => resolve(JSON.parse(data)));
        }).on('error', reject);
    });
    server.close();
    assert_1.default.strictEqual(body.ok, true);
});
