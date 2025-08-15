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
    let appErr;
    if (err instanceof errors_1.AppError)
        appErr = err;
    else if (err instanceof errors_1.ValidationError)
        appErr = err;
    else if (err instanceof errors_1.NotFoundError)
        appErr = err;
    else {
        appErr = new errors_1.InternalError();
    }
    if (appErr.httpStatus >= 500) {
        logger_1.logger.error('unhandled_error', { code: appErr.code, message: err?.message, stack: err?.stack });
    }
    const body = { error: { code: appErr.code, message: appErr.message } };
    if (process.env.NODE_ENV === 'development' && appErr.httpStatus >= 500)
        body.error.stack = err?.stack;
    if (appErr.details)
        body.error.details = appErr.details;
    res.status(appErr.httpStatus).json(body);
}
