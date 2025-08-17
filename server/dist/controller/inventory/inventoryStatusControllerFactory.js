"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeInventoryStatusController = makeInventoryStatusController;
function makeInventoryStatusController(deps) {
    const wrap = (fn) => async (req, res, next) => {
        try {
            await fn(req, res);
        }
        catch (err) {
            next(err);
        }
    };
    return {
        list: wrap(async (_req, res) => {
            const statuses = await deps.list.execute();
            res.json(statuses);
        }),
        create: wrap(async (req, res) => {
            await deps.create.execute(req.body);
            res.sendStatus(201);
        }),
        remove: wrap(async (req, res) => {
            await deps.deactivate.execute(req.params.code);
            res.sendStatus(204);
        }),
    };
}
