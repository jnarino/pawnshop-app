"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeCategoryController = makeCategoryController;
function makeCategoryController(deps) {
    return {
        async getTree(_req, res) {
            try {
                const data = await deps.tree.execute();
                res.json(data);
            }
            catch (e) {
                res.status(500).json({ error: 'failed_to_load_categories' });
            }
        }
    };
}
