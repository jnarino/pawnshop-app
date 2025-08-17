"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFound = notFound;
exports.errorHandler = errorHandler;
const errors_1 = require("../../application/errors");
const logger_1 = require("../log/logger");
function notFound(req, _res, next) {
    next(new errors_1.NotFoundError(`Route not found: ${req.method} ${req.originalUrl}`));
}
function errorHandler(err, _req, res, _next) {
    const appErr = err instanceof errors_1.AppError ? err : new errors_1.InternalError();
    const reqId = res.locals?.requestId;
    if (appErr.httpStatus >= 500) {
        logger_1.logger.error('unhandled_error', { code: appErr.code, message: err?.message, stack: err?.stack, requestId: reqId });
    }
    const body = { error: { code: appErr.code, message: appErr.message } };
    if (process.env.NODE_ENV !== 'production' && appErr.httpStatus >= 500)
        body.error.stack = err?.stack;
    if (appErr.details)
        body.error.details = appErr.details;
    res.status(appErr.httpStatus).json(body);
}
