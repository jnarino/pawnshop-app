"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const assert_1 = __importDefault(require("assert"));
const InventoryRepository_1 = require("../../../infrastructure/persistence/InventoryRepository");
const testHarness_1 = require("../../testHarness");
(0, testHarness_1.test)('infrastructure/persistence: mapRowToInventoryItem basic', () => {
    const row = {
        id: '10',
        inventoryNumber: '1000-1',
        status: 'in_inventory',
        categoryId: '1',
        brand: 'Glock',
        model: '19',
        serialNumber: 'SN123',
        color: 'Black',
        itemCondition: 'Good',
        quantity: 1,
        amount: 100,
        resale: 300,
        itemReplace: 450.75,
        binNumber: 'A1',
        ownerTag: 'OWN1',
        itemDescription: '9mm pistol',
        attributes: { caliberGauge: '9MM', finish: 'Black' },
        createdAt: '2025-08-15T12:00:00Z',
        updatedAt: '2025-08-15T12:10:00Z'
    };
    const mapped = (0, InventoryRepository_1.mapRowToInventoryItem)(row);
    assert_1.default.strictEqual(mapped.id, '10');
    assert_1.default.strictEqual(mapped.inventoryNumber, '1000-1');
    assert_1.default.strictEqual(mapped.attributes.caliberGauge, '9MM');
});
(0, testHarness_1.test)('infrastructure/persistence: mapRowToInventoryItem attributes only', () => {
    const row = {
        id: '11',
        inventoryNumber: '1000-2',
        status: 'for_sale',
        categoryId: '5',
        quantity: 1,
        itemReplace: 1250,
        itemDescription: 'Gold ring',
        attributes: { metal: 'Gold', weight: 15.2, stones: [{ type: 'Diamond' }] },
        createdAt: '2025-08-16T10:00:00Z',
        updatedAt: '2025-08-16T10:05:00Z'
    };
    const mapped = (0, InventoryRepository_1.mapRowToInventoryItem)(row);
    assert_1.default.strictEqual(mapped.id, '11');
    assert_1.default.strictEqual(mapped.categoryId, '5');
    assert_1.default.strictEqual(mapped.itemReplace, 1250);
    assert_1.default.ok(Array.isArray(mapped.attributes.stones));
});
