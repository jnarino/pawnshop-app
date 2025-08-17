"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const assert_1 = __importDefault(require("assert"));
const testHarness_1 = require("../../../../testHarness");
const CreateInventoryStatusUseCase_1 = require("../../../../../application/useCase/inventory/status/CreateInventoryStatusUseCase");
const DeactivateInventoryStatusUseCase_1 = require("../../../../../application/useCase/inventory/status/DeactivateInventoryStatusUseCase");
const errors_1 = require("../../../../../application/errors");
class FakeStatusRepo {
    constructor() {
        this.data = [{ code: 'in_inventory', active: true, isTerminal: false, sortOrder: 10 }];
    }
    async list() { return this.data; }
    async find(code) { return this.data.find(d => d.code === code) || null; }
    async insert(row) { this.data.push({ ...row, active: true }); }
    async deactivate(code) { const r = await this.find(code); if (r)
        r.active = false; }
}
(0, testHarness_1.test)('CreateInventoryStatusUseCase: rejects invalid code', async () => {
    const repo = new FakeStatusRepo();
    const uc = new CreateInventoryStatusUseCase_1.CreateInventoryStatusUseCase(repo);
    await assert_1.default.rejects(() => uc.execute({ code: 'Bad-Case' }), (e) => e instanceof errors_1.ValidationError && /invalid code/.test(e.message));
});
(0, testHarness_1.test)('CreateInventoryStatusUseCase: rejects duplicate code', async () => {
    const repo = new FakeStatusRepo();
    const uc = new CreateInventoryStatusUseCase_1.CreateInventoryStatusUseCase(repo);
    await assert_1.default.rejects(() => uc.execute({ code: 'in_inventory' }), (e) => e instanceof errors_1.ValidationError && /already exists/.test(e.message));
});
(0, testHarness_1.test)('CreateInventoryStatusUseCase: creates new code', async () => {
    const repo = new FakeStatusRepo();
    const uc = new CreateInventoryStatusUseCase_1.CreateInventoryStatusUseCase(repo);
    await uc.execute({ code: 'for_sale2', isTerminal: false });
    (0, assert_1.default)(repo.data.some(d => d.code === 'for_sale2'));
});
(0, testHarness_1.test)('DeactivateInventoryStatusUseCase: requires code', async () => {
    const repo = new FakeStatusRepo();
    const uc = new DeactivateInventoryStatusUseCase_1.DeactivateInventoryStatusUseCase(repo);
    await assert_1.default.rejects(() => uc.execute(''), (e) => e instanceof errors_1.ValidationError && /code required/.test(e.message));
});
(0, testHarness_1.test)('DeactivateInventoryStatusUseCase: status not found', async () => {
    const repo = new FakeStatusRepo();
    const uc = new DeactivateInventoryStatusUseCase_1.DeactivateInventoryStatusUseCase(repo);
    await assert_1.default.rejects(() => uc.execute('missing'), (e) => e instanceof errors_1.ValidationError && /not found/.test(e.message));
});
(0, testHarness_1.test)('DeactivateInventoryStatusUseCase: deactivates', async () => {
    const repo = new FakeStatusRepo();
    const uc = new DeactivateInventoryStatusUseCase_1.DeactivateInventoryStatusUseCase(repo);
    await uc.execute('in_inventory');
    const rec = await repo.find('in_inventory');
    assert_1.default.strictEqual(rec?.active, false);
});
