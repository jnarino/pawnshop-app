"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateNewCustomer = validateNewCustomer;
exports.sanitizeCustomer = sanitizeCustomer;
const errors_1 = require("../errors");
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const STATE_RE = /^[A-Z]{2}$/;
function validateNewCustomer(input) {
    const required = ['firstName', 'lastName', 'dateOfBirth'];
    for (const f of required) {
        if (!input[f])
            throw new errors_1.ValidationError(`${String(f)} is required`);
    }
    if (!DATE_RE.test(input.dateOfBirth))
        throw new errors_1.ValidationError('dateOfBirth must be YYYY-MM-DD');
    if (input.email && !EMAIL_RE.test(input.email))
        throw new errors_1.ValidationError('email invalid');
    if (input.stateUs && !STATE_RE.test(input.stateUs))
        throw new errors_1.ValidationError('stateUs invalid');
    return sanitizeCustomer(input);
}
function sanitizeCustomer(c) {
    const trim = (v) => typeof v === 'string' ? v.trim() : v;
    const out = { ...c };
    for (const k of Object.keys(out))
        out[k] = trim(out[k]);
    if (out.email)
        out.email = out.email.toLowerCase();
    return out;
}
