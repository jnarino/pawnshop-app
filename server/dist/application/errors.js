"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InternalError = exports.NotFoundError = exports.ValidationError = exports.AppError = void 0;
// Central application error types with uniform shape
class AppError extends Error {
    constructor(code, httpStatus, message, details) {
        super(message);
        this.code = code;
        this.httpStatus = httpStatus;
        this.details = details;
        this.name = 'AppError';
    }
}
exports.AppError = AppError;
class ValidationError extends AppError {
    constructor(message, details) { super('VALIDATION_ERROR', 400, message, details); this.name = 'ValidationError'; }
}
exports.ValidationError = ValidationError;
class NotFoundError extends AppError {
    constructor(message) { super('NOT_FOUND', 404, message); this.name = 'NotFoundError'; }
}
exports.NotFoundError = NotFoundError;
class InternalError extends AppError {
    constructor(message = 'Internal Error') { super('INTERNAL_ERROR', 500, message); this.name = 'InternalError'; }
}
exports.InternalError = InternalError;
