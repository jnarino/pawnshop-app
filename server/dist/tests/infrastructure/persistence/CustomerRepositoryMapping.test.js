"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const assert_1 = __importDefault(require("assert"));
const CustomerRepository_1 = require("../../../infrastructure/persistence/CustomerRepository");
const testHarness_1 = require("../../testHarness");
const row = {
    id: 'abc-123',
    firstName: 'John',
    middleName: null,
    lastName: 'Doe',
    suffix: null,
    dateOfBirth: '1990-01-01',
    sex: 'M',
    eyeColor: 'Brown',
    height: '5\'10"',
    streetAddress: '123 Main',
    city: 'Townsville',
    stateUs: 'TX',
    zipcode: '75001',
    idNumber: 'ID123',
    expirationDate: '2030-01-01',
    issueDate: '2020-01-01',
    issuingState: 'TX',
    phone: '555-1111',
    email: 'john@example.com'
};
(0, testHarness_1.test)('infrastructure/persistence: mapRowToCustomer maps aliases correctly', () => {
    const c = (0, CustomerRepository_1.mapRowToCustomer)(row);
    assert_1.default.strictEqual(c.firstName, 'John');
    assert_1.default.strictEqual(c.middleName, undefined);
    assert_1.default.strictEqual(c.stateUs, 'TX');
    assert_1.default.strictEqual(c.zipcode, '75001');
    assert_1.default.strictEqual(c.issueDate, '2020-01-01');
});
