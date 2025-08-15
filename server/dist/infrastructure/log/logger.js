"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = exports.Logger = void 0;
// Minimal structured logger (console based)
const config_1 = require("../../config");
function ts() { return new Date().toISOString(); }
function base(fields) {
    return { t: ts(), lvl: fields.level, msg: fields.msg, build: config_1.config.buildId, ...fields.ctx };
}
function write(obj) { console.log(JSON.stringify(obj)); }
class Logger {
    constructor(ctx = {}) {
        this.ctx = ctx;
    }
    child(ctx) { return new Logger({ ...this.ctx, ...ctx }); }
    log(level, msg, extra) {
        write(base({ level, msg, ctx: { ...this.ctx, ...extra } }));
    }
    debug(msg, extra) { if (config_1.config.nodeEnv !== 'production')
        this.log('debug', msg, extra); }
    info(msg, extra) { this.log('info', msg, extra); }
    warn(msg, extra) { this.log('warn', msg, extra); }
    error(msg, extra) { this.log('error', msg, extra); }
}
exports.Logger = Logger;
exports.logger = new Logger();
