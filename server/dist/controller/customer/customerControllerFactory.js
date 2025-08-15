"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeCustomerController = makeCustomerController;
const errors_1 = require("../../application/errors");
function parsePagination(req) {
    const limitRaw = req.query.limit;
    const offsetRaw = req.query.offset;
    const toNum = (v) => v == null ? undefined : Number(v);
    const limit = toNum(limitRaw);
    const offset = toNum(offsetRaw);
    if ((limitRaw && Number.isNaN(limit)) || (offsetRaw && Number.isNaN(offset)))
        throw new errors_1.ValidationError('limit/offset must be numbers');
    return { limit, offset };
}
function wrap(fn) {
    return (req, res, next) => { Promise.resolve(fn(req, res, next)).catch(next); };
}
function makeCustomerController(deps) {
    return {
        list: wrap(async (req, res) => { const pg = parsePagination(req); const data = await deps.list.execute(pg); res.json(data); }),
        get: wrap(async (req, res) => { const c = await deps.get.execute(req.params.id); if (!c) {
            res.sendStatus(404);
            return;
        } res.json(c); }),
        create: wrap(async (req, res) => { const id = await deps.create.execute(req.body); res.status(201).json({ id }); }),
        update: wrap(async (req, res) => { const ok = await deps.update.execute(req.params.id, req.body); res.sendStatus(ok ? 204 : 404); }),
        remove: wrap(async (req, res) => { const ok = await deps.delete.execute(req.params.id); res.sendStatus(ok ? 204 : 404); }),
    };
}
