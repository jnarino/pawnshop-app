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
    first_name: 'John',
    middle_name: null,
    last_name: 'Doe',
    street_address: '123 Main',
    city: 'Townsville',
    state_us: 'TX',
    zip_code: '75001',
    phone_number: '555-1111',
    date_of_birth: '1990-01-01',
    sex: 'M',
    eye_color: 'Brown',
    height: "5'10\"",
    id_number: 'ID123',
    id_expiration: '2030-01-01',
    id_issue_date: '2020-01-01',
    id_state: 'TX',
    ss_number: null,
    weight: '180',
    hair_color: 'Black',
    race: 'White'
};
(0, testHarness_1.test)('infrastructure/persistence: mapRowToCustomer maps new schema correctly', () => {
    const c = (0, CustomerRepository_1.mapRowToCustomer)(row);
    assert_1.default.strictEqual(c.firstName, 'John');
    assert_1.default.strictEqual(c.middleName, null);
    assert_1.default.strictEqual(c.stateUs, 'TX');
    assert_1.default.strictEqual(c.zipCode, '75001');
    assert_1.default.strictEqual(c.idIssueDate, '2020-01-01');
    assert_1.default.strictEqual(c.idExpiration, '2030-01-01');
    assert_1.default.strictEqual(c.idNumber, 'ID123');
});
