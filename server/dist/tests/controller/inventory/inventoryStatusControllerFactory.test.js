"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const assert_1 = __importDefault(require("assert"));
const inventoryStatusControllerFactory_1 = require("../../../controller/inventory/inventoryStatusControllerFactory");
function mockRes() {
    const res = {};
    res.statusCode = 200;
    res.status = (c) => { res.statusCode = c; return res; };
    res.sentStatus = undefined;
    res.sendStatus = (c) => { res.sentStatus = c; return res; };
    res.body = undefined;
    res.json = (b) => { res.body = b; return res; };
    return res;
}
(async () => {
    // list
    const listUC = { execute: async () => [{ code: 'in_inventory', active: true }] };
    const createUC = { execute: async (_dto) => { } };
    const deactivateUC = { execute: async (_code) => { } };
    const controller = (0, inventoryStatusControllerFactory_1.makeInventoryStatusController)({ list: listUC, create: createUC, deactivate: deactivateUC });
    // list
    {
        const req = {};
        const res = mockRes();
        const next = (e) => { if (e)
            throw e; };
        await controller.list(req, res, next);
        assert_1.default.deepStrictEqual(res.body, [{ code: 'in_inventory', active: true }]);
    }
    // create
    {
        const req = { body: { code: 'new_status' } };
        const res = mockRes();
        const next = (e) => { if (e)
            throw e; };
        await controller.create(req, res, next);
        assert_1.default.strictEqual(res.sentStatus, 201);
    }
    // remove
    {
        const req = { params: { code: 'obsolete' } };
        const res = mockRes();
        const next = (e) => { if (e)
            throw e; };
        await controller.remove(req, res, next);
        assert_1.default.strictEqual(res.sentStatus, 204);
    }
})();
