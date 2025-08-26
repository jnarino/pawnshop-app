"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const assert_1 = __importDefault(require("assert"));
const CreateCustomerUseCase_1 = require("../../../../application/useCase/customer/CreateCustomerUseCase");
const errors_1 = require("../../../../application/errors");
const testHarness_1 = require("../../../testHarness");
class MockRepo {
    constructor() {
        this.data = [];
    }
    async findAll() { return this.data; }
    async findById(id) { return this.data.find(c => c.id === id) || null; }
    async create(dto) { const id = 'new-id'; this.data.push({ id, ...dto }); return id; }
    async update() { return true; }
    async delete() { return true; }
    async findByDobAndIdNumber(dateOfBirth, idNumber) {
        // Reuse the mock’s data via findAll so we don’t duplicate storage logic
        const all = await this.findAll();
        return all.find(c => c.dateOfBirth === dateOfBirth && c.idNumber === idNumber) ?? null;
    }
}
const base = {
    firstName: 'Jane',
    lastName: 'Smith',
    dateOfBirth: '1980-05-05',
    sex: 'F',
    eyeColor: 'Blue',
    height: '5\'6"',
    streetAddress: '1 First St',
    city: 'Metro',
    stateUs: 'CA',
    zipcode: '90001',
    idNumber: 'ID999',
    issueDate: '2020-01-01',
    expirationDate: '2030-01-01',
    issuingState: 'CA',
    phone: '555-2222',
    email: 'jane@example.com',
    middleName: undefined,
    suffix: undefined,
};
(0, testHarness_1.test)('application/useCase/customer: CreateCustomerUseCase creates customer', async () => {
    const uc = new CreateCustomerUseCase_1.CreateCustomerUseCase(new MockRepo());
    const id = await uc.execute(base);
    assert_1.default.strictEqual(id, 'new-id');
});
(0, testHarness_1.test)('application/useCase/customer: CreateCustomerUseCase validation error', async () => {
    const uc = new CreateCustomerUseCase_1.CreateCustomerUseCase(new MockRepo());
    const bad = { ...base };
    delete bad.firstName;
    await assert_1.default.rejects(() => uc.execute(bad), (e) => e instanceof errors_1.ValidationError && /firstName/.test(e.message));
});
