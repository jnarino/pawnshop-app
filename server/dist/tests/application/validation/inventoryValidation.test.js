"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const assert_1 = __importDefault(require("assert"));
const inventoryValidation_1 = require("../../../application/validation/inventoryValidation");
const errors_1 = require("../../../application/errors");
const testHarness_1 = require("../../testHarness");
(0, testHarness_1.test)('validation/inventory: create requires type', () => {
    assert_1.default.throws(() => (0, inventoryValidation_1.validateCreateInventoryItem)({}), (e) => e instanceof errors_1.ValidationError && /type/.test(e.message));
});
(0, testHarness_1.test)('validation/inventory: create FIREARM requires firearm attrs', () => {
    assert_1.default.throws(() => (0, inventoryValidation_1.validateCreateInventoryItem)({ type: 'FIREARM', quantity: 1 }), /firearm/i);
});
(0, testHarness_1.test)('validation/inventory: create JEWELRY requires jewelry attrs', () => {
    assert_1.default.throws(() => (0, inventoryValidation_1.validateCreateInventoryItem)({ type: 'JEWELRY', quantity: 1 }), /jewelry/i);
});
(0, testHarness_1.test)('validation/inventory: update rejects negative itemReplace', () => {
    assert_1.default.throws(() => (0, inventoryValidation_1.validateUpdateInventoryItem)({ itemReplace: -1 }), /itemReplace/);
});
(0, testHarness_1.test)('validation/inventory: update FIREARM requires firearm attrs when switching type', () => {
    assert_1.default.throws(() => (0, inventoryValidation_1.validateUpdateInventoryItem)({ type: 'FIREARM' }), /firearm/i);
});
