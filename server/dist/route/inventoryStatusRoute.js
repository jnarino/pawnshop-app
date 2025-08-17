"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildInventoryStatusRoute = buildInventoryStatusRoute;
const express_1 = require("express");
const container_1 = require("../container");
function buildInventoryStatusRoute(controller) {
    const router = (0, express_1.Router)();
    router.get('/', controller.list);
    router.post('/', controller.create);
    router.delete('/:code', controller.remove);
    return router;
}
exports.default = buildInventoryStatusRoute(container_1.inventoryStatusController);
