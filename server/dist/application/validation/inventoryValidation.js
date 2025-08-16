"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateCreateInventoryItem = validateCreateInventoryItem;
exports.validateUpdateInventoryItem = validateUpdateInventoryItem;
exports.sanitizeInventoryItem = sanitizeInventoryItem;
const errors_1 = require("../errors");
const NUM = (v) => typeof v === 'number' && !isNaN(v);
const POS_INT = (v) => Number.isInteger(v) && v > 0;
const NON_NEG = (v) => typeof v === 'number' && v >= 0;
function validateCreateInventoryItem(input) {
    if (!input.type)
        throw new errors_1.ValidationError('type is required');
    if (input.quantity !== undefined && !POS_INT(input.quantity))
        throw new errors_1.ValidationError('quantity must be positive integer');
    if (input.amount !== undefined && !NON_NEG(input.amount))
        throw new errors_1.ValidationError('amount must be non-negative number');
    if (input.resale !== undefined && !NON_NEG(input.resale))
        throw new errors_1.ValidationError('resale must be non-negative number');
    if (input.itemReplace !== undefined && !NON_NEG(input.itemReplace))
        throw new errors_1.ValidationError('itemReplace must be non-negative number');
    if (input.type === 'FIREARM' && !input.firearm)
        throw new errors_1.ValidationError('firearm attributes required for FIREARM type');
    if (input.type === 'JEWELRY' && !input.jewelry)
        throw new errors_1.ValidationError('jewelry attributes required for JEWELRY type');
    return sanitizeInventoryItem(input);
}
function validateUpdateInventoryItem(input) {
    if (input.quantity !== undefined && !POS_INT(input.quantity))
        throw new errors_1.ValidationError('quantity must be positive integer');
    for (const f of ['amount', 'resale', 'itemReplace']) {
        const v = input[f];
        if (v !== undefined && !NON_NEG(v))
            throw new errors_1.ValidationError(`${f} must be non-negative number`);
    }
    if (input.type === 'FIREARM' && !input.firearm)
        throw new errors_1.ValidationError('firearm attributes required when changing type to FIREARM');
    if (input.type === 'JEWELRY' && !input.jewelry)
        throw new errors_1.ValidationError('jewelry attributes required when changing type to JEWELRY');
    return sanitizeInventoryItem(input);
}
function sanitizeInventoryItem(item) {
    const trim = (v) => typeof v === 'string' ? v.trim() : v;
    const out = { ...item };
    for (const k of Object.keys(out))
        out[k] = trim(out[k]);
    return out;
}
