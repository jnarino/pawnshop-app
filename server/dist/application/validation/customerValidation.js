"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateNewCustomer = validateNewCustomer;
exports.sanitizeCustomer = sanitizeCustomer;
const errors_1 = require("../errors");
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/; // YYYY-MM-DD
const STATE_RE = /^[A-Z]{2}$/;
const ZIP_RE = /^\d{5}(?:-\d{4})?$/;
function validateNewCustomer(input) {
    // Required (business rule: must have DOB even though DB allows null)
    const required = ['firstName', 'lastName', 'dateOfBirth'];
    for (const f of required) {
        if (!input[f])
            throw new errors_1.ValidationError(`${String(f)} is required`);
    }
    // Dates
    if (input.dateOfBirth && !DATE_RE.test(input.dateOfBirth))
        throw new errors_1.ValidationError('dateOfBirth must be YYYY-MM-DD');
    if (input.idIssueDate && !DATE_RE.test(input.idIssueDate))
        throw new errors_1.ValidationError('idIssueDate must be YYYY-MM-DD');
    if (input.idExpiration && !DATE_RE.test(input.idExpiration))
        throw new errors_1.ValidationError('idExpiration must be YYYY-MM-DD');
    if (input.idIssueDate && input.idExpiration && input.idIssueDate > input.idExpiration) {
        throw new errors_1.ValidationError('idIssueDate cannot be after idExpiration');
    }
    // Contact
    if (input.email && !EMAIL_RE.test(input.email))
        throw new errors_1.ValidationError('email invalid');
    if (input.stateUs && !STATE_RE.test(input.stateUs))
        throw new errors_1.ValidationError('stateUs invalid');
    if (input.idState && !STATE_RE.test(input.idState))
        throw new errors_1.ValidationError('idState invalid');
    if (input.zipCode && !ZIP_RE.test(input.zipCode))
        throw new errors_1.ValidationError('zipCode invalid');
    if (input.phoneNumber) {
        const digits = input.phoneNumber.replace(/\D/g, '');
        if (digits.length !== 10)
            throw new errors_1.ValidationError('phoneNumber must have 10 digits');
    }
    return sanitizeCustomer(input);
}
function sanitizeCustomer(c) {
    const trim = (v) => typeof v === 'string' ? v.trim() : v;
    const out = { ...c };
    for (const k of Object.keys(out))
        out[k] = trim(out[k]);
    if (out.email)
        out.email = out.email.toLowerCase();
    // Normalize phone formatting to digits only (leave presentation formatting to UI)
    if (out.phoneNumber)
        out.phoneNumber = out.phoneNumber.replace(/\D/g, '');
    return out;
}
