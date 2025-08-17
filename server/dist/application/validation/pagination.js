"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validatePagination = validatePagination;
const errors_1 = require("../errors");
const config_1 = require("../../config");
function validatePagination(p = {}) {
    const limit = p.limit ?? config_1.config.maxPageSize;
    const offset = p.offset ?? 0;
    if (limit < 1)
        throw new errors_1.ValidationError('limit must be >=1');
    if (offset < 0)
        throw new errors_1.ValidationError('offset must be >=0');
    if (limit > config_1.config.maxPageSize)
        throw new errors_1.ValidationError(`limit must be <= ${config_1.config.maxPageSize}`);
    return { limit, offset };
}
