"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.makePawnTicketController = makePawnTicketController;
const errors_1 = require("../../application/errors");
function makePawnTicketController(deps) {
    const wrap = (fn) => async (req, res, next) => { try {
        await fn(req, res);
    }
    catch (e) {
        next(e);
    } };
    return {
        create: wrap(async (req, res) => {
            const id = await deps.create.execute(req.body);
            res.status(201).json({ id });
        }),
        search: wrap(async (req, res) => {
            const results = await deps.search.execute({
                customerId: req.query.customerId,
                type: req.query.type,
                startDate: req.query.startDate,
                endDate: req.query.endDate,
                limit: req.query.limit ? Number(req.query.limit) : undefined,
                offset: req.query.offset ? Number(req.query.offset) : undefined,
            });
            res.json(results);
        }),
        get: wrap(async (req, res) => {
            const ticket = await deps.get.execute(req.params.id);
            if (!ticket)
                throw new errors_1.NotFoundError('pawnTicket not found');
            res.json(ticket);
        }),
        updateDates: wrap(async (req, res) => {
            const ok = await deps.updateDates.execute(req.params.id, req.body.maturityDate, req.body.defaultDate);
            res.sendStatus(ok ? 204 : 404);
        }),
        remove: wrap(async (req, res) => {
            const ok = await deps.delete.execute(req.params.id);
            res.sendStatus(ok ? 204 : 404);
        }),
    };
}
