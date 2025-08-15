"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.accessLog = accessLog;
const logger_1 = require("../log/logger");
function accessLog(req, res, next) {
    const start = Date.now();
    const id = req.requestId;
    res.on('finish', () => {
        const ms = Date.now() - start;
        logger_1.logger.info('req', { id, method: req.method, path: req.originalUrl, status: res.statusCode, ms });
    });
    next();
}
