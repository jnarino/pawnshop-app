"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const assert_1 = __importDefault(require("assert"));
const UpdateInventoryItemUseCase_1 = require("../../../../application/useCase/inventory/UpdateInventoryItemUseCase");
const DeleteInventoryItemUseCase_1 = require("../../../../application/useCase/inventory/DeleteInventoryItemUseCase");
const CreateInventoryItemUseCase_1 = require("../../../../application/useCase/inventory/CreateInventoryItemUseCase");
const testHarness_1 = require("../../../testHarness");
class InMemRepo {
    constructor() {
        this.data = [];
        this.seq = 1;
    }
    async create(dto) { const id = String(this.seq++); this.data.push({ id, status: dto.status ?? 'in_inventory', ...dto }); return id; }
    async findById(id) { return this.data.find(d => d.id === id) || null; }
    async findAll() { return this.data; }
    async update(id, dto) { const idx = this.data.findIndex(d => d.id === id); if (idx === -1)
        return false; this.data[idx] = { ...this.data[idx], ...dto }; return true; }
    async delete(id) { const before = this.data.length; this.data = this.data.filter(d => d.id !== id); return this.data.length !== before; }
}
function makeRepoWithItem() {
    const repo = new InMemRepo();
    const create = new CreateInventoryItemUseCase_1.CreateInventoryItemUseCase(repo);
    return { repo, create };
}
(0, testHarness_1.test)('application/useCase/inventory: UpdateInventoryItemUseCase updates fields', async () => {
    const { repo, create } = makeRepoWithItem();
    const id = await create.execute({ type: 'FIREARM', firearm: { caliberGauge: '9MM' }, quantity: 1 });
    const updateUC = new UpdateInventoryItemUseCase_1.UpdateInventoryItemUseCase(repo);
    const ok = await updateUC.execute(id, { itemCondition: 'Excellent', quantity: 2 });
    assert_1.default.strictEqual(ok, true);
    const item = await repo.findById(id);
    assert_1.default.strictEqual(item?.itemCondition, 'Excellent');
    assert_1.default.strictEqual(item?.quantity, 2);
});
(0, testHarness_1.test)('application/useCase/inventory: UpdateInventoryItemUseCase returns false on missing', async () => {
    const repo = new InMemRepo();
    const updateUC = new UpdateInventoryItemUseCase_1.UpdateInventoryItemUseCase(repo);
    const ok = await updateUC.execute('nope', { itemCondition: 'Bad' });
    assert_1.default.strictEqual(ok, false);
});
(0, testHarness_1.test)('application/useCase/inventory: DeleteInventoryItemUseCase deletes item', async () => {
    const { repo, create } = makeRepoWithItem();
    const id = await create.execute({ type: 'JEWELRY', jewelry: { metal: 'Gold' }, quantity: 1 });
    const delUC = new DeleteInventoryItemUseCase_1.DeleteInventoryItemUseCase(repo);
    const ok = await delUC.execute(id);
    assert_1.default.strictEqual(ok, true);
    const still = await repo.findById(id);
    assert_1.default.strictEqual(still, null);
});
(0, testHarness_1.test)('application/useCase/inventory: DeleteInventoryItemUseCase missing returns false', async () => {
    const repo = new InMemRepo();
    const delUC = new DeleteInventoryItemUseCase_1.DeleteInventoryItemUseCase(repo);
    const ok = await delUC.execute('missing');
    assert_1.default.strictEqual(ok, false);
});
