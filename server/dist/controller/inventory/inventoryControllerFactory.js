"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeInventoryController = makeInventoryController;
const errors_1 = require("../../application/errors");
function makeInventoryController(deps) {
    return {
        list: async (req, res, next) => {
            try {
                const { limit, offset } = req.query;
                const items = await deps.list.execute({
                    limit: limit ? Number(limit) : undefined,
                    offset: offset ? Number(offset) : undefined,
                });
                res.json(items);
            }
            catch (e) {
                next(e);
            }
        },
        get: async (req, res, next) => {
            try {
                const item = await deps.get.execute(req.params.id);
                if (!item)
                    throw new errors_1.NotFoundError('Inventory item not found');
                res.json(item);
            }
            catch (e) {
                next(e);
            }
        },
        create: async (req, res, next) => {
            try {
                const id = await deps.create.execute(req.body);
                res.status(201).json({ id });
            }
            catch (e) {
                next(e);
            }
        },
        update: async (req, res, next) => {
            try {
                const ok = await deps.update.execute(req.params.id, req.body);
                if (!ok)
                    throw new errors_1.NotFoundError('Inventory item not found');
                res.sendStatus(204);
            }
            catch (e) {
                next(e);
            }
        },
        delete: async (req, res, next) => {
            try {
                const ok = await deps.delete.execute(req.params.id);
                if (!ok)
                    throw new errors_1.NotFoundError('Inventory item not found');
                res.sendStatus(204);
            }
            catch (e) {
                next(e);
            }
        },
    };
}
