"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const assert_1 = __importDefault(require("assert"));
const inventoryControllerFactory_1 = require("../../../controller/inventory/inventoryControllerFactory");
const testHarness_1 = require("../../testHarness");
function uc(value) { return { execute: async () => value }; }
function throwingUC(err) { return { execute: async () => { throw err; } }; }
function mockRes() {
    const res = {};
    res.statusCode = 200;
    res.status = (c) => { res.statusCode = c; return res; };
    res.jsonData = undefined;
    res.json = (d) => { res.jsonData = d; return res; };
    res.sentStatus = undefined;
    res.sendStatus = (c) => { res.sentStatus = c; return res; };
    return res;
}
(0, testHarness_1.test)('controller/inventory: create returns id', async () => {
    const controller = (0, inventoryControllerFactory_1.makeInventoryController)({
        list: uc([]),
        get: uc(null),
        create: { execute: async () => 'new-inv-id' },
        update: uc(true),
        delete: uc(true),
    });
    const req = { body: { type: 'FIREARM', firearm: { caliberGauge: '9MM' }, quantity: 1 } };
    const res = mockRes();
    await controller.create(req, res, (e) => { if (e)
        throw e; });
    assert_1.default.strictEqual(res.statusCode, 201);
    assert_1.default.deepStrictEqual(res.jsonData, { id: 'new-inv-id' });
});
(0, testHarness_1.test)('controller/inventory: get missing propagates NotFoundError', async () => {
    const controller = (0, inventoryControllerFactory_1.makeInventoryController)({
        list: uc([]),
        get: uc(null),
        create: uc('id'),
        update: uc(false),
        delete: uc(false),
    });
    const res = mockRes();
    let captured;
    await controller.get({ params: { id: 'missing' } }, res, (e) => { captured = e; });
    assert_1.default.ok(captured, 'expected error passed to next');
    assert_1.default.match(String(captured.message || captured), /not found/i);
});
(0, testHarness_1.test)('controller/inventory: update returns 204', async () => {
    const controller = (0, inventoryControllerFactory_1.makeInventoryController)({
        list: uc([]),
        get: uc({ id: '1' }),
        create: uc('id'),
        update: { execute: async () => true },
        delete: uc(true),
    });
    const res = mockRes();
    await controller.update({ params: { id: '1' }, body: { itemCondition: 'Good' } }, res, (e) => { if (e)
        throw e; });
    assert_1.default.strictEqual(res.sentStatus, 204);
});
(0, testHarness_1.test)('controller/inventory: update missing yields NotFoundError', async () => {
    const controller = (0, inventoryControllerFactory_1.makeInventoryController)({
        list: uc([]),
        get: uc(null),
        create: uc('id'),
        update: { execute: async () => false },
        delete: uc(true),
    });
    let err;
    await controller.update({ params: { id: 'no' }, body: {} }, {}, (e) => { err = e; });
    assert_1.default.ok(err);
});
(0, testHarness_1.test)('controller/inventory: delete returns 204', async () => {
    const controller = (0, inventoryControllerFactory_1.makeInventoryController)({
        list: uc([]),
        get: uc({ id: '1' }),
        create: uc('id'),
        update: uc(true),
        delete: { execute: async () => true },
    });
    const res = mockRes();
    await controller.delete({ params: { id: '1' } }, res, (e) => { if (e)
        throw e; });
    assert_1.default.strictEqual(res.sentStatus, 204);
});
(0, testHarness_1.test)('controller/inventory: delete missing propagates NotFoundError', async () => {
    const controller = (0, inventoryControllerFactory_1.makeInventoryController)({
        list: uc([]),
        get: uc(null),
        create: uc('id'),
        update: uc(true),
        delete: { execute: async () => false },
    });
    let err;
    await controller.delete({ params: { id: 'missing' } }, {}, (e) => { err = e; });
    assert_1.default.ok(err);
});
