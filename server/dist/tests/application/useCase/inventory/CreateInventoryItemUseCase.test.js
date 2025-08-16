"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const assert_1 = __importDefault(require("assert"));
const CreateInventoryItemUseCase_1 = require("../../../../application/useCase/inventory/CreateInventoryItemUseCase");
const testHarness_1 = require("../../../testHarness");
class InMemoryInventoryRepo {
    constructor() {
        this.items = [];
        this.seq = 1;
    }
    async create(dto) { const id = String(this.seq++); this.items.push({ id, ...dto }); return id; }
    async findById(id) { return this.items.find(i => i.id === id) || null; }
    async findAll() { return this.items; }
    async update() { return true; }
    async delete() { return true; }
}
(0, testHarness_1.test)('application/useCase/inventory: CreateInventoryItemUseCase creates firearm', async () => {
    const repo = new InMemoryInventoryRepo();
    const uc = new CreateInventoryItemUseCase_1.CreateInventoryItemUseCase(repo);
    const id = await uc.execute({
        type: 'FIREARM',
        categoryId: '1',
        itemCondition: 'Good',
        quantity: 1,
        itemReplace: 500,
        itemDescription: 'Test firearm',
        firearm: { caliberGauge: '9MM' }
    });
    assert_1.default.strictEqual(id, '1');
});
(0, testHarness_1.test)('application/useCase/inventory: CreateInventoryItemUseCase missing firearm attrs', async () => {
    const repo = new InMemoryInventoryRepo();
    const uc = new CreateInventoryItemUseCase_1.CreateInventoryItemUseCase(repo);
    await assert_1.default.rejects(() => uc.execute({
        type: 'FIREARM',
        quantity: 1,
    }), /firearm/);
});
