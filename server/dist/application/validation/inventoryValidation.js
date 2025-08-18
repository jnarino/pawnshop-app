"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerCreateTypeValidator = registerCreateTypeValidator;
exports.validateCreateInventoryItem = validateCreateInventoryItem;
exports.validateUpdateInventoryItem = validateUpdateInventoryItem;
exports.sanitizeInventoryItem = sanitizeInventoryItem;
const errors_1 = require("../errors");
const inventoryStatusTransitions_1 = require("../../domain/inventory/inventoryStatusTransitions");
const NUM = (v) => typeof v === 'number' && !isNaN(v);
const POS_INT = (v) => Number.isInteger(v) && v > 0;
const NON_NEG = (v) => typeof v === 'number' && v >= 0;
// Type-specific validators removed in new schema (attributes JSON + category drive semantics)
function registerCreateTypeValidator(_type, _fn) { }
function baseNumericValidation(input) {
    if (input.quantity !== undefined && !POS_INT(input.quantity))
        throw new errors_1.ValidationError('quantity must be positive integer');
    if (input.amount !== undefined && !NON_NEG(input.amount))
        throw new errors_1.ValidationError('amount must be non-negative number');
    if (input.resale !== undefined && !NON_NEG(input.resale))
        throw new errors_1.ValidationError('resale must be non-negative number');
    if (input.itemReplace !== undefined && !NON_NEG(input.itemReplace))
        throw new errors_1.ValidationError('itemReplace must be non-negative number');
}
function validateCreateInventoryItem(input) {
    if (!input.categoryId)
        throw new errors_1.ValidationError('categoryId required');
    baseNumericValidation(input);
    if (input.quantity === undefined)
        input.quantity = 1;
    if (!input.attributes)
        input.attributes = {};
    return sanitizeInventoryItem(input);
}
function validateUpdateInventoryItem(input) {
    baseNumericValidation(input);
    if (input.status && input.currentStatus && !(0, inventoryStatusTransitions_1.canTransition)(input.currentStatus, input.status)) {
        throw new errors_1.ValidationError(`invalid status transition ${input.currentStatus} -> ${input.status}`);
    }
    return sanitizeInventoryItem(input);
}
function sanitizeInventoryItem(item) {
    const trim = (v) => typeof v === 'string' ? v.trim() : v;
    const out = { ...item };
    for (const k of Object.keys(out))
        if (k !== 'attributes')
            out[k] = trim(out[k]);
    return out;
}
