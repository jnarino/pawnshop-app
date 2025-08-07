"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeCustomerController = makeCustomerController;
function makeCustomerController(deps) {
    return {
        getAll: async (req, res, next) => {
            try {
                const data = await deps.list.execute();
                res.json(data);
            }
            catch (e) {
                next(e);
            }
        },
        getById: async (req, res, next) => {
            try {
                const data = await deps.get.execute(req.params.id);
                res.json(data);
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
                await deps.update.execute(req.params.id, req.body);
                res.sendStatus(204);
            }
            catch (e) {
                next(e);
            }
        },
        delete: async (req, res, next) => {
            try {
                await deps.delete.execute(req.params.id);
                res.sendStatus(204);
            }
            catch (e) {
                next(e);
            }
        }
    };
}
