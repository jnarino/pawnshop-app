"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildInventoryRoute = buildInventoryRoute;
const express_1 = require("express");
const container_1 = require("../container");
function buildInventoryRoute(controller) {
    const router = (0, express_1.Router)();
    router.get('/', controller.list);
    router.get('/:id', controller.get);
    router.post('/', controller.create);
    router.put('/:id', controller.update);
    router.delete('/:id', controller.delete);
    return router;
}
// Default route wired with container-managed controller
exports.default = buildInventoryRoute(container_1.inventoryController);
