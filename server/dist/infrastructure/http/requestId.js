"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.REQUEST_ID_HEADER = void 0;
exports.requestIdMiddleware = requestIdMiddleware;
const crypto_1 = __importDefault(require("crypto"));
exports.REQUEST_ID_HEADER = 'x-request-id';
function requestIdMiddleware(req, res, next) {
    const id = req.headers[exports.REQUEST_ID_HEADER] || crypto_1.default.randomUUID();
    req.requestId = id;
    res.setHeader(exports.REQUEST_ID_HEADER, id);
    next();
}
