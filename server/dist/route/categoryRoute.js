"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildCategoryRoute = buildCategoryRoute;
const express_1 = require("express");
const container_1 = require("../container");
function buildCategoryRoute(controller) {
    const router = (0, express_1.Router)();
    router.get('/tree', controller.getTree.bind(controller));
    return router;
}
exports.default = buildCategoryRoute(container_1.categoryController);
