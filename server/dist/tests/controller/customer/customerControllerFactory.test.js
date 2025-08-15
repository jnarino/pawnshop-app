"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const assert_1 = __importDefault(require("assert"));
const customerControllerFactory_1 = require("../../../controller/customer/customerControllerFactory");
const testHarness_1 = require("../../testHarness");
// Simple mock use cases
function uc(value) { return { execute: async () => value }; }
function throwingUC(err) { return { execute: async () => { throw err; } }; }
const baseCustomer = { id: '1', firstName: 'A', lastName: 'B', dateOfBirth: '2000-01-01', sex: 'M', eyeColor: '', height: '', streetAddress: '', city: '', stateUs: '', zipcode: '', idNumber: '', issueDate: '', expirationDate: '', issuingState: '', phone: '', email: '' };
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
const controller = (0, customerControllerFactory_1.makeCustomerController)({
    list: uc([baseCustomer]),
    get: uc(baseCustomer),
    create: { execute: async () => 'new-id' },
    update: { execute: async () => true },
    delete: { execute: async () => true },
});
(0, testHarness_1.test)('controller/customer: list returns array', async () => {
    const res = mockRes();
    const req = { query: {} };
    await controller.list(req, res, (e) => { if (e)
        throw e; });
    assert_1.default.ok(Array.isArray(res.jsonData));
});
(0, testHarness_1.test)('controller/customer: get 404 when missing', async () => {
    const c2 = (0, customerControllerFactory_1.makeCustomerController)({
        list: uc([]),
        get: uc(null),
        create: { execute: async () => 'id' },
        update: { execute: async () => false },
        delete: { execute: async () => false },
    });
    const res = mockRes();
    await c2.get({ params: { id: 'x' } }, res, () => { });
    assert_1.default.strictEqual(res.sentStatus, 404);
});
