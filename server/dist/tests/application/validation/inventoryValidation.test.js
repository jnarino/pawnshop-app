"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const assert_1 = __importDefault(require("assert"));
const inventoryValidation_1 = require("../../../application/validation/inventoryValidation");
const errors_1 = require("../../../application/errors");
const testHarness_1 = require("../../testHarness");
(0, testHarness_1.test)('validation/inventory: create requires categoryId', () => {
    assert_1.default.throws(() => (0, inventoryValidation_1.validateCreateInventoryItem)({}), (e) => e instanceof errors_1.ValidationError && /categoryId/.test(e.message));
});
(0, testHarness_1.test)('validation/inventory: update rejects negative itemReplace', () => {
    assert_1.default.throws(() => (0, inventoryValidation_1.validateUpdateInventoryItem)({ itemReplace: -1 }), /itemReplace/);
});
(0, testHarness_1.test)('validation/inventory: update allows partial without categoryId', () => {
    const cleaned = (0, inventoryValidation_1.validateUpdateInventoryItem)({ itemReplace: 10 });
    assert_1.default.strictEqual(cleaned.itemReplace, 10);
});
