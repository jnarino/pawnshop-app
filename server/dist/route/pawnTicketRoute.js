"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildPawnTicketRoute = buildPawnTicketRoute;
const express_1 = require("express");
const container_1 = require("../container");
function buildPawnTicketRoute(controller) {
    const router = (0, express_1.Router)();
    router.get('/', controller.search); // search/list
    router.post('/', controller.create);
    router.get('/:id', controller.get);
    router.put('/:id/dates', controller.updateDates);
    router.delete('/:id', controller.remove);
    return router;
}
exports.default = buildPawnTicketRoute(container_1.pawnTicketController);
